from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers.usuarios import router as usuarios_router
from app.routers.libreria import router as libreria_router
from app.routers.auth import router as auth_router
from app.routers.carrito import router as carrito_router
from app.routers.stored import router as stored_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios_router)
app.include_router(libreria_router)
app.include_router(auth_router)
app.include_router(carrito_router)
app.include_router(stored_router)

@app.get("/")
def root():
    return {"mensaje": "BookyHome API funcionando"}
