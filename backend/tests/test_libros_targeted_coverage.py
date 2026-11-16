import asyncio
import io
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException, UploadFile

import app.routers.libros as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_category_and_publish_failure_and_image_filtering(tmp_path, monkeypatch):
    with patch.object(mod, "obtener_categorias", return_value=[{"id": 1}]):
        assert mod.listar_categorias() == [{"id": 1}]

    monkeypatch.setattr(mod, "UPLOAD_DIR", str(tmp_path))
    bad = UploadFile(filename="ignored.gif", file=io.BytesIO(b"x"))
    good = UploadFile(filename="cover.PNG", file=io.BytesIO(b"png"))
    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 2}), \
         patch.object(mod, "validar_y_normalizar_isbn", return_value="isbn"), \
         patch.object(mod, "crear_libro", return_value={"ok": True, "id_libro": 10}), \
         patch.object(mod, "agregar_imagen_libro") as add_image:
        result = asyncio.run(mod.publicar_libro(
            1, "Title", "Author", "Description", 5, 1, "nuevo", isbn="123",
             acceso_anticipado=False, nivel_minimo_acceso="Plata",
             fecha_lanzamiento_publico=None,
            imagenes=[bad, good], user={"sub": "7"},
        ))
    assert len(result["imagenes"]) == 1
    add_image.assert_called_once()

    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 2}), \
         patch.object(mod, "crear_libro", return_value={"ok": False, "error": "db"}):
        with pytest.raises(HTTPException) as failure:
             asyncio.run(mod.publicar_libro(
                 1, "T", "A", "D", 5, 1, "nuevo", acceso_anticipado=False,
                 nivel_minimo_acceso="Plata", fecha_lanzamiento_publico=None,
                 isbn=None,
                 user={"sub": "7"},
             ))
    assert failure.value.status_code == 500


def test_edit_isbn_and_stock_error_mapping():
    args = (2, 1, "T", "A", "D", 5, 1, "nuevo")
    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 4}), \
         patch.object(mod, "validar_y_normalizar_isbn", return_value="ISBN"), \
         patch.object(mod, "editar_libro", return_value={"ok": True}) as edit:
        assert mod.editar(
            *args, isbn="123", acceso_anticipado=False, nivel_minimo_acceso="Plata",
            fecha_lanzamiento_publico=None, user={"sub": "8"},
        )["mensaje"]
    assert edit.call_args.kwargs["isbn"] == "ISBN"

    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 4}), \
         patch.object(mod, "actualizar_stock", return_value={"ok": False, "error": "database"}):
        with pytest.raises(HTTPException) as failure:
            mod.update_stock(2, 3, {"sub": "8"})
    assert failure.value.status_code == 500

    with patch.object(mod, "ocultar_libro", return_value={"ok": False, "error": "database"}):
        with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 4}):
            with pytest.raises(HTTPException) as failure:
                mod.ocultar(2, {"oculto": True}, {"sub": "8"})
    assert failure.value.status_code == 500


def test_digital_upload_success_and_validation(monkeypatch, tmp_path):
    monkeypatch.setattr(mod, "UPLOAD_DIGITAL_DIR", str(tmp_path))
    monkeypatch.setattr(mod, "_guardar_upload", lambda *_args: _completed())
    db, cursor = _db()
    cursor.fetchone.return_value = {"id_tienda": 3}
    monkeypatch.setattr(mod, "obtener_tienda_por_usuario", lambda _uid: {"id_tienda": 3})
    with patch("app.database.get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "7"}):
        result = asyncio.run(mod.subir_archivo_digital(
            4, 5, UploadFile(filename="book.epub", file=io.BytesIO(b"book")),
            MagicMock(credentials="token"),
        ))
        assert result["url"].startswith("/static_digital/")
        with pytest.raises(HTTPException) as invalid:
            asyncio.run(mod.subir_archivo_digital(
                4, 5, UploadFile(filename="book.txt", file=io.BytesIO(b"book")),
                MagicMock(credentials="token"),
            ))
    assert invalid.value.status_code == 500
    db.commit.assert_called_once()


async def _completed():
    return None


def test_digital_download_authorization_availability_and_response(monkeypatch, tmp_path):
    order = {"estado": "pagado", "items": [{"id_variante": 5}]}
    monkeypatch.setattr(mod, "verify_token", lambda _token: {"sub": "7"})
    monkeypatch.setattr(mod, "UPLOAD_DIGITAL_DIR", str(tmp_path))
    monkeypatch.setattr("app.models.payments._load_store", lambda _path: {"7": [order]})
    monkeypatch.setattr("app.models.payments.ORDER_FILE", "orders.json")
    db1, cursor1 = _db()
    cursor1.fetchone.return_value = None
    db2, cursor2 = _db()
    cursor2.fetchone.return_value = {
        "tipo_tapa": "Digital", "archivo_digital_url": "/static_digital/book.pdf",
    }
    file_path = tmp_path / "book.pdf"
    file_path.write_bytes(b"pdf")
    with patch("app.database.get_db", side_effect=[db1, db2]), \
         patch.object(mod, "FileResponse", return_value="download") as response:
        assert mod.descargar_libro_digital(5, "token") == "download"
    response.assert_called_once()
    db1.close.assert_called_once()
    db2.close.assert_called_once()

    monkeypatch.setattr("app.models.payments._load_store", lambda _path: {})
    denied_db, denied_cursor = _db()
    denied_cursor.fetchone.return_value = None
    with patch("app.database.get_db", return_value=denied_db):
        with pytest.raises(HTTPException) as denied:
            mod.descargar_libro_digital(5, "token")
    assert denied.value.status_code == 403

    unavailable_db1, unavailable_cursor1 = _db()
    unavailable_cursor1.fetchone.return_value = {"id_orden": 1}
    unavailable_db2, unavailable_cursor2 = _db()
    unavailable_cursor2.fetchone.return_value = None
    with patch("app.database.get_db", side_effect=[unavailable_db1, unavailable_db2]):
        with pytest.raises(HTTPException) as unavailable:
            mod.descargar_libro_digital(5, "token")
    assert unavailable.value.status_code == 404
