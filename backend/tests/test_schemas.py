"""
test_schemas.py — Pruebas unitarias de validación de schemas Pydantic.

Cubre los huecos detectados en el plan de testing (sección 03):
- UsuarioRegistro: password y teléfono sin validación → se documenta el hueco
- PagoRequest: amount sin gt=0, payment_method sin whitelist → se documenta el hueco
- LibroCrear: validaciones existentes deben funcionar
"""

import pytest
from pydantic import ValidationError
from app.schemas import (
    UsuarioRegistro,
    UsuarioLogin,
    LibroCrear,
    PagoRequest,
    CancelacionOrdenRequest,
)


# ---------------------------------------------------------------------------
# UsuarioRegistro
# ---------------------------------------------------------------------------

class TestUsuarioRegistro:
    def test_registro_valido(self):
        user = UsuarioRegistro(
            nombre="Juan Pérez",
            email="juan@example.com",
            password="Password123",
            telefono="3001234567",
            rol="comprador",
        )
        assert user.nombre == "Juan Pérez"
        assert user.rol == "comprador"

    def test_rol_default_es_comprador(self):
        user = UsuarioRegistro(
            nombre="Ana",
            email="ana@example.com",
            password="abc12345",
            telefono="123456789",
        )
        assert user.rol == "comprador"

    def test_rol_invalido_falla(self):
        with pytest.raises(ValidationError):
            UsuarioRegistro(
                nombre="X",
                email="x@x.com",
                password="abc",
                telefono="123",
                rol="admin",  # no permitido por Literal
            )

    def test_email_invalido_falla(self):
        with pytest.raises(ValidationError):
            UsuarioRegistro(
                nombre="X",
                email="no-es-un-email",
                password="abc",
                telefono="123",
            )

    # --- REGRESIÓN (sem. 3 — hueco corregido) ---
    def test_password_vacio_falla(self):
        """REGRESIÓN: password vacío ahora debe fallar con min_length=8."""
        with pytest.raises(ValidationError):
            UsuarioRegistro(
                nombre="X", email="x@x.com", password="", telefono="123456789"
            )

    def test_password_menor_8_caracteres_falla(self):
        """REGRESIÓN: password de 7 caracteres debe fallar."""
        with pytest.raises(ValidationError):
            UsuarioRegistro(
                nombre="X", email="x@x.com", password="abc123", telefono="123456789"
            )

    def test_password_exactamente_8_caracteres_pasa(self):
        """REGRESIÓN: password de exactamente 8 caracteres debe pasar."""
        user = UsuarioRegistro(
            nombre="X", email="x@x.com", password="abcd1234", telefono="123456789"
        )
        assert len(user.password) == 8

    def test_telefono_con_letras_falla(self):
        """REGRESIÓN: teléfono con letras ahora debe fallar con pattern numérico."""
        with pytest.raises(ValidationError):
            UsuarioRegistro(
                nombre="X", email="x@x.com", password="abcd1234", telefono="ABCDE"
            )

    def test_telefono_valido_pasa(self):
        """REGRESIÓN: teléfono numérico válido debe pasar."""
        user = UsuarioRegistro(
            nombre="X", email="x@x.com", password="abcd1234", telefono="3001234567"
        )
        assert user.telefono == "3001234567"

    def test_telefono_menor_7_digitos_falla(self):
        """REGRESIÓN: teléfono de 6 dígitos debe fallar."""
        with pytest.raises(ValidationError):
            UsuarioRegistro(
                nombre="X", email="x@x.com", password="abcd1234", telefono="123456"
            )


# ---------------------------------------------------------------------------
# UsuarioLogin
# ---------------------------------------------------------------------------

class TestUsuarioLogin:
    def test_login_valido(self):
        login = UsuarioLogin(email="user@mail.com", password="pass")
        assert login.email == "user@mail.com"

    def test_email_invalido_falla(self):
        with pytest.raises(ValidationError):
            UsuarioLogin(email="noesmail", password="pass")


# ---------------------------------------------------------------------------
# LibroCrear — validaciones existentes
# ---------------------------------------------------------------------------

class TestLibroCrear:
    def test_libro_valido(self):
        libro = LibroCrear(
            id_categoria=1,
            titulo="Cien años de soledad",
            autor_libro="García Márquez",
            descripcion_libro="Una novela magistral.",
            precio_libro=45000.0,
            stock=5,
            estado_libro="nuevo",
        )
        assert libro.precio_libro == 45000.0

    def test_precio_cero_falla(self):
        with pytest.raises(ValidationError):
            LibroCrear(
                id_categoria=1,
                titulo="T",
                autor_libro="A",
                descripcion_libro="D",
                precio_libro=0,  # gt=0 debe fallar
                stock=1,
                estado_libro="nuevo",
            )

    def test_precio_negativo_falla(self):
        with pytest.raises(ValidationError):
            LibroCrear(
                id_categoria=1,
                titulo="T",
                autor_libro="A",
                descripcion_libro="D",
                precio_libro=-100,
                stock=1,
                estado_libro="nuevo",
            )

    def test_stock_cero_falla(self):
        with pytest.raises(ValidationError):
            LibroCrear(
                id_categoria=1,
                titulo="T",
                autor_libro="A",
                descripcion_libro="D",
                precio_libro=10.0,
                stock=0,  # ge=1 debe fallar
                estado_libro="nuevo",
            )

    def test_estado_invalido_falla(self):
        with pytest.raises(ValidationError):
            LibroCrear(
                id_categoria=1,
                titulo="T",
                autor_libro="A",
                descripcion_libro="D",
                precio_libro=10.0,
                stock=1,
                estado_libro="destruido",  # no está en el pattern
            )

    def test_titulo_max_length(self):
        with pytest.raises(ValidationError):
            LibroCrear(
                id_categoria=1,
                titulo="X" * 101,  # max_length=100
                autor_libro="A",
                descripcion_libro="D",
                precio_libro=10.0,
                stock=1,
                estado_libro="nuevo",
            )


# ---------------------------------------------------------------------------
# PagoRequest — huecos documentados
# ---------------------------------------------------------------------------

class TestPagoRequest:
    def test_pago_valido(self):
        pago = PagoRequest(order_id=1, amount=50000.0, payment_method="tarjeta")
        assert pago.amount == 50000.0

    def test_hueco_amount_negativo_falla(self):
        """REGRESIÓN: amount negativo ahora debe fallar con gt=0."""
        with pytest.raises(ValidationError):
            PagoRequest(order_id=1, amount=-100.0, payment_method="tarjeta")

    def test_hueco_amount_cero_falla(self):
        """REGRESIÓN: amount=0 debe fallar con gt=0."""
        with pytest.raises(ValidationError):
            PagoRequest(order_id=1, amount=0, payment_method="tarjeta")

    def test_hueco_payment_method_invalido_falla(self):
        """REGRESIÓN: método de pago fuera de la whitelist debe fallar."""
        with pytest.raises(ValidationError):
            PagoRequest(order_id=1, amount=1000.0, payment_method="cripto_inventada")

    def test_payment_method_validos_pasan(self):
        """REGRESIÓN: todos los métodos permitidos deben pasar."""
        metodos = ["tarjeta", "efectivo", "transferencia", "nequi", "daviplata", "pse"]
        for metodo in metodos:
            pago = PagoRequest(order_id=1, amount=1000.0, payment_method=metodo)
            assert pago.payment_method == metodo


# ---------------------------------------------------------------------------
# CancelacionOrdenRequest
# ---------------------------------------------------------------------------

class TestCancelacionOrdenRequest:
    def test_motivo_valido(self):
        c = CancelacionOrdenRequest(motivo="No quiero el libro ya")
        assert len(c.motivo) >= 5

    def test_motivo_muy_corto_falla(self):
        with pytest.raises(ValidationError):
            CancelacionOrdenRequest(motivo="No")  # min_length=5

    def test_motivo_muy_largo_falla(self):
        with pytest.raises(ValidationError):
            CancelacionOrdenRequest(motivo="X" * 501)  # max_length=500
