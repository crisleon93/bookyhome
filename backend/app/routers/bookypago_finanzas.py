"""
Router para el sistema de finanzas BookyPago
Gestión de ingresos, pagos a vendedores, planes e impulsos
"""

import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from typing import Dict, List, Optional
from pydantic import BaseModel

from app.auth import verify_token
from app.models.bookypago_finanzas import bookypago_finanzas, BookyPagoFinanzas, _load_store, PAGOS_VENDEDORES_FILE
from app.database import get_db


class NominaRequest(BaseModel):
    referencia: Optional[str] = None
    id_metodo: Optional[int] = None


class CuentaBancaria(BaseModel):
    id_metodo: int
    tipo_cuenta: str
    banco: str
    numero_cuenta: str
    nombre_titular: str
    cedula_titular: str
    es_principal: bool

load_dotenv()

router = APIRouter()
security = HTTPBearer()

# Configuración desde .env
BOOKYPAGO_CONFIG = {
    'comision_venta': float(os.getenv('BOOKYPAGO_COMISION_VENTA', '0.10')),
    'comision_impulso': float(os.getenv('BOOKYPAGO_COMISION_IMPULSO', '0.05')),
    'comision_plan': float(os.getenv('BOOKYPAGO_COMISION_PLAN', '0.02')),
    'minimo_pago': float(os.getenv('BOOKYPAGO_MINIMO_PAGO', '50000')),
    'dias_pago': int(os.getenv('BOOKYPAGO_DIAS_PAGO', '7'))
}

bookypago_finanzas_configurado = BookyPagoFinanzas(BOOKYPAGO_CONFIG)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica el token del usuario actual"""
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload


def check_admin_role(user: dict):
    """Verifica que el usuario sea admin"""
    if user.get('rol') not in ['admin', 'administrador']:
        raise HTTPException(status_code=403, detail="Solo administradores pueden acceder")


@router.get("/balance")
def obtener_balance(user=Depends(get_current_user)):
    """
    Obtiene el balance financiero de BookyHome
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        balance = bookypago_finanzas_configurado.obtener_balance()
        return {"ok": True, "balance": balance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo balance: {str(e)}")


@router.post("/ingreso/venta")
def registrar_ingreso_venta(
    id_venta: int,
    monto_venta: float,
    id_vendedor: int,
    user=Depends(get_current_user)
):
    """
    Registra el ingreso de BookyHome por una venta
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        resultado = bookypago_finanzas_configurado.registrar_ingreso_venta(
            id_venta=id_venta,
            monto_venta=monto_venta,
            id_vendedor=id_vendedor
        )
        
        if not resultado["ok"]:
            raise HTTPException(status_code=400, detail=resultado["error"])
        
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registrando ingreso: {str(e)}")


@router.post("/ingreso/plan")
def registrar_ingreso_plan(
    id_tienda: int,
    id_plan: int,
    monto_plan: float,
    periodicidad: str,
    user=Depends(get_current_user)
):
    """
    Registra el ingreso por suscripción de plan
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        resultado = bookypago_finanzas_configurado.registrar_ingreso_plan(
            id_tienda=id_tienda,
            id_plan=id_plan,
            monto_plan=monto_plan,
            periodicidad=periodicidad
        )
        
        if not resultado["ok"]:
            raise HTTPException(status_code=400, detail=resultado["error"])
        
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registrando ingreso: {str(e)}")


@router.post("/ingreso/impulso")
def registrar_ingreso_impulso(
    id_impulso: int,
    id_tienda: int,
    monto_impulso: float,
    user=Depends(get_current_user)
):
    """
    Registra el ingreso por impulso promocional
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        resultado = bookypago_finanzas_configurado.registrar_ingreso_impulso(
            id_impulso=id_impulso,
            id_tienda=id_tienda,
            monto_impulso=monto_impulso
        )
        
        if not resultado["ok"]:
            raise HTTPException(status_code=400, detail=resultado["error"])
        
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registrando ingreso: {str(e)}")


@router.get("/pagos-pendientes/{id_vendedor}")
def obtener_pagos_pendientes_vendedor(id_vendedor: int, user=Depends(get_current_user)):
    """
    Obtiene los pagos pendientes de un vendedor
    
    Roles: Admin, Vendedor (sus propios pagos)
    """
    try:
        # Si es vendedor, solo puede ver sus propios pagos
        if user.get('rol') == 'vendedor' and int(user.get('sub')) != id_vendedor:
            raise HTTPException(status_code=403, detail="Solo puedes ver tus propios pagos")
        
        pagos = bookypago_finanzas_configurado.obtener_pagos_pendientes_vendedor(id_vendedor)
        return {"ok": True, "pagos_pendientes": pagos}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo pagos: {str(e)}")


@router.get("/historial-pagos/{id_vendedor}")
def obtener_historial_pagos_vendedor(id_vendedor: int, user=Depends(get_current_user)):
    """
    Obtiene el historial de pagos procesados de un vendedor
    
    Roles: Admin, Vendedor (sus propios pagos)
    """
    try:
        # Si es vendedor, solo puede ver sus propios pagos
        if user.get('rol') == 'vendedor' and int(user.get('sub')) != id_vendedor:
            raise HTTPException(status_code=403, detail="Solo puedes ver tus propios pagos")
        
        pagos_vendedores = _load_store(PAGOS_VENDEDORES_FILE)
        
        if isinstance(pagos_vendedores, dict):
            pagos_vendedores = []
        
        # Filtrar pagos procesados del vendedor
        historial = [
            p for p in pagos_vendedores 
            if p['id_vendedor'] == id_vendedor and p['estado'] == 'procesado'
        ]
        
        # Agrupar por referencia (cada lote de pagos)
        historial_agrupado = {}
        for pago in historial:
            ref = pago.get('referencia', 'sin_referencia')
            if ref not in historial_agrupado:
                historial_agrupado[ref] = {
                    'id': len(historial_agrupado) + 1,
                    'referencia': ref,
                    'monto': 0,
                    'num_pagos': 0,
                    'fecha': pago.get('fecha_pago', pago.get('fecha_venta')),
                    'pagos': []
                }
            historial_agrupado[ref]['monto'] += pago['monto']
            historial_agrupado[ref]['num_pagos'] += 1
            historial_agrupado[ref]['pagos'].append(pago)
        
        return {"ok": True, "historial": list(historial_agrupado.values())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo historial: {str(e)}")


@router.get("/nomina")
def obtener_nomina(user=Depends(get_current_user)):
    """
    Obtiene la nómina: todos los pagos pendientes agrupados por vendedor
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        nomina = bookypago_finanzas_configurado.obtener_nomina()
        return {"ok": True, "nomina": nomina}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo nómina: {str(e)}")


@router.post("/cuentas-bancarias/{id_vendedor}")
def agregar_cuenta_bancaria(
    id_vendedor: int,
    tipo_cuenta: str = Body(...),
    banco: str = Body(...),
    numero_cuenta: str = Body(...),
    nombre_titular: str = Body(...),
    cedula_titular: str = Body(...),
    es_principal: bool = Body(False),
    user=Depends(get_current_user)
):
    """
    Agrega una cuenta bancaria para un vendedor
    
    Roles: Admin, Vendedor (sus propias cuentas)
    """
    try:
        # Si es vendedor, solo puede agregar sus propias cuentas
        if user.get('rol') == 'vendedor' and int(user.get('sub')) != id_vendedor:
            raise HTTPException(status_code=403, detail="Solo puedes agregar tus propias cuentas")
        
        db = get_db()
        try:
            cursor = db.cursor(dictionary=True)
            # Obtener id_tienda del vendedor
            cursor.execute(
                "SELECT id_tienda FROM tiendas WHERE id_usuario = %s",
                (id_vendedor,)
            )
            tienda_result = cursor.fetchone()
            
            if not tienda_result:
                raise HTTPException(status_code=404, detail="Vendedor no encontrado")
            
            id_tienda = tienda_result['id_tienda']
            
            # Si se marca como principal, desmarcar las otras
            if es_principal:
                cursor.execute(
                    "UPDATE metodos_cobro_vendedor SET es_principal = 0 WHERE id_tienda = %s",
                    (id_tienda,)
                )
            
            # Insertar nueva cuenta
            cursor.execute(
                """
                INSERT INTO metodos_cobro_vendedor 
                (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal, verificado)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
                """,
                (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal)
            )
            db.commit()
            
            return {"ok": True, "mensaje": "Cuenta bancaria agregada exitosamente"}
        finally:
            if 'cursor' in locals():
                cursor.close()
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error agregando cuenta bancaria: {str(e)}")


@router.put("/cuentas-bancarias/{id_vendedor}/principal/{id_cuenta}")
def marcar_cuenta_principal(id_vendedor: int, id_cuenta: int, user=Depends(get_current_user)):
    """
    Marca una cuenta bancaria como principal para nómina
    
    Roles: Admin, Vendedor (sus propias cuentas)
    """
    try:
        # Si es vendedor, solo puede modificar sus propias cuentas
        if user.get('rol') == 'vendedor' and int(user.get('sub')) != id_vendedor:
            raise HTTPException(status_code=403, detail="Solo puedes modificar tus propias cuentas")
        
        db = get_db()
        try:
            cursor = db.cursor(dictionary=True)
            # Obtener id_tienda del vendedor
            cursor.execute(
                "SELECT id_tienda FROM tiendas WHERE id_usuario = %s",
                (id_vendedor,)
            )
            tienda_result = cursor.fetchone()
            
            if not tienda_result:
                raise HTTPException(status_code=404, detail="Vendedor no encontrado")
            
            id_tienda = tienda_result['id_tienda']
            
            # Desmarcar todas las cuentas del vendedor
            cursor.execute(
                "UPDATE metodos_cobro_vendedor SET es_principal = 0 WHERE id_tienda = %s",
                (id_tienda,)
            )
            
            # Marcar la cuenta seleccionada como principal
            cursor.execute(
                "UPDATE metodos_cobro_vendedor SET es_principal = 1 WHERE id_metodo = %s AND id_tienda = %s",
                (id_cuenta, id_tienda)
            )
            db.commit()
            
            return {"ok": True, "mensaje": "Cuenta principal actualizada"}
        finally:
            if 'cursor' in locals():
                cursor.close()
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando cuenta principal: {str(e)}")


@router.delete("/cuentas-bancarias/{id_vendedor}/{id_cuenta}")
def eliminar_cuenta_bancaria(id_vendedor: int, id_cuenta: int, user=Depends(get_current_user)):
    """
    Elimina una cuenta bancaria de un vendedor
    
    Roles: Admin, Vendedor (sus propias cuentas)
    """
    try:
        # Si es vendedor, solo puede eliminar sus propias cuentas
        if user.get('rol') == 'vendedor' and int(user.get('sub')) != id_vendedor:
            raise HTTPException(status_code=403, detail="Solo puedes eliminar tus propias cuentas")
        
        db = get_db()
        try:
            cursor = db.cursor(dictionary=True)
            # Obtener id_tienda del vendedor
            cursor.execute(
                "SELECT id_tienda FROM tiendas WHERE id_usuario = %s",
                (id_vendedor,)
            )
            tienda_result = cursor.fetchone()
            
            if not tienda_result:
                raise HTTPException(status_code=404, detail="Vendedor no encontrado")
            
            id_tienda = tienda_result['id_tienda']
            
            # Eliminar la cuenta
            cursor.execute(
                "DELETE FROM metodos_cobro_vendedor WHERE id_metodo = %s AND id_tienda = %s",
                (id_cuenta, id_tienda)
            )
            db.commit()
            
            return {"ok": True, "mensaje": "Cuenta bancaria eliminada"}
        finally:
            if 'cursor' in locals():
                cursor.close()
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando cuenta bancaria: {str(e)}")


@router.get("/cuentas-bancarias/{id_vendedor}")
def obtener_cuentas_bancarias_vendedor(id_vendedor: int, user=Depends(get_current_user)):
    """
    Obtiene las cuentas bancarias registradas de un vendedor
    
    Roles: Admin, Vendedor (sus propias cuentas)
    """
    try:
        # Si es vendedor, solo puede ver sus propias cuentas
        if user.get('rol') == 'vendedor' and int(user.get('sub')) != id_vendedor:
            raise HTTPException(status_code=403, detail="Solo puedes ver tus propias cuentas")
        
        db = get_db()
        try:
            cursor = db.cursor(dictionary=True)
            # Primero obtener el id_tienda del vendedor
            cursor.execute(
                "SELECT id_tienda FROM tiendas WHERE id_usuario = %s",
                (id_vendedor,)
            )
            tienda_result = cursor.fetchone()
            
            if not tienda_result:
                raise HTTPException(status_code=404, detail="Vendedor no encontrado")
            
            id_tienda = tienda_result['id_tienda']
            
            # Obtener cuentas bancarias
            cursor.execute(
                """
                SELECT id_metodo, tipo_cuenta, banco, numero_cuenta, 
                       nombre_titular, cedula_titular, es_principal, verificado
                FROM metodos_cobro_vendedor
                WHERE id_tienda = %s
                ORDER BY es_principal DESC, fecha_registro ASC
                """,
                (id_tienda,)
            )
            cuentas = cursor.fetchall()
            
            return {"ok": True, "cuentas": cuentas}
        finally:
            if 'cursor' in locals():
                cursor.close()
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo cuentas bancarias: {str(e)}")


@router.post("/nomina/procesar/{id_vendedor}")
def procesar_nomina_vendedor(id_vendedor: int, data: NominaRequest, user=Depends(get_current_user)):
    """
    Procesa todos los pagos pendientes de un vendedor en lote
    Usa automáticamente la cuenta bancaria principal del vendedor
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        # Obtener cuenta principal del vendedor
        db = get_db()
        try:
            cursor = db.cursor(dictionary=True)
            cursor.execute(
                "SELECT id_tienda FROM tiendas WHERE id_usuario = %s",
                (id_vendedor,)
            )
            tienda_result = cursor.fetchone()
            
            if not tienda_result:
                raise HTTPException(status_code=404, detail="Vendedor no encontrado")
            
            id_tienda = tienda_result['id_tienda']
            
            if data.id_metodo:
                cursor.execute(
                    """
                    SELECT id_metodo, banco, tipo_cuenta, numero_cuenta, nombre_titular, cedula_titular
                    FROM metodos_cobro_vendedor
                    WHERE id_tienda = %s AND id_metodo = %s
                    LIMIT 1
                    """,
                    (id_tienda, data.id_metodo)
                )
            else:
                cursor.execute(
                    """
                    SELECT id_metodo, banco, tipo_cuenta, numero_cuenta, nombre_titular, cedula_titular
                    FROM metodos_cobro_vendedor
                    WHERE id_tienda = %s
                    ORDER BY es_principal DESC, fecha_registro ASC
                    LIMIT 1
                    """,
                    (id_tienda,)
                )
            cuenta_principal = cursor.fetchone()

            if not cuenta_principal:
                raise HTTPException(
                    status_code=400,
                    detail="El vendedor no tiene cuentas bancarias registradas en Mi Tienda"
                )
        finally:
            if 'cursor' in locals():
                cursor.close()
            db.close()

        referencia = (data.referencia or "").strip()
        if not referencia:
            ultimos_digitos = str(cuenta_principal["numero_cuenta"])[-4:]
            referencia = (
                f"TRF-{cuenta_principal['banco'][:12]}-"
                f"{ultimos_digitos}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            )

        resultado = bookypago_finanzas_configurado.procesar_nomina_vendedor(id_vendedor, referencia)
        
        if not resultado["ok"]:
            raise HTTPException(status_code=400, detail=resultado["error"])
        
        # Agregar información de la cuenta bancaria usada
        resultado["cuenta_bancaria"] = {
            "id_metodo": cuenta_principal["id_metodo"],
            "banco": cuenta_principal["banco"],
            "tipo_cuenta": cuenta_principal["tipo_cuenta"],
            "numero_cuenta": cuenta_principal["numero_cuenta"],
            "titular": cuenta_principal["nombre_titular"],
            "cedula_titular": cuenta_principal.get("cedula_titular"),
        }
        resultado["referencia"] = referencia
        
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando nómina: {str(e)}")


@router.post("/procesar-pago/{id_pago}")
def procesar_pago_vendedor(id_pago: int, user=Depends(get_current_user)):
    """
    Procesa un pago a un vendedor
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        resultado = bookypago_finanzas_configurado.procesar_pago_vendedor(id_pago)
        
        if not resultado["ok"]:
            raise HTTPException(status_code=400, detail=resultado["error"])
        
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando pago: {str(e)}")


@router.get("/historial")
def obtener_historial_financiero(dias: int = 30, user=Depends(get_current_user)):
    """
    Obtiene el historial financiero de los últimos N días
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        historial = bookypago_finanzas_configurado.obtener_historial_financiero(dias)
        return {"ok": True, "historial": historial}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo historial: {str(e)}")


@router.get("/estadisticas")
def obtener_estadisticas(user=Depends(get_current_user)):
    """
    Obtiene estadísticas financieras
    
    Roles: Admin
    """
    check_admin_role(user)
    
    try:
        estadisticas = bookypago_finanzas_configurado.obtener_estadisticas()
        return {"ok": True, "estadisticas": estadisticas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")


@router.get("/api/v1/bookypago-finanzas/config")
def obtener_configuracion(user=Depends(get_current_user)):
    """
    Obtiene la configuración actual de BookyPago Finanzas
    
    Roles: Admin
    """
    check_admin_role(user)
    
    return {
        "ok": True,
        "configuracion": BOOKYPAGO_CONFIG
    }