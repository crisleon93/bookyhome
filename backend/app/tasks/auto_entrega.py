"""
auto_entrega.py
---------------
Job diario que detecta órdenes en estado 'enviado' cuya guía fue registrada
hace más de DIAS_LIMITE días y las marca automáticamente como 'entregada'.

Protege al vendedor ante compradores que recibieron el pedido pero nunca
presionaron "Confirmar entrega" y luego abren un reclamo.

Flujo:
  1. Busca en MySQL todas las órdenes con estado_orden = 'enviado' y
     envios.fecha_despacho <= HOY - DIAS_LIMITE.
  2. Para cada una:
     a. Cambia estado_orden → 'entregada'
     b. Cambia envios.estado_envio → 'Entregado (automático)'
     c. Notifica al COMPRADOR: su pedido fue marcado como entregado (panel + correo).
     d. Notifica al VENDEDOR: el pedido fue confirmado automáticamente (panel + correo).
  3. Registra en consola cuántas órdenes fueron procesadas.
"""

import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger("auto_entrega")

# Días de espera antes de confirmar automáticamente
DIAS_LIMITE = 10


def _enviar_correo_sync(coro):
    """Ejecuta una corrutina de email desde un contexto sincrónico."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # En algunos entornos el loop ya está corriendo (ej. uvicorn)
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                future.result(timeout=15)
        else:
            loop.run_until_complete(coro)
    except Exception as e:
        logger.warning(f"[auto_entrega] No se pudo enviar correo: {e}")


def ejecutar_auto_confirmacion():
    """Función principal que ejecuta el job. Es llamada por APScheduler."""
    logger.info("[auto_entrega] Iniciando revisión de órdenes pendientes de confirmación...")

    from app.database import get_db
    from app.email import is_smtp_configured, get_frontend_url, FastMail, conf, _build_branded_message, _email_header_html, _email_hero_html, _email_info_box_html, _email_button_html, _email_footer_html, BRAND

    db = get_db()
    cursor = db.cursor(dictionary=True)

    smtp_ok = is_smtp_configured()
    frontend_url = get_frontend_url()

    try:
        # Buscar órdenes enviadas hace más de DIAS_LIMITE días
        cursor.execute("""
            SELECT
                oc.id_orden,
                oc.id_usuario        AS id_comprador,
                oc.total,
                e.fecha_despacho,
                e.numero_guia,
                e.empresa_mensajeria,
                t.id_usuario         AS id_vendedor,
                t.nombre_tienda,
                DATEDIFF(CURDATE(), e.fecha_despacho) AS dias_transcurridos
            FROM ordenes_compra oc
            JOIN envios e        ON e.id_orden   = oc.id_orden
            JOIN detalle_orden d ON d.id_orden   = oc.id_orden
            JOIN libros l        ON l.id_libro   = d.id_libro
            JOIN tiendas t       ON t.id_tienda  = l.id_tienda
            WHERE oc.estado_orden = 'enviado'
              AND e.fecha_despacho IS NOT NULL
              AND DATEDIFF(CURDATE(), e.fecha_despacho) >= %s
            GROUP BY oc.id_orden, oc.id_usuario, oc.total,
                     e.fecha_despacho, e.numero_guia, e.empresa_mensajeria,
                     t.id_usuario, t.nombre_tienda
        """, (DIAS_LIMITE,))

        ordenes = cursor.fetchall()

        if not ordenes:
            logger.info("[auto_entrega] No hay órdenes que necesiten confirmación automática.")
            return

        procesadas = 0

        for orden in ordenes:
            id_orden      = orden["id_orden"]
            id_comprador  = orden["id_comprador"]
            id_vendedor   = orden["id_vendedor"]
            nombre_tienda = orden["nombre_tienda"]
            dias          = orden["dias_transcurridos"]

            try:
                # 1. Actualizar estado de la orden
                cursor.execute(
                    "UPDATE ordenes_compra SET estado_orden = 'entregada' WHERE id_orden = %s AND estado_orden = 'enviado'",
                    (id_orden,)
                )

                # 2. Actualizar estado del envío
                cursor.execute(
                    "UPDATE envios SET estado_envio = 'Entregado (automático)' WHERE id_orden = %s",
                    (id_orden,)
                )

                # 3. Obtener correos de comprador y vendedor
                cursor.execute("""
                    SELECT u.correo_usuario, u.nombre_usuario
                    FROM usuarios u
                    WHERE u.id_usuario IN (%s, %s)
                """, (id_comprador, id_vendedor))
                usuarios = {row["id_usuario"] if "id_usuario" in row else None: row
                            for row in cursor.fetchall()}

                # Re-query con id explícito
                cursor.execute("SELECT correo_usuario, nombre_usuario FROM usuarios WHERE id_usuario = %s", (id_comprador,))
                comprador_info = cursor.fetchone() or {}
                cursor.execute("SELECT correo_usuario, nombre_usuario FROM usuarios WHERE id_usuario = %s", (id_vendedor,))
                vendedor_info = cursor.fetchone() or {}

                # 4. Notificación en panel al comprador
                cursor.execute("""
                    INSERT INTO notificaciones
                        (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                    VALUES (%s, 'entrega', 'Pedido marcado como entregado', %s, %s, FALSE, NOW())
                """, (
                    id_comprador,
                    (
                        f'Tu pedido #{id_orden} de "{nombre_tienda}" fue marcado automáticamente como entregado '
                        f'porque han pasado {dias} días desde el despacho. '
                        f'Si no lo recibiste, puedes abrir un reclamo.'
                    ),
                    id_orden,
                ))

                # 5. Notificación en panel al vendedor
                cursor.execute("""
                    INSERT INTO notificaciones
                        (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                    VALUES (%s, 'entrega', 'Entrega confirmada automáticamente', %s, %s, FALSE, NOW())
                """, (
                    id_vendedor,
                    (
                        f'El pedido #{id_orden} fue marcado como entregado automáticamente '
                        f'porque han pasado {dias} días desde el despacho y el comprador no confirmó la recepción.'
                    ),
                    id_orden,
                ))

                db.commit()
                procesadas += 1
                logger.info(f"[auto_entrega] Orden #{id_orden} marcada como entregada ({dias} días desde despacho).")

                # 6. Correo al comprador
                if smtp_ok and comprador_info.get("correo_usuario"):
                    nombre_c = comprador_info.get("nombre_usuario", "Cliente")
                    enlace   = f"{frontend_url}/?seccion=Mis%20Compras"
                    content_c = f"""
                        {_email_header_html()}
                        {_email_hero_html("📦", "Tu pedido fue marcado como entregado")}
                        <p style="font-size:13.5px;line-height:1.5;margin:0 0 12px;color:{BRAND['gris_carbon']};">
                            Hola <strong>{nombre_c}</strong>, tu pedido
                            <strong>#{id_orden}</strong> de <strong>{nombre_tienda}</strong>
                            fue marcado automáticamente como <em>entregado</em> porque han pasado
                            <strong>{dias} días</strong> desde que fue despachado.
                        </p>
                        {_email_info_box_html(
                            "¿No lo recibiste?",
                            "Si el pedido no llegó, puedes abrir un reclamo desde tu panel de compras. "
                            "El equipo de BookyHome revisará el caso junto con la guía de envío.",
                            BRAND["rojo_suave"],
                        )}
                        {_email_button_html("Ver mis compras", enlace)}
                        {_email_footer_html()}
                    """
                    msg_c = _build_branded_message(
                        subject=f"Pedido #{id_orden} marcado como entregado — BookyHome",
                        recipients=[comprador_info["correo_usuario"]],
                        html_content=content_c,
                    )
                    _enviar_correo_sync(FastMail(conf).send_message(msg_c))

                # 7. Correo al vendedor
                if smtp_ok and vendedor_info.get("correo_usuario"):
                    nombre_v  = vendedor_info.get("nombre_usuario", "Vendedor")
                    enlace_v  = f"{frontend_url}/mi-tienda?seccion=Pedidos"
                    content_v = f"""
                        {_email_header_html()}
                        {_email_hero_html("✅", "Entrega confirmada automáticamente")}
                        <p style="font-size:13.5px;line-height:1.5;margin:0 0 12px;color:{BRAND['gris_carbon']};">
                            Hola <strong>{nombre_v}</strong>, el pedido
                            <strong>#{id_orden}</strong> fue marcado automáticamente como
                            <em>entregado</em> porque han pasado <strong>{dias} días</strong>
                            desde el despacho y el comprador no confirmó la recepción manualmente.
                        </p>
                        {_email_info_box_html(
                            "¿Qué significa esto?",
                            "La venta queda registrada como completada. Si el comprador abre un reclamo, "
                            "la guía de envío registrada en el sistema servirá como evidencia de despacho.",
                            BRAND["vinotinto"],
                        )}
                        {_email_button_html("Ver mis pedidos", enlace_v)}
                        {_email_footer_html()}
                    """
                    msg_v = _build_branded_message(
                        subject=f"Pedido #{id_orden} confirmado automáticamente — BookyHome",
                        recipients=[vendedor_info["correo_usuario"]],
                        html_content=content_v,
                    )
                    _enviar_correo_sync(FastMail(conf).send_message(msg_v))

            except Exception as e:
                db.rollback()
                logger.error(f"[auto_entrega] Error procesando orden #{id_orden}: {e}")

        logger.info(f"[auto_entrega] Finalizado. {procesadas}/{len(ordenes)} órdenes procesadas.")

    except Exception as e:
        logger.error(f"[auto_entrega] Error general en el job: {e}")
    finally:
        cursor.close()
        db.close()
