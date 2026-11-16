"""Tests de contrato para el router de direcciones.

Se llaman las funciones del router directamente y se sustituye la capa de
modelos con monkeypatch, sin necesidad de JWT real ni base de datos.
"""

import pytest
from fastapi import HTTPException

import app.routers.direcciones as mod


# ─── helpers ──────────────────────────────────────────────────────────────────

def _user(user_id=1):
    return {"id_usuario": user_id, "rol": "comprador"}


def _crear_data(**kwargs):
    defaults = {
        "nombre_destinatario": "Ana García",
        "telefono_contacto": "3001234567",
        "departamento": "Cundinamarca",
        "ciudad": "Bogotá",
        "direccion": "Calle 1 # 2-3",
        "codigo_postal": "110111",
        "es_predeterminada": False,
    }
    defaults.update(kwargs)
    return mod.DireccionCrear(**defaults)


def _actualizar_data(**kwargs):
    return mod.DireccionActualizar(**kwargs)


# ─── GET /direcciones ─────────────────────────────────────────────────────────

def test_get_retorna_lista_de_direcciones(monkeypatch):
    expected = [{"id_direccion": 1, "ciudad": "Bogotá"}, {"id_direccion": 2, "ciudad": "Cali"}]
    monkeypatch.setattr(mod, "obtener_direcciones_usuario", lambda uid: expected)

    result = mod.listar_direcciones(user=_user(5))

    assert result == expected


# ─── POST /direcciones ────────────────────────────────────────────────────────

def test_post_nombre_vacio_retorna_400():
    data = _crear_data(nombre_destinatario="   ")
    with pytest.raises(HTTPException) as exc:
        mod.agregar_direccion(data, user=_user())
    assert exc.value.status_code == 400
    assert "destinatario" in exc.value.detail.lower()


def test_post_ciudad_vacia_retorna_400():
    data = _crear_data(ciudad="   ")
    with pytest.raises(HTTPException) as exc:
        mod.agregar_direccion(data, user=_user())
    assert exc.value.status_code == 400
    assert "ciudad" in exc.value.detail.lower()


def test_post_direccion_vacia_retorna_400():
    data = _crear_data(direccion="   ")
    with pytest.raises(HTTPException) as exc:
        mod.agregar_direccion(data, user=_user())
    assert exc.value.status_code == 400
    assert "dirección" in exc.value.detail.lower()


def test_post_exitoso_retorna_direccion_creada(monkeypatch):
    nueva = {"id_direccion": 7, "ciudad": "Bogotá"}
    monkeypatch.setattr(mod, "crear_direccion", lambda uid, datos: {"ok": True, "direccion": nueva})

    result = mod.agregar_direccion(_crear_data(), user=_user(3))

    assert result == nueva


def test_post_error_modelo_retorna_500(monkeypatch):
    monkeypatch.setattr(mod, "crear_direccion", lambda uid, datos: {"ok": False, "error": "DB caída"})

    with pytest.raises(HTTPException) as exc:
        mod.agregar_direccion(_crear_data(), user=_user())
    assert exc.value.status_code == 500
    assert exc.value.detail == "DB caída"


# ─── PUT /direcciones/{id_direccion} ─────────────────────────────────────────

def test_put_no_encontrada_retorna_404(monkeypatch):
    monkeypatch.setattr(
        mod, "actualizar_direccion",
        lambda id_d, uid, datos: {"ok": False, "error": "Dirección no encontrada"},
    )

    with pytest.raises(HTTPException) as exc:
        mod.modificar_direccion(99, _actualizar_data(ciudad="Cali"), user=_user())
    assert exc.value.status_code == 404


def test_put_error_generico_retorna_500(monkeypatch):
    monkeypatch.setattr(
        mod, "actualizar_direccion",
        lambda id_d, uid, datos: {"ok": False, "error": "Error inesperado de BD"},
    )

    with pytest.raises(HTTPException) as exc:
        mod.modificar_direccion(1, _actualizar_data(ciudad="Cali"), user=_user())
    assert exc.value.status_code == 500


def test_put_exitoso_retorna_direccion_actualizada(monkeypatch):
    actualizada = {"id_direccion": 1, "ciudad": "Medellín"}
    monkeypatch.setattr(
        mod, "actualizar_direccion",
        lambda id_d, uid, datos: {"ok": True, "direccion": actualizada},
    )

    result = mod.modificar_direccion(1, _actualizar_data(ciudad="Medellín"), user=_user())
    assert result == actualizada


# ─── DELETE /direcciones/{id_direccion} ───────────────────────────────────────

def test_delete_exitoso_retorna_ok(monkeypatch):
    monkeypatch.setattr(mod, "eliminar_direccion", lambda id_d, uid: {"ok": True, "error": None})

    result = mod.borrar_direccion(1, user=_user())
    assert result == {"ok": True, "mensaje": "Dirección eliminada"}


def test_delete_no_encontrada_retorna_404(monkeypatch):
    monkeypatch.setattr(
        mod, "eliminar_direccion",
        lambda id_d, uid: {"ok": False, "error": "Dirección no encontrada"},
    )

    with pytest.raises(HTTPException) as exc:
        mod.borrar_direccion(99, user=_user())
    assert exc.value.status_code == 404


# ─── PATCH /direcciones/{id_direccion}/default ───────────────────────────────

def test_patch_default_exitoso_retorna_direccion(monkeypatch):
    predeterminada = {"id_direccion": 2, "es_predeterminada": True}
    monkeypatch.setattr(
        mod, "marcar_direccion_predeterminada",
        lambda id_d, uid: {"ok": True, "direccion": predeterminada},
    )

    result = mod.establecer_predeterminada(2, user=_user())
    assert result == predeterminada


def test_patch_default_no_encontrada_retorna_404(monkeypatch):
    monkeypatch.setattr(
        mod, "marcar_direccion_predeterminada",
        lambda id_d, uid: {"ok": False, "error": "Dirección no encontrada"},
    )

    with pytest.raises(HTTPException) as exc:
        mod.establecer_predeterminada(99, user=_user())
    assert exc.value.status_code == 404
