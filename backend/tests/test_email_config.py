import importlib

import pytest


def test_email_module_loads_without_smtp(monkeypatch):
    import dotenv

    monkeypatch.setattr(dotenv, "load_dotenv", lambda *args, **kwargs: None)
    for variable in ("MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM", "MAIL_SERVER"):
        monkeypatch.delenv(variable, raising=False)

    from app import email

    email = importlib.reload(email)

    assert email.conf is None
    assert email.is_smtp_configured() is False
    with pytest.raises(RuntimeError, match="SMTP no está configurado"):
        email._get_fast_mail()
