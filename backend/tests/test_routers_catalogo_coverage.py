import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch

import app.routers.catalogo as mod


def _db_cursor():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def _busqueda(**overrides):
    params = {
        "q": None,
        "categoria_id": None,
        "precio_min": None,
        "precio_max": None,
        "calificacion_min": None,
        "disponible": None,
        "ordenar_por": "relevancia",
        "pagina": 1,
        "limite": 20,
        "incluir_total": True,
        "categoria": None,
        "nombre_tienda": None,
        "correo_vendedor": None,
    }
    params.update(overrides)
    return mod.busqueda_avanzada(**params)


def test_stats_publicos_calcula_promedio_y_respalda_promedio_vacio():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [
        {"total": 12}, {"total": 4}, {"total": 30}, {"promedio": 4.4},
        {"total": 12}, {"total": 4}, {"total": 30}, {"promedio": None},
    ]

    with patch.object(mod, "get_db", return_value=db):
        resultado = mod.get_stats_publicos()
        sin_calificaciones = mod.get_stats_publicos()

    assert resultado == {
        "libros_disponibles": 12,
        "librerias_asociadas": 4,
        "usuarios_activos": 30,
        "calificacion_promedio": 4.4,
    }
    assert sin_calificaciones["calificacion_promedio"] == 0.0
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_busqueda_avanzada_construye_filtros_y_normaliza_imagenes():
    db, cursor = _db_cursor()
    cursor.fetchone.return_value = {"total": 21}
    cursor.fetchall.return_value = [
        {"id_libro": 1, "imagenes": "a.jpg,b.jpg"},
        {"id_libro": 2, "imagenes": None},
    ]
    with patch.object(mod, "get_db", return_value=db):
        resultado = _busqueda(
            q="ana",
            categoria_id=3,
            categoria="Ignorada por categoria_id",
            precio_min=1000,
            precio_max=50000,
            calificacion_min=4,
            disponible=True,
            ordenar_por="precio_asc",
            pagina=2,
            limite=10,
            nombre_tienda="Centro",
            correo_vendedor="seller@test",
        )

    assert resultado == {
        "total": 21,
        "pagina": 2,
        "limite": 10,
        "total_paginas": 3,
        "libros": [
            {"id_libro": 1, "imagenes": ["a.jpg", "b.jpg"]},
            {"id_libro": 2, "imagenes": []},
        ],
    }
    count_sql = cursor.execute.call_args_list[0].args[0]
    query_sql = cursor.execute.call_args_list[1].args[0]
    query_params = cursor.execute.call_args_list[1].args[1]
    assert "l.id_categoria = %s" in count_sql
    assert "l.precio_libro >= %s" in count_sql
    assert "l.precio_libro <= %s" in count_sql
    assert "l.oculto = 0" in query_sql
    assert "ORDER BY es_impulsado DESC, l.precio_libro ASC" in query_sql
    assert query_params[:3] == ["%ana%", "%ana%", "%ana%"]
    assert query_params[-2:] == [10, 10]
    db.close.assert_called_once()


def test_busqueda_sin_total_omite_count_y_maneja_error():
    db, cursor = _db_cursor()
    cursor.fetchall.return_value = []
    with patch.object(mod, "get_db", return_value=db):
        resultado = _busqueda(incluir_total=False, ordenar_por="desconocido")

    assert resultado["total"] is None
    assert resultado["total_paginas"] is None
    assert cursor.execute.call_count == 1
    assert "ORDER BY es_impulsado DESC, l.fecha_listado DESC" in cursor.execute.call_args.args[0]

    cursor.execute.side_effect = RuntimeError("query failed")
    with patch.object(mod, "get_db", return_value=db):
        with pytest.raises(HTTPException) as error:
            _busqueda()
    assert error.value.status_code == 500
    cursor.close.assert_called()
    db.close.assert_called()


def test_busqueda_filtra_por_nombre_de_categoria_si_no_hay_id():
    db, cursor = _db_cursor()
    cursor.fetchall.return_value = []
    with patch.object(mod, "get_db", return_value=db):
        resultado = _busqueda(categoria="Novela", incluir_total=False)

    query, params = cursor.execute.call_args.args
    assert resultado["libros"] == []
    assert "c.nombre_categoria = %s" in query
    assert params == ["Novela", 20, 0]


def test_obtener_libro_catalogo_retorna_detalle_y_codigos_de_error():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [
        {"id_libro": 2, "imagenes": "uno.jpg,dos.jpg"},
        None,
    ]
    with patch.object(mod, "get_db", return_value=db):
        libro = mod.obtener_libro_catalogo(2)
        assert libro["imagenes"] == ["uno.jpg", "dos.jpg"]
        with pytest.raises(HTTPException) as no_existe:
            mod.obtener_libro_catalogo(99)
    assert no_existe.value.status_code == 404

    cursor.execute.side_effect = RuntimeError("database down")
    with patch.object(mod, "get_db", return_value=db):
        with pytest.raises(HTTPException) as error:
            mod.obtener_libro_catalogo(2)
    assert error.value.status_code == 500
    assert error.value.detail == "database down"


def test_filtros_categorias_y_autocompletado():
    db, cursor = _db_cursor()
    cursor.fetchall.side_effect = [
        [{"id_categoria": 1, "nombre_categoria": "Novela"}],
        [{"id_categoria": 1, "nombre_categoria": "Novela", "cantidad_libros": 3}],
        [{"id_libro": 5, "titulo": "Ana", "imagen_url": None}],
    ]
    cursor.fetchone.return_value = {"precio_min": None, "precio_max": 50000}
    with patch.object(mod, "get_db", return_value=db):
        filtros = mod.obtener_filtros_disponibles()
        categorias = mod.obtener_categorias()
        sugerencias = mod.autocompletado("ana", limite=5)

    assert filtros["precio_min"] == 0
    assert filtros["precio_max"] == 50000
    assert len(filtros["opciones_ordenamiento"]) == 5
    assert categorias[0]["cantidad_libros"] == 3
    assert sugerencias == {
        "sugerencias": [{"id_libro": 5, "titulo": "Ana", "imagen_url": None}],
        "total": 1,
    }
    assert cursor.execute.call_args.args[1] == ["%ana%", "%ana%", "%ana%", "%ana%", 5]


def test_autocompletado_eleva_http_500_si_falla_bd():
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("search failed")
    with patch.object(mod, "get_db", return_value=db):
        with pytest.raises(HTTPException) as error:
            mod.autocompletado("ana", limite=5)
    assert error.value.status_code == 500
    assert error.value.detail == "search failed"
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_buscar_por_isbn_maneja_invalido_no_encontrado_y_resultados():
    with patch.object(mod, "validar_y_normalizar_isbn", return_value=None):
        with pytest.raises(HTTPException) as invalido:
            mod.buscar_por_isbn("bad")
    assert invalido.value.status_code == 400

    with patch.object(mod, "validar_y_normalizar_isbn", return_value="9780306406157"), \
         patch.object(mod, "buscar_libro_por_isbn", return_value=[]):
        with pytest.raises(HTTPException) as vacio:
            mod.buscar_por_isbn("9780306406157")
    assert vacio.value.status_code == 404

    books = [{"precio_libro": 12000}, {"precio_libro": 15000}]
    with patch.object(mod, "validar_y_normalizar_isbn", return_value="9780306406157"), \
         patch.object(mod, "buscar_libro_por_isbn", return_value=books):
        resultado = mod.buscar_por_isbn("9780306406157")
    assert resultado == {
        "isbn": "9780306406157",
        "total_encontrados": 2,
        "mejor_precio": 12000,
        "libros": books,
    }
