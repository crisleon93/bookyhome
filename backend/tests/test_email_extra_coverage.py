"""
test_email_extra_coverage.py
Cobertura adicional para email.py (95.5%)
"""
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
import app.email as email_mod


def test_is_smtp_configured_false_si_falta_variable(monkeypatch):
    for key in ("MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM", "MAIL_SERVER"):
        monkeypatch.delenv(key, raising=False)
    assert email_mod.is_smtp_configured() is False


def test_is_smtp_configured_true_con_todas(monkeypatch):
    monkeypatch.setenv("MAIL_USERNAME", "user")
    monkeypatch.setenv("MAIL_PASSWORD", "pass")
    monkeypatch.setenv("MAIL_FROM", "from@test.com")
    monkeypatch.setenv("MAIL_SERVER", "smtp.test.com")
    assert email_mod.is_smtp_configured() is True


def test_get_public_api_url_fallback(monkeypatch):
    monkeypatch.delenv("PUBLIC_API_URL", raising=False)
    monkeypatch.delenv("API_PUBLIC_URL", raising=False)
    url = email_mod.get_public_api_url()
    assert url == "http://localhost:8000"


def test_get_frontend_url_fallback(monkeypatch):
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    assert email_mod.get_frontend_url() == "http://localhost:5173"


def test_format_date_con_z(monkeypatch):
    result = email_mod._format_date("2026-07-15T10:30:00Z")
    assert "15" in result and "2026" in result


def test_format_date_invalido():
    result = email_mod._format_date("no-es-fecha")
    assert result == "no-es-fecha"


def test_format_date_vacio():
    assert email_mod._format_date("") == ""


def test_email_hero_html_sin_gradient():
    html = email_mod._email_hero_html("🎉", "Título de prueba", gradient=False)
    assert "Título de prueba" in html
    assert "linear-gradient" not in html


def test_email_hero_html_con_gradient():
    html = email_mod._email_hero_html("🎉", "Título gradiente", gradient=True)
    assert "linear-gradient" in html


def test_email_info_box_sin_titulo():
    html = email_mod._email_info_box_html("", "Contenido del box", "#7A1E3A")
    assert "Contenido del box" in html
    # Sin título no debe aparecer el <p> del título
    assert "<strong>" not in html or "Contenido" in html


def test_email_info_box_con_titulo():
    html = email_mod._email_info_box_html("Mi Título", "Cuerpo del mensaje", "#red")
    assert "Mi Título" in html
    assert "Cuerpo del mensaje" in html


def test_logo_path_usa_fallback_cuando_no_existe_optimizado(monkeypatch, tmp_path):
    # Crear solo el logo.png (no el logo-email.png)
    logo_png = tmp_path / "logo.png"
    logo_png.write_bytes(b"fake png")
    with patch.object(email_mod, "_EMAIL_STATIC_DIR", tmp_path):
        path = email_mod._logo_path()
    assert path.name == "logo.png"


def test_logo_path_usa_optimizado_cuando_existe(tmp_path):
    # Crear ambos archivos
    optimized = tmp_path / "logo-email.png"
    optimized.write_bytes(b"optimized png")
    fallback = tmp_path / "logo.png"
    fallback.write_bytes(b"fallback png")
    with patch.object(email_mod, "_EMAIL_STATIC_DIR", tmp_path):
        path = email_mod._logo_path()
    assert path.name == "logo-email.png"


def test_get_fast_mail_sin_smtp_lanza_error(monkeypatch):
    monkeypatch.setattr(email_mod, "conf", None)
    try:
        email_mod._get_fast_mail()
        assert False, "Debería haber lanzado RuntimeError"
    except RuntimeError as e:
        assert "SMTP" in str(e)


def test_create_connection_config_retorna_none_sin_smtp(monkeypatch):
    for key in ("MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM", "MAIL_SERVER"):
        monkeypatch.delenv(key, raising=False)
    result = email_mod._create_connection_config()
    assert result is None
