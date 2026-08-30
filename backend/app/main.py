# ========================

# Configuración principal de FastAPI

# ========================

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler

from app.routers import libros



from app.routers.usuarios import router as usuarios_router

from app.routers.libreria import router as libreria_router

from app.routers.auth import router as auth_router

from app.routers.carrito import router as carrito_router

from app.routers.stored import router as stored_router

from app.routers.payments import router as payments_router

from app.routers import ofertas

from app.routers.resenas import router as resenas_router

from app.routers.perfil import router as perfil_router

from app.routers.tienda_configuracion import router as configuracion_router

from app.routers.catalogo import router as catalogo_router

from app.routers.chat import router as chat_router

from app.routers.notificaciones import router as notificaciones_router

from app.routers.historial_interacciones import router as historial_router

from app.routers.lista_deseos import router as lista_deseos_router

from app.routers.devoluciones import router as devoluciones_router

from app.routers.cupones import router as cupones_router

from app.routers.direcciones import router as direcciones_router

from app.routers.suscripciones_tienda import router as suscripciones_router

from app.routers.herramientas import router as herramientas_router

from app.routers.impulsos import router as impulsos_router

from app.routers.envios import router as envios_router
from app.routers.favoritos import router as favoritos_router
from app.routers.quejas import router as quejas_router
from app.routers.bookypago_finanzas import router as bookypago_finanzas_router
from app.routers.calificaciones_tiendas import router as calificaciones_tiendas_router
from app.database import ensure_quejas_schema, ensure_banner_perfil_schema


load_dotenv()

# ========================
# Scheduler — tareas programadas
# ========================
from app.tasks.auto_entrega import ejecutar_auto_confirmacion

scheduler = BackgroundScheduler(timezone="America/Bogota")
# Corre todos los días a las 3:00 AM hora Colombia
scheduler.add_job(ejecutar_auto_confirmacion, "cron", hour=3, minute=0, id="auto_entrega")

@asynccontextmanager
async def lifespan(app):
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)

app = FastAPI(lifespan=lifespan)
ensure_quejas_schema()
ensure_banner_perfil_schema()


# ========================
# Middleware y seguridad de CORS
# ========================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8081",       # Expo web (dev)
    "http://127.0.0.1:8081",
    "http://localhost:8082",       # Expo web (puerto alternativo)
    "http://127.0.0.1:8082",
    "http://192.168.0.5:8081",    # Expo web desde la IP local
]

app.add_middleware(

    CORSMiddleware,
    allow_origins=origins,     
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+",
    allow_credentials=True,     
    allow_methods=["*"],

    allow_headers=["*"],

)

# Permite payloads de hasta 20MB (necesario para audio base64 en mensajes de voz)
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_body_size: int = 20 * 1024 * 1024):
        super().__init__(app)
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next):
        if request.headers.get("content-length"):
            content_length = int(request.headers["content-length"])
            if content_length > self.max_body_size:
                from fastapi.responses import JSONResponse
                return JSONResponse({"detail": "Payload demasiado grande (máx 20MB)"}, status_code=413)
        return await call_next(request)

app.add_middleware(MaxBodySizeMiddleware, max_body_size=20 * 1024 * 1024)



# ========================

# Registro de enrutadores

# ========================

app.include_router(usuarios_router)

app.include_router(libreria_router)

app.include_router(auth_router)

app.include_router(carrito_router, prefix="/carrito", tags=["Carrito"])

app.include_router(stored_router, tags=["Stored Procedures"])

app.include_router(payments_router)

app.include_router(libros.router, prefix="/libros", tags=["Libros"])

app.include_router(ofertas.router, prefix="/ofertas", tags=["ofertas"])

app.include_router(resenas_router, prefix="/resenas", tags=["Reseñas"])

app.include_router(perfil_router)

app.include_router(configuracion_router, prefix="/configuracion", tags=["Configuración de Tienda"])

app.include_router(catalogo_router)

app.include_router(chat_router)

app.include_router(notificaciones_router)

app.include_router(historial_router)

app.include_router(lista_deseos_router)

app.include_router(devoluciones_router)

app.include_router(cupones_router)

app.include_router(direcciones_router)

app.include_router(suscripciones_router)

app.include_router(herramientas_router)

app.include_router(impulsos_router)

app.include_router(envios_router)
app.include_router(favoritos_router)
app.include_router(quejas_router)
app.include_router(bookypago_finanzas_router, prefix="/api/v1/bookypago-finanzas", tags=["BookyPago Finanzas"])
# app.include_router(calificaciones_tiendas_router)


@app.get("/")

def root():

    return {"mensaje": "BookyHome API funcionando"}



app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

import os as _os
from pathlib import Path as _Path
_os.makedirs("uploads/libros_digitales", exist_ok=True)
app.mount("/static_digital", StaticFiles(directory="uploads/libros_digitales"), name="static_digital")
_email_static_dir = _Path(__file__).resolve().parent / "static" / "email"
app.mount("/static/email", StaticFiles(directory=str(_email_static_dir)), name="email_assets")
