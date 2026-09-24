import logging
import os
import unicodedata
from typing import Literal, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from app.auth import verify_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/asistente", tags=["Asistente IA"])
# A diferencia de las rutas privadas, el asistente tambien debe atender visitantes.
sesion_opcional = HTTPBearer(auto_error=False)


class MensajeChat(BaseModel):
    rol: Literal["user", "assistant"]
    contenido: str


class ChatRequest(BaseModel):
    mensaje: str
    contexto: Optional[str] = None
    pagina: Optional[str] = Field(default=None, max_length=200)
    historial: list[MensajeChat] = Field(default_factory=list)


class ChatResponse(BaseModel):
    respuesta: str
    proveedor: str


def etiqueta_usuario(usuario: Optional[dict]) -> str:
    if not usuario:
        return "visitante"
    return str(usuario.get("rol") or "comprador").lower()


def saludo_personalizado(usuario: Optional[dict], pagina: Optional[str]) -> str:
    rol = etiqueta_usuario(usuario)
    nombre = (usuario or {}).get("nombre") or ""
    nombre_saludo = f", {nombre}" if nombre else ""

    if rol == "vendedor":
        return (
            f"Hola{nombre_saludo}! Estoy para ayudarte con tu libreria: publicaciones, inventario, "
            "pedidos, ofertas y ventas. Que necesitas revisar?"
        )
    if rol in {"comprador", "usuario", "cliente"}:
        if pagina and "carrito" in pagina.lower():
            return f"Hola{nombre_saludo}! Estas en tu carrito. Puedo orientarte para modificarlo o continuar con la compra."
        return f"Hola{nombre_saludo}! Puedo ayudarte a buscar libros, gestionar tus compras, direcciones, pedidos y envios. Que necesitas?"
    return (
        "Hola! Bienvenido a BookyHome. Puedes explorar libros y librerias sin una cuenta. "
        "Cuando quieras comprar, guardar favoritos o seguir un pedido, podras registrarte. Que buscas?"
    )


def normalizar(texto: str) -> str:
    """Permite reconocer preguntas con o sin tildes y signos de puntuacion."""
    sin_tildes = "".join(
        caracter
        for caracter in unicodedata.normalize("NFD", texto.lower())
        if unicodedata.category(caracter) != "Mn"
    )
    return " ".join(sin_tildes.split())


def contiene(texto: str, terminos: tuple) -> bool:
    return any(normalizar(termino) in texto for termino in terminos)


def buscar_respuesta(texto: str, reglas: tuple) -> Optional[str]:
    for terminos, respuesta in reglas:
        if contiene(texto, terminos):
            return respuesta
    return None


# ---------------------------------------------------------------------------
# REGLAS DE FALLBACK — se usan cuando Gemini no esta disponible
# ---------------------------------------------------------------------------

RESPUESTAS_VISITANTE = (
    # Saludos y conversacion casual
    (("hola", "buenos dias", "buenas tardes", "buenas noches", "buenas", "hey", "hi", "hello",
      "como estas", "como te llamas", "quien eres", "q tal", "que tal", "que tal todo"),
     "Hola! Soy Booky, tu asistente en BookyHome. Puedo ayudarte a buscar libros, conocer librerias o entender como funciona la plataforma. Que necesitas?"),
    (("gracias", "muchas gracias", "te lo agradezco", "genial", "perfecto", "excelente",
      "ok gracias", "listo gracias", "de nada", "chevere", "bacano"),
     "Con gusto! Si necesitas algo mas, aqui estare."),
    (("adios", "hasta luego", "chao", "bye", "nos vemos", "hasta pronto", "me voy"),
     "Hasta luego! Que encuentres el libro que buscas."),
    (("ayuda", "ayudame", "no entiendo", "no se", "que hago", "q hago", "no sé como"),
     "Claro, estoy aqui para ayudarte. Puedes preguntarme sobre como buscar libros, crear una cuenta, comprar, rastrear un pedido o registrar tu libreria. Por donde empezamos?"),
    # Identidad y plataforma
    (("que es bookyhome", "q es bookyhome", "para que sirve", "de que trata", "como funciona bookyhome",
      "que es esto", "q es esto"),
     "BookyHome es una plataforma colombiana donde puedes comprar y vender libros. Hay librerias independientes, coleccionistas y vendedores particulares. Puedes explorar el catalogo sin cuenta y registrarte cuando quieras comprar o vender. Que te gustaria hacer?"),
    (("soy nuevo", "nuevo aqui", "nueva aqui", "como funciona", "que puedo hacer", "q puedo hacer",
      "como usar", "por donde empiezo", "donde empiezo"),
     "Bienvenido a BookyHome!\n\n- Explora el catalogo y filtra libros por categoria o precio.\n- Ve el detalle de cada libro y la libreria que lo vende.\n- Crea una cuenta gratis para comprar, guardar favoritos o vender.\n\nQuieres buscar libros o registrarte?"),
    (("q", "que", "que es", "q es", "q hay", "que hay"),
     "Soy Booky, tu asistente de BookyHome. Puedo ayudarte a explorar libros, crear una cuenta, entender como comprar y vender, o responder preguntas sobre la plataforma. Que necesitas saber?"),
    # Cuenta y acceso
    (("es gratis", "cuesta algo", "tiene costo", "debo pagar para registrarme", "registrarse es gratis",
      "cobran por registrarse"),
     "Si, crear una cuenta en BookyHome es completamente gratis. Solo necesitas un correo y una contrasena."),
    (("registro", "registrar", "registrate", "registrarme", "crear cuenta", "abrir cuenta", "como me registro",
      "quiero registrarme"),
     "Para crear tu cuenta selecciona 'Registrarse' en la parte superior. Completa tus datos, correo y contrasena, acepta los terminos y confirma el correo si se te solicita. Despues podras iniciar sesion y comprar."),
    (("correo de confirmacion", "confirmar correo", "verificar correo", "no llega el correo",
      "no me llego el correo", "no recibo el correo"),
     "Revisa la bandeja de entrada y la carpeta de spam. Si el correo no llega en unos minutos, solicita el reenvio desde la pantalla de confirmacion o contacta a soporte."),
    (("iniciar sesion", "inicio sesion", "login", "entrar", "acceder", "no puedo entrar",
      "no me deja entrar", "no me deja iniciar"),
     "Selecciona 'Iniciar sesion' e ingresa tu correo y contrasena. Si olvidaste tu contrasena, usa la opcion 'Olvidaste tu contrasena?' para recuperarla por correo."),
    (("contrasena", "contraseña", "olvide", "olvide la contrasena", "recuperar contrasena",
      "cambiar contrasena", "no recuerdo mi contrasena"),
     "En la pantalla de inicio de sesion haz clic en 'Olvidaste tu contrasena?', ingresa tu correo y recibiras un enlace para crear una nueva. Revisa tambien la carpeta de spam."),
    # Exploracion sin cuenta
    (("explorar", "ver sin cuenta", "sin iniciar sesion", "sin registrarme", "sin haberme registrado",
      "puedo ver sin cuenta", "sin cuenta"),
     "Si. Sin registrarte puedes explorar el catalogo completo, buscar libros, usar filtros y ver el detalle de cada publicacion. Solo necesitas cuenta para agregar al carrito, comprar, guardar favoritos o contactar una tienda."),
    # Busqueda y catalogo
    (("buscar", "como busco", "catalogo", "categoria", "categorias", "filtro", "filtros",
      "encontrar libro", "buscar libro", "buscar por autor", "buscar por titulo"),
     "En el catalogo puedes escribir el titulo, autor o categoria en el buscador y usar los filtros para afinar los resultados. Abre el detalle de un libro para ver su precio, disponibilidad y libreria."),
    (("disponible", "hay stock", "existencias", "precio", "cuanto cuesta", "detalle del libro",
      "informacion del libro", "como sé el precio"),
     "En el detalle de cada libro veras su precio, disponibilidad y la libreria que lo vende. Si tienes dudas sobre una publicacion, contacta directamente a la tienda desde la misma pagina."),
    # Librerias
    (("libreria", "libreria", "tienda", "librerias", "ver librerias", "como contacto una libreria",
      "perfil de la libreria"),
     "Puedes visitar el perfil de cada libreria para ver sus libros y su informacion. Para escribirles necesitas tener una cuenta activa."),
    # Compra
    (("como compro", "como se compra", "comprar un libro", "quiero comprar", "proceso de compra",
      "pasos para comprar"),
     "Para comprar necesitas una cuenta. Una vez dentro:\n\n1. Agrega el libro al carrito desde su detalle.\n2. Ve al carrito y revisa los productos.\n3. Confirma tu direccion y metodo de pago.\n4. Finaliza el pedido.\n\nAun no tienes cuenta?"),
    (("comprar", "carrito", "pago", "necesito cuenta"),
     "Puedes explorar BookyHome sin cuenta. Para agregar al carrito, pagar, guardar favoritos o consultar pedidos, primero registrate o inicia sesion."),
    # Venta
    (("vender", "como vendo", "quiero vender", "ser vendedor", "crear libreria", "crear tienda",
      "publicar libros", "vender libros"),
     "Para vender en BookyHome:\n\n1. Crea una cuenta gratis.\n2. Registra tu libreria desde tu perfil.\n3. Publica tus libros con foto, precio y descripcion.\n\nCon eso ya puedes recibir pedidos, manejar inventario, promociones y cobros."),
    # Seguridad
    (("seguro", "seguridad", "privacidad", "datos personales", "es confiable", "es seguro"),
     "BookyHome protege tu informacion. Nunca compartas tu contrasena, codigos de verificacion ni datos bancarios por chat. Verifica siempre los detalles del pedido antes de confirmar una compra."),
)

RESPUESTAS_COMPRADOR = (
    # Saludos
    (("hola", "buenos dias", "buenas tardes", "buenas noches", "buenas", "hey", "como estas", "q tal"),
     "Hola! Estoy aqui para ayudarte. Puedo orientarte con el catalogo, tu carrito, compras, pedidos, envios o tu cuenta. Que necesitas?"),
    (("gracias", "muchas gracias", "genial", "perfecto", "excelente", "ok gracias", "listo gracias", "chevere"),
     "Con gusto! Si necesitas algo mas, aqui estare."),
    (("adios", "hasta luego", "chao", "bye", "nos vemos"),
     "Hasta luego! Que disfrutes tu compra."),
    # Cuenta
    (("registro", "registrar", "crear cuenta"),
     "Ya tienes una sesion iniciada.\n\nDesde tu **perfil** puedes actualizar tus datos, direcciones y preferencias. Si deseas entrar con otra cuenta, primero cierra la sesion actual."),
    # Busqueda
    (("buscar", "catalogo", "categoria", "filtro", "filtros", "encontrar libro", "buscar libro"),
     "En Catalogo puedes buscar por texto y usar los filtros disponibles. Abre el detalle del libro para revisar la libreria, precio y disponibilidad antes de anadirlo al carrito."),
    # Favoritos
    (("favorito", "favoritos", "lista de deseos", "guardar libro", "guardados"),
     "Desde el detalle de un libro puedes guardarlo en favoritos o en una lista de deseos. Puedes consultarlos y administrarlos desde tu panel."),
    # Carrito
    (("agregar al carrito", "anadir al carrito", "carrito", "quitar producto", "eliminar producto",
      "cantidad", "modificar carrito", "cambiar cantidad"),
     "Anade un libro desde su detalle. En Carrito puedes revisar los productos, cambiar cantidades o eliminar articulos antes de continuar. El carrito se conserva mientras mantengas tu sesion activa."),
    # Compra y checkout
    (("como compro", "finalizar compra", "hacer pedido", "realizar pedido", "proceso de compra",
      "checkout", "pasos para comprar"),
     "Para finalizar tu compra:\n\n1. Revisa el carrito y ajusta cantidades si es necesario.\n2. Confirma tu direccion de entrega.\n3. Elige el metodo de pago.\n4. Confirma el pedido.\n\nVerifica todo antes de finalizar."),
    # Problemas de pago
    (("pago rechazado", "pago fallido", "problema de pago", "no puedo pagar", "error al pagar",
      "fallo el pago"),
     "Confirma que los datos ingresados y el metodo de pago sean correctos. Si el problema continua, crea un ticket en Soporte tecnico con el mensaje de error que ves en pantalla."),
    (("metodo de pago", "formas de pago", "pagar", "como pago", "medios de pago"),
     "Los metodos disponibles se muestran durante el checkout. Selecciona el que prefieras y revisa el resumen del pedido antes de confirmar el pago."),
    # Pedidos
    (("donde esta mi pedido", "donde esta mi compra", "estado del pedido", "seguimiento", "rastrear pedido",
      "cuando llega", "cuando me llega"),
     "Ve a **Mis compras** para ver el estado actual de cada pedido.\n\nSi hay numero de guia o informacion de mensajeria, aparece dentro del detalle del pedido."),
    (("pedido", "mis compras", "historial", "estado de compra", "ver mis pedidos"),
     "Consulta Mis compras para ver tus pedidos y su estado. Abre un pedido para revisar sus detalles, el pago y la informacion de envio disponible."),
    # Envio
    (("envio", "entrega", "domicilio", "guia", "mensajeria", "retiro", "como me llega",
      "informacion de envio"),
     "En el detalle de Mis compras puedes confirmar la direccion, el metodo de entrega y el estado del envio. Si existe informacion de guia o mensajeria, aparecera alli."),
    # Direcciones
    (("direccion", "mis direcciones", "cambiar direccion", "agregar direccion", "nueva direccion",
      "editar direccion"),
     "Desde Mis direcciones puedes crear, editar, eliminar o marcar una direccion principal. Revisa que este correcta antes de confirmar una compra."),
    # Cancelacion
    (("cancelar pedido", "cancelar compra", "anular pedido", "como cancelo", "quiero cancelar"),
     "Abre el pedido en **Mis compras**.\n\n- Si esta en estado **pendiente**, veras la opcion de cancelar.\n- Si ya fue pagado o enviado, usa **Quejas y reclamos** con los datos del pedido."),
    # Devolucion
    (("devolucion", "devolver libro", "reembolso", "quiero devolver", "como devuelvo"),
     "Consulta la opcion Devoluciones para revisar pedidos elegibles y crear tu solicitud. Para casos relacionados con un pedido tambien puedes usar Quejas y reclamos y adjuntar evidencia."),
    # Resenias
    (("resena", "calificar", "calificacion", "dejar resena", "opinar sobre"),
     "Puedes consultar las resenias de libros y librerias. Cuando la plataforma habilite la opcion para tu compra, podras dejar una calificacion desde el area correspondiente."),
    # Cupones y descuentos
    (("cupon", "descuento", "oferta", "promocion", "codigo de descuento", "tengo un cupon"),
     "Revisa las ofertas y cupones disponibles antes de finalizar la compra. Lee sus condiciones y vigencia; el descuento aplicable se reflejara en el resumen correspondiente."),
    # Notificaciones
    (("notificacion", "novedades", "avisos", "alertas"),
     "Puedes revisar tus notificaciones desde el panel y ajustar tus preferencias en Configuracion."),
    # Perfil
    (("perfil", "cambiar datos", "editar datos", "foto de perfil", "configuracion", "mi cuenta"),
     "Desde Mi perfil y Configuracion puedes consultar o actualizar tus datos y preferencias. Usa una contrasena segura y cierra sesion si estas en un equipo compartido."),
    # Quejas
    (("queja", "reclamo", "reclamacion", "abrir queja", "tengo un problema con mi pedido"),
     "En Quejas y reclamos puedes crear una solicitud vinculada a un pedido, describir el caso y adjuntar evidencia si aplica. Alli tambien podras consultar su estado y respuestas."),
    # Soporte
    (("soporte", "error", "falla", "no funciona", "problema tecnico", "bug", "reporte un error"),
     "Para errores de la plataforma usa Soporte tecnico. Describe que estabas haciendo, el mensaje de error y si puedes adjunta una captura. Para un problema de pedido o devolucion usa Quejas y reclamos."),
)

RESPUESTAS_VENDEDOR = (
    # Saludos
    (("hola", "buenos dias", "buenas tardes", "buenas noches", "buenas", "hey", "como estas", "q tal"),
     "Hola! Estoy aqui para ayudarte con tu libreria. Puedo orientarte sobre publicaciones, inventario, pedidos, envios, promociones, cobros y mas. Que necesitas?"),
    (("gracias", "muchas gracias", "genial", "perfecto", "excelente", "ok gracias", "listo gracias"),
     "Con gusto! Si necesitas algo mas, aqui estare."),
    (("adios", "hasta luego", "chao", "bye", "nos vemos"),
     "Hasta luego! Mucho exito con tu libreria."),
    # Registro y configuracion
    (("registrar libreria", "crear tienda", "crear libreria", "configurar tienda", "como creo mi libreria"),
     "Completa el registro y la configuracion de tu libreria desde el panel de vendedor. Verifica cuidadosamente los datos publicos, las politicas y la informacion necesaria antes de empezar a publicar."),
    # Publicar libros
    (("publicar", "nuevo libro", "agregar libro", "crear publicacion", "como publico", "subir libro"),
     "Para publicar un libro:\n\n1. Ve a **Publicar libro** en tu panel.\n2. Completa titulo, autor, categoria, descripcion y precio.\n3. Agrega una imagen clara del libro.\n4. Revisa todo y publica.\n\nEl libro queda visible en el catalogo de inmediato."),
    (("editar libro", "modificar libro", "actualizar libro", "eliminar libro", "borrar libro",
      "cambiar precio", "actualizar precio"),
     "En Mis libros puedes abrir una publicacion para editar su informacion, disponibilidad o stock. Si deseas retirarla, usa la opcion correspondiente y revisa las restricciones que pueda tener por pedidos asociados."),
    # Stock e inventario
    (("stock", "inventario", "existencias", "agotado", "disponibilidad", "se acabo el stock",
      "sin existencias", "como actualizo el stock"),
     "Gestiona el stock desde Mis libros. Mantén las existencias actualizadas para evitar ventas de libros que ya no esten disponibles. Si el stock llega a 0, el libro se marca automaticamente como no disponible."),
    # Variantes
    (("variante", "tapa dura", "tapa blanda", "libro digital", "pdf", "epub", "edicion"),
     "Al publicar puedes gestionar variantes como tapa blanda, tapa dura o digital con sus precios y existencias. Para una variante digital, carga el archivo permitido que recibira el comprador tras la compra."),
    # Pedidos y ventas
    (("pedido", "orden", "nueva venta", "ventas", "mis ventas", "ver pedidos", "pedidos recibidos"),
     "Consulta Pedidos y Ventas para revisar las compras recibidas, sus detalles y el estado de cada orden. Atiende los pedidos a tiempo y mantén al comprador informado cuando corresponda."),
    (("por que no me llegan ventas", "no tengo ventas", "como aumento ventas", "poca visibilidad"),
     "Puedes mejorar la visibilidad completando bien la descripcion, usando buenas fotos y activando un impulso desde la seccion Impulsos. Tambien revisa que el precio sea competitivo y que el stock este actualizado."),
    # Envio
    (("envio", "guia", "mensajeria", "despachar", "como envio", "numero de guia", "registrar guia"),
     "Desde Envios consulta el pedido, registra la empresa de mensajeria y el numero de guia cuando aplique. Revisa con atencion los datos de entrega antes de despachar."),
    # Promociones y cupones
    (("promocion", "oferta", "descuento", "como creo una oferta", "crear descuento"),
     "En Promociones puedes gestionar ofertas para tus libros. Define la informacion solicitada, revisa sus condiciones y confirma que los precios publicados sean correctos."),
    (("cupon", "codigo de descuento", "crear cupon", "cupones"),
     "Desde Cupones puedes crear y administrar codigos promocionales de tu tienda. Define claramente las condiciones y vigencia para que los compradores los usen correctamente."),
    # Cobros y pagos
    (("metodo de cobro", "cuenta bancaria", "recibir pago", "pago vendedor", "cuando me pagan",
      "como recibo mi dinero", "cobro"),
     "Revisa Metodos de cobro para mantener actualizada la informacion requerida para recibir pagos. Los pagos se procesan segun el ciclo definido en la plataforma. No compartas datos bancarios sensibles por este chat."),
    # Calificaciones
    (("calificacion", "resena", "opiniones", "que opinan de mi tienda", "mis calificaciones"),
     "Consulta Calificaciones para conocer la opinion de los compradores sobre tu tienda. Usalas para mejorar la atencion y la informacion de tus publicaciones."),
    # Mensajes y notificaciones
    (("mensaje", "mensajes", "chat", "notificacion", "consulta de un comprador"),
     "Revisa Mensajes y Notificaciones desde tu panel de vendedor para atender consultas y novedades relacionadas con tus publicaciones y pedidos."),
    # Quejas
    (("queja", "reclamo", "reclamacion", "queja de un comprador"),
     "En Quejas y reclamos revisa los casos recibidos, sus evidencias y el historial de mensajes. Responde de forma clara para avanzar en la solucion del caso."),
    # Soporte
    (("soporte", "error", "falla", "no funciona", "problema tecnico", "bug"),
     "Para problemas tecnicos de BookyHome crea un ticket desde Soporte tecnico, detallando el paso que fallo y el mensaje mostrado. Para asuntos de una orden usa Quejas y reclamos."),
    # Suscripcion
    (("suscripcion", "plan", "planes", "cual plan elijo", "diferencia de planes"),
     "En Suscripciones puedes consultar los planes disponibles, el estado de tu suscripcion y su historial. Revisa las caracteristicas y condiciones antes de contratar o cancelar un plan."),
    # Impulsos
    (("impulso", "destacar libro", "destacar publicacion", "mayor visibilidad", "como destaco mi libreria"),
     "Desde Impulsos puedes consultar las opciones para dar mayor visibilidad a tu tienda o publicaciones. Revisa alcance, duracion y costo antes de confirmar."),
    # Perfil y configuracion
    (("perfil", "configuracion", "politica de envio", "politica de devolucion", "datos de mi tienda",
      "editar mi tienda"),
     "En Perfil y Configuracion puedes actualizar los datos publicos de tu libreria, contacto y politicas. Mantén esta informacion clara y vigente para los compradores."),
)


def respuesta_local(mensaje: str, usuario: Optional[dict] = None, pagina: Optional[str] = None) -> str:
    texto = (mensaje or "").strip()
    if not texto:
        return "Escribe tu pregunta para que pueda ayudarte."

    t = normalizar(texto)
    rol = etiqueta_usuario(usuario)
    es_visitante = rol == "visitante"

    if es_visitante:
        return buscar_respuesta(t, RESPUESTAS_VISITANTE) or (
            "Puedo ayudarte a conocer BookyHome, buscar libros y librerias, crear una cuenta o entender como comprar y vender. Dime que quieres hacer."
        )

    if rol == "vendedor":
        return buscar_respuesta(t, RESPUESTAS_VENDEDOR) or (
            "Puedo ayudarte con tu libreria: publicaciones, inventario, pedidos, envios, promociones, cupones, cobros, suscripciones e impulsos. Dime que necesitas hacer."
        )

    return buscar_respuesta(t, RESPUESTAS_COMPRADOR) or (
        "Puedo ayudarte con catalogo, carrito, compras, pagos, envios, direcciones, favoritos, devoluciones, soporte y tu cuenta. Dime que necesitas hacer."
    )


INSTRUCCIONES_BOOKYHOME = """
Eres Booky, el asistente virtual oficial de BookyHome, una plataforma colombiana de compra y venta de libros.
Responde siempre en espanol claro, calido y natural. Saluda de manera amable cuando corresponda y conversa como un asistente util, no como un menu automatico.

Tu alcance: ayudar a compradores y vendedores a usar BookyHome. Puedes orientar sobre catalogo, busqueda y filtros, detalles de libros, carrito, compra, pagos, pedidos, envios, direcciones, cuentas, recuperacion de contrasena, favoritos, resenias, librerias, publicacion de libros, inventario, ofertas, cupones y panel de vendedor.

Reglas:
- Usa el historial para entender referencias como "ese libro", "si" o "y despues?".
- No inventes precios, stock, estados de pedido, politicas, plazos, datos de librerias ni acciones que no recibiste como contexto. Explica donde puede comprobarlos el usuario.
- Da pasos concretos y breves cuando el usuario pregunte como realizar una accion.
- Si faltan datos para resolver un caso particular, pide solo el dato necesario (por ejemplo, numero de pedido o mensaje de error), sin solicitar contrasenas, codigos de verificacion ni datos bancarios.
- Para temas ajenos a BookyHome puedes responder brevemente si son inocuos, pero aclara que tu especialidad es la plataforma.
- Si el usuario reporta un problema de pago, cuenta o pedido que no puede resolverse desde la interfaz, indicale que use la seccion Soporte.
- No digas que realizaste acciones en la cuenta del usuario ni prometas resultados futuros.
- Termina siempre tus respuestas con una idea completa. No dejes frases, listas ni pasos inconclusos; si el espacio no alcanza, resume en vez de cortar la respuesta. Nunca termines con una pregunta a medias ni con una frase que espere continuacion.
""".strip()


def es_saludo_predeterminado(texto: str) -> bool:
    """Solo filtra los saludos de bienvenida generados automaticamente por el bot,
    nunca mensajes reales del usuario."""
    t = normalizar(texto or "")
    if not t:
        return False
    frases_bot = (
        "soy booky tu companero lector",
        "soy booky, tu companero lector",
        "hola soy booky tu companero lector",
        "bienvenido a bookyhome puedes explorar",
        "puedo ayudarte a conocer bookyhome",
    )
    return any(frase in t for frase in frases_bot)


def historial_para_modelo(historial: list[MensajeChat]) -> list[dict[str, str]]:
    """Limita el contexto para conservar continuidad sin enviar conversaciones enormes."""
    return [
        {"role": item.rol, "content": item.contenido.strip()}
        for item in historial[-12:]
        if item.contenido and item.contenido.strip() and not es_saludo_predeterminado(item.contenido)
    ]


def configuracion_ia() -> tuple:
    """Obtiene el proveedor configurado sin exponer sus credenciales."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        return (
            gemini_key,
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai"),
            "gemini",
        )

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        return (
            openai_key,
            os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            "openai",
        )

    return None, None, None, "local"



# Modelos de respaldo en orden de preferencia cuando el principal falla con 503.
GEMINI_FALLBACK_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]


async def _llamar_modelo(api_key: str, base_url: str, model: str, messages: list, payload_base: dict) -> Optional[str]:
    """Intenta una sola llamada a un modelo. Devuelve el contenido o None si falla."""
    url = f"{base_url.rstrip('/')}/chat/completions"
    payload = {**payload_base, "model": model}
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                url,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        if response.status_code == 503:
            logger.warning("Modelo %s con alta demanda (503), probando siguiente...", model)
            return None
        if response.status_code >= 400:
            logger.error("Modelo %s HTTP %s — %s", model, response.status_code, response.text[:300])
            return None
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        if not content or not content.strip():
            logger.warning("Modelo %s devolvio contenido vacio", model)
            return None
        logger.info("Modelo %s OK — %d chars", model, len(content))
        return content.strip()
    except httpx.TimeoutException:
        logger.error("Timeout en modelo %s (>25 s)", model)
        return None
    except Exception as exc:
        logger.exception("Error inesperado en modelo %s: %s", model, exc)
        return None


async def generar_respuesta_ia(
    mensaje: str,
    contexto: Optional[str] = None,
    historial: Optional[list[MensajeChat]] = None,
    usuario: Optional[dict] = None,
    pagina: Optional[str] = None,
) -> str:
    api_key, model, base_url, proveedor = configuracion_ia()
    if not api_key:
        logger.warning("No hay clave de IA configurada — usando respuesta local.")
        return respuesta_local(mensaje, usuario, pagina)

    contenido = mensaje.strip()
    if contexto:
        contenido = f"Informacion adicional disponible:\n{contexto}\n\nMensaje actual del usuario: {mensaje}"

    messages = [{"role": "system", "content": INSTRUCCIONES_BOOKYHOME}]
    messages.extend(historial_para_modelo(historial or []))
    messages.append({"role": "user", "content": contenido})

    payload_base = {
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 1200,
    }

    # Lista de modelos a intentar: el configurado primero, luego los de respaldo
    modelos_a_intentar = [model] + [m for m in GEMINI_FALLBACK_MODELS if m != model]
    logger.info("Iniciando llamada a %s — modelo principal: %s", proveedor, model)

    for modelo_actual in modelos_a_intentar:
        resultado = await _llamar_modelo(api_key, base_url, modelo_actual, messages, payload_base)
        if resultado is not None:
            return resultado

    logger.error("Todos los modelos fallaron — usando respuesta local")
    return respuesta_local(mensaje, usuario, pagina)


@router.post("/chat", response_model=ChatResponse)
async def chat_asistente(
    request: ChatRequest,
    credenciales: Optional[HTTPAuthorizationCredentials] = Depends(sesion_opcional),
):
    if not request.mensaje or not request.mensaje.strip():
        raise HTTPException(status_code=400, detail="Debes escribir una pregunta.")

    usuario = verify_token(credenciales.credentials) if credenciales else None
    respuesta = await generar_respuesta_ia(
        request.mensaje,
        request.contexto,
        request.historial,
        usuario,
        request.pagina,
    )
    _, _, _, proveedor = configuracion_ia()
    return ChatResponse(respuesta=respuesta, proveedor=proveedor)
