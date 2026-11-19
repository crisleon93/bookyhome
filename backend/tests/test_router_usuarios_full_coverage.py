from unittest.mock import MagicMock, patch, AsyncMock
import pytest
from fastapi import HTTPException
import app.routers.usuarios as mod


def test_get_current_user_token_validation():
    creds = MagicMock(credentials="valid-token")
    with patch("app.routers.usuarios.verify_token", return_value={"sub": "42"}):
        assert mod.get_current_user(creds) == 42

    with patch("app.routers.usuarios.verify_token", return_value=None):
        with pytest.raises(HTTPException) as exc:
            mod.get_current_user(creds)
        assert exc.value.status_code == 401


def test_register_duplicate_and_internal_errors():
    data = MagicMock(nombre="Test", email="a@b.com", password="Pass", telefono="123", rol="comprador")

    # Duplicate error
    with patch("app.routers.usuarios.crear_usuario", return_value={"ok": False, "error": "Duplicate entry for email"}):
        import asyncio
        with pytest.raises(HTTPException) as exc400:
            asyncio.run(mod.register(data))
        assert exc400.value.status_code == 400

    # Internal DB error
    with patch("app.routers.usuarios.crear_usuario", return_value={"ok": False, "error": "DB connection lost"}):
        with pytest.raises(HTTPException) as exc500:
            asyncio.run(mod.register(data))
        assert exc500.value.status_code == 500


def test_register_success_smtp_variations():
    import asyncio
    data = MagicMock(nombre="Test", email="a@b.com", password="Pass", telefono="123", rol="comprador")

    # 1. SMTP configured and succeeds
    with patch("app.routers.usuarios.crear_usuario", return_value={"ok": True}), \
         patch("app.routers.usuarios.is_smtp_configured", return_value=True), \
         patch("app.routers.usuarios.enviar_email_confirmacion_registro", new_callable=AsyncMock):
        res1 = asyncio.run(mod.register(data))
        assert res1["email_enviado"] is True

    # 2. SMTP configured but raises exception
    with patch("app.routers.usuarios.crear_usuario", return_value={"ok": True}), \
         patch("app.routers.usuarios.is_smtp_configured", return_value=True), \
         patch("app.routers.usuarios.enviar_email_confirmacion_registro", side_effect=RuntimeError("SMTP failed")):
        res2 = asyncio.run(mod.register(data))
        assert res2["email_enviado"] is False

    # 3. SMTP not configured
    with patch("app.routers.usuarios.crear_usuario", return_value={"ok": True}), \
         patch("app.routers.usuarios.is_smtp_configured", return_value=False):
        res3 = asyncio.run(mod.register(data))
        assert res3["email_enviado"] is False


def test_login_validation_and_status_checks():
    data = MagicMock(email="test@mail.com", password="123")

    # Invalid credentials
    with patch("app.routers.usuarios.login_usuario", return_value=None):
        with pytest.raises(HTTPException) as exc401:
            mod.login(data)
        assert exc401.value.status_code == 401

    # Email not verified
    with patch("app.routers.usuarios.login_usuario", return_value={"email_verificado": False}):
        with pytest.raises(HTTPException) as exc403_email:
            mod.login(data)
        assert exc403_email.value.status_code == 403

    # User blocked
    with patch("app.routers.usuarios.login_usuario", return_value={"email_verificado": True, "estado_usuario": "Bloqueado"}):
        with pytest.raises(HTTPException) as exc403_blocked:
            mod.login(data)
        assert exc403_blocked.value.status_code == 403

    # Vendor with suspended store
    user_vendor = {
        "id_usuario": 10,
        "nombre_usuario": "Vendedor",
        "email_verificado": True,
        "estado_usuario": "Activo",
        "rol": "vendedor",
    }
    with patch("app.routers.usuarios.login_usuario", return_value=user_vendor), \
         patch("app.routers.usuarios.obtener_tienda_por_usuario", return_value={"estado_tienda": "suspendida"}):
        with pytest.raises(HTTPException) as exc403_suspended:
            mod.login(data)
        assert exc403_suspended.value.status_code == 403

    # Vendor with active store success
    with patch("app.routers.usuarios.login_usuario", return_value=user_vendor), \
         patch("app.routers.usuarios.obtener_tienda_por_usuario", return_value={"id_tienda": 5, "nombre_tienda": "Libros Ya", "estado_tienda": "activa"}), \
         patch("app.routers.usuarios.create_token", return_value="jwt-vendor-token"):
        res_vendedor = mod.login(data)
        assert res_vendedor["access_token"] == "jwt-vendor-token"

    # Buyer success
    user_buyer = {
        "id_usuario": 20,
        "nombre_usuario": "Comprador",
        "email_verificado": True,
        "estado_usuario": "Activo",
        "rol": "comprador",
    }
    with patch("app.routers.usuarios.login_usuario", return_value=user_buyer), \
         patch("app.routers.usuarios.create_token", return_value="jwt-buyer-token"):
        res_buyer = mod.login(data)
        assert res_buyer["access_token"] == "jwt-buyer-token"


def test_usuarios_admin_and_bloquear():
    # get_usuarios
    with patch("app.routers.usuarios.obtener_todos_usuarios", return_value=[{"id_usuario": 1}]):
        assert mod.get_usuarios() == [{"id_usuario": 1}]

    # bloquear failure
    payload = mod.BloquearPayload(bloqueado=True)
    with patch("app.routers.usuarios.bloquear_usuario", return_value={"ok": False, "error": "User not found"}):
        with pytest.raises(HTTPException) as exc500:
            mod.bloquear(1, payload)
        assert exc500.value.status_code == 500

    # bloquear success
    with patch("app.routers.usuarios.bloquear_usuario", return_value={"ok": True}):
        assert mod.bloquear(1, payload) == {"mensaje": "Estado del usuario actualizado"}


def test_check_email_verification():
    with patch("app.routers.usuarios.obtener_usuario_por_email", side_effect=[
        None,
        {"email_verificado": True},
        {"id_usuario": 1},
    ]):
        assert mod.check_email_verification("inexistente@mail.com") == {"verificado": False, "mensaje": "Usuario no encontrado"}
        assert mod.check_email_verification("existente@mail.com") == {"verificado": True}
        assert mod.check_email_verification("sin_columna@mail.com") == {"verificado": True}
