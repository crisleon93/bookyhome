# Documentacion funcional de BookyHome

Esta carpeta contiene la documentacion de requisitos del proyecto BookyHome. Estos documentos describen el alcance funcional esperado del sistema final, no solamente el estado actual del codigo.

## Proposito

Los documentos de `docs/requisitos` deben servir como guia para construir y validar el proyecto. Si una funcionalidad aparece en esta documentacion, se entiende como parte del producto objetivo, aunque todavia pueda estar pendiente, parcial o en desarrollo dentro del codigo.

## Estructura

```text
docs/
  README.md
  requisitos/
    HIS/   Historias de usuario
    RF/    Requisitos funcionales
    RNF/   Requisitos no funcionales
```

## Criterio de actualizacion

Los requisitos deben mantenerse alineados con la vision final del producto:

- Marketplace de libros con comprador, vendedor y administrador.
- Frontend web como experiencia principal.
- App movil para comprador.
- Backend FastAPI como API central.
- MySQL como base de datos principal.
- Autenticacion con JWT.
- Catalogo, busqueda, detalle, favoritos, carrito, checkout, pagos y pedidos.
- Panel de vendedor con publicacion, gestion de libros, stock, ofertas y ventas.
- Funciones futuras documentadas como parte del alcance final, aunque aun no esten implementadas.

## Estados sugeridos

Para evitar confusion entre documentacion y avance tecnico, cada requisito puede usar uno de estos estados:

- `Alcance final`: funcionalidad esperada para la version final.
- `En desarrollo`: funcionalidad que ya se esta construyendo.
- `Parcial`: funcionalidad existente pero incompleta.
- `Implementado`: funcionalidad terminada y probada.
- `Pendiente`: funcionalidad definida pero no iniciada.

## Regla importante

Los endpoints y flujos descritos en los requisitos deben ser coherentes con la arquitectura esperada del proyecto. BookyHome usa rutas en espanol para varios modulos actuales (`/carrito`, `/libros`, `/ofertas`) y rutas versionadas para pagos/ordenes (`/api/v1/payments`, `/api/v1/orders`).

