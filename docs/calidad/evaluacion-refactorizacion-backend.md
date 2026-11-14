# Evaluación de buenas prácticas y refactorización del backend

**Proyecto:** BookyHome  
**Fecha:** 8 de octubre de 2026  
**Criterios:** nombres descriptivos, funciones pequeñas, responsabilidad única (SRP), eliminación de duplicidad (DRY) y uso de constantes.

## Alcance y método

Se revisaron diez archivos del backend. Para cada archivo se identificaron prácticas que ya cumple y oportunidades concretas de mejora. Se refactorizaron los casos donde el cambio era acotado y permitía conservar el comportamiento; en los demás se explica por qué no se modificó el archivo en esta revisión.

## Resultado por archivo

| Archivo | Decisión | Hallazgos y justificación |
|---|---|---|
| [`backend/app/auth.py`](../../backend/app/auth.py) | No requiere refactor en este alcance | Los nombres expresan su propósito y las funciones separan hash, verificación de credenciales, creación de token y autorización por rol. No se encontró duplicación relevante para los criterios de la guía. |
| [`backend/app/schemas.py`](../../backend/app/schemas.py) | Refactorizado | Había imports repetidos y `LibroRespuesta.imagenes` declaraba la lista directamente como valor por defecto. Se unificaron los imports y se hizo explícita la creación del valor con `Field(default_factory=list)`, siguiendo la convención de Pydantic. |
| [`backend/app/email.py`](../../backend/app/email.py) | No requiere refactor en este alcance | El módulo se concentra en correo: separa la construcción de componentes HTML reutilizables, configuración SMTP y envío de mensajes. La marca y los componentes compartidos evitan repetir estructura. |
| [`backend/app/main.py`](../../backend/app/main.py) | No requiere refactor en este alcance | Cumple el papel de punto de composición de FastAPI: configura la aplicación, middleware, ciclo de vida y registro de routers. Mantener el cableado aquí evita repartir la configuración entre módulos. |
| [`backend/app/routers/carrito.py`](../../backend/app/routers/carrito.py) | Refactorizado | Se eliminó un import duplicado y se extrajo `_get_user_id()` para centralizar la conversión repetida del identificador en los endpoints. La autenticación y las respuestas permanecen iguales. |
| [`backend/app/routers/catalogo.py`](../../backend/app/routers/catalogo.py) | No requiere refactor en este alcance | La búsqueda avanzada concentra filtros del catálogo, usa parámetros SQL para los valores y una lista permitida para ordenar. La consulta es extensa por la cantidad de filtros y datos asociados, pero no se identificó una extracción pequeña que mejorara claridad sin arriesgar el comportamiento de búsqueda. |
| [`backend/app/models/carrito.py`](../../backend/app/models/carrito.py) | Refactorizado parcialmente | La generación del PIN, estado y vencimiento de retiro estaba duplicada en checkout de carrito y compra directa. Se extrajo `_crear_datos_retiro()` y ambos flujos reutilizan la misma lógica. El módulo todavía combina almacenamiento JSON y MySQL; separarlos sería una refactorización mayor que requiere pruebas de integración para proteger ambos flujos. |
| [`backend/app/ws/manager.py`](../../backend/app/ws/manager.py) | No requiere refactor en este alcance | La clase tiene una responsabilidad definida: administrar conexiones WebSocket por usuario. `connect`, `disconnect` y `enviar_a_usuario` tienen nombres claros y operan sobre tareas acotadas. |
| [`backend/app/utils/finance_hooks.py`](../../backend/app/utils/finance_hooks.py) | No requiere refactor en este alcance | El módulo concentra el registro de ingresos, configura las comisiones en un único lugar y reutiliza `_ya_registrado()` para evitar transacciones duplicadas. Las funciones públicas corresponden a tipos de ingreso diferentes, por lo que no conviene fusionarlas solo para reducir líneas. |
| [`backend/app/routers/favoritos.py`](../../backend/app/routers/favoritos.py) | No requiere refactor en este alcance | Las rutas pertenecen al mismo recurso, el `SELECT` reutilizable está centralizado, las consultas parametrizan los valores y las conexiones se cierran en `finally`. La migración de listas antiguas es más extensa, pero responde a compatibilidad de favoritos y listas de deseos. |

## Cambios realizados

### 1. Esquema de libros: `schemas.py`

**Antes:** los imports estaban repartidos y `imagenes` tenía una lista literal como valor por defecto.

```python
from pydantic import BaseModel, EmailStr
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

imagenes: List[str] = []
```

**Ahora:** los imports están agrupados y la factoría deja explícito cómo se inicializa el campo. Las líneas actuales están en [los imports](../../backend/app/schemas.py#L1) y en [el campo `imagenes`](../../backend/app/schemas.py#L73).

```python
from typing import List, Literal, Optional
from pydantic import BaseModel, EmailStr, Field

imagenes: List[str] = Field(default_factory=list)
```

**Motivo:** elimina duplicación en imports y expresa claramente que el valor predeterminado es una lista recién creada para el campo. El tipo y la forma del dato de respuesta siguen siendo `List[str]`.

### 2. Router del carrito: `routers/carrito.py`

**Antes:** `APIRouter` se importaba dos veces y cada endpoint convertía por su cuenta el `sub` del token.

```python
from fastapi import APIRouter
from fastapi import APIRouter, HTTPException, Depends

id_usuario = int(user["sub"])
```

**Ahora:** se conserva un único import y la conversión vive en `_get_user_id()`, reutilizada por los seis endpoints. Consulta [la función helper](../../backend/app/routers/carrito.py#L25) y uno de [sus usos](../../backend/app/routers/carrito.py#L31).

```python
def _get_user_id(user: dict) -> int:
	return int(user["sub"])

id_usuario = _get_user_id(user)
```

**Motivo:** evita repetir la misma transformación y deja los endpoints centrados en la operación del carrito. La validación del token no cambió.

### 3. Datos de retiro: `models/carrito.py`

**Antes:** los dos flujos generaban por separado el PIN, el estado y la fecha límite.

```python
es_retiro = (tipo_entrega == 'retiro_tienda')
pin_retiro = f"{random.randint(1000, 9999)}" if es_retiro else None
estado_retiro = 'reservado' if es_retiro else None
fecha_limite = (datetime.utcnow() + timedelta(hours=48)).isoformat() + 'Z' if es_retiro else None
```

**Ahora:** la lógica se implementa una vez en [_crear_datos_retiro()](../../backend/app/models/carrito.py#L30), y tanto [checkout del carrito](../../backend/app/models/carrito.py#L182) como [compra directa](../../backend/app/models/carrito.py#L278) llaman a esa función.

```python
def _crear_datos_retiro(tipo_entrega):
	if tipo_entrega != 'retiro_tienda':
		return None, None, None

	pin_retiro = f"{random.randint(1000, 9999)}"
	fecha_limite = (datetime.utcnow() + timedelta(hours=48)).isoformat() + 'Z'
	return pin_retiro, 'reservado', fecha_limite
```

**Motivo:** aplica DRY y reduce el riesgo de que una modalidad de compra genere datos de retiro distintos a la otra. Para domicilio continúa devolviendo `None` en los tres campos.

Los cambios son refactorizaciones internas: no alteran rutas, contratos de respuesta ni reglas de negocio intencionales.

## Verificación

- `python -m py_compile` sobre cada archivo modificado: correcto.
- `python -m compileall -q backend/app`: correcto.
- El análisis del editor no pudo resolver `fastapi` en el intérprete activo para `routers/carrito.py`; no señaló errores de sintaxis en los archivos modificados. No se encontraron pruebas automatizadas del backend en la búsqueda realizada.

## Conclusión

Los cambios aplican DRY, nombres explícitos y valores por instancia donde se identificaron problemas concretos. En los archivos sin cambios, las responsabilidades observadas ya están suficientemente delimitadas para los criterios de esta actividad. La separación entre persistencia JSON y MySQL en el modelo del carrito queda como mejora futura y debe acompañarse de pruebas de integración.