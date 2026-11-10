from unittest.mock import MagicMock, patch

from app.routers.quejas import todas_las_quejas


def test_admin_todas_las_quejas_carga_datos_de_ordenes_sin_consultas_por_fila():
    rows = [
        {
            "id_solicitud": 1,
            "id_usuario": 10,
            "id_orden": 100,
            "titulo_libro": "Libro desde base de datos",
            "imagen_libro": "/uploads/libro.jpg",
            "total_items": 2,
            "total_orden": 50000,
        },
        {
            "id_solicitud": 2,
            "id_usuario": 11,
            "id_orden": 200,
            "titulo_libro": None,
            "imagen_libro": None,
            "total_items": None,
            "total_orden": None,
        },
    ]
    cursor = MagicMock()
    cursor.fetchall.return_value = rows
    db = MagicMock()
    db.cursor.return_value = cursor
    stored_orders = {
        "10": [{"id_orden": 100, "items": [{"titulo": "Libro local"}], "total": 123}],
        "11": [{
            "id_orden": 3,
            "id_orden_db": 200,
            "total": 75000,
            "items": [{"titulo": "Libro local", "imagen": "/local/portada.jpg"}],
        }],
    }

    with patch("app.routers.quejas.get_db", return_value=db), patch(
        "app.models.payments._load_store", return_value=stored_orders
    ):
        result = todas_las_quejas(user={"rol": "admin"})

    assert cursor.execute.call_count == 1
    assert result[0]["titulo_libro"] == "Libro desde base de datos"
    assert result[0]["total_items"] == 2
    assert result[0]["total_orden"] == 50000
    assert result[1]["titulo_libro"] == "Libro local"
    assert result[1]["imagen_libro"] == "/local/portada.jpg"
    assert result[1]["total_items"] == 1
    assert result[1]["total_orden"] == 75000
    cursor.close.assert_called_once()
    db.close.assert_called_once()
