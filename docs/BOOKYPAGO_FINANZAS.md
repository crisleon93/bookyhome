# BookyPago Finanzas - Sistema de Gestión Financiera

## ¿Qué es BookyPago Finanzas?

BookyPago Finanzas es el sistema de gestión financiera interna de BookyHome. Permite al administrador gestionar los ingresos de la plataforma, procesar pagos a vendedores y mantener un control completo de las finanzas del negocio.

## Fuentes de Ingreso

BookyHome genera ingresos de 3 fuentes principales:

### 1. Ventas de Libros
- **Comisión**: 10% del valor de cada venta
- **Flujo**: 
  1. Comprador paga el libro
  2. BookyHome retiene la comisión (10%)
  3. El resto (90%) se acumula como pago pendiente para el vendedor
  4. Admin procesa la nómina para pagar a los vendedores

### 2. Planes de Herramientas (Vendedores)
- **Comisión**: 2% del precio del plan
- **Flujo**:
  1. Vendedor contrata un plan (Gratuito, Básico, Estándar, Premium)
  2. BookyHome registra el ingreso neto (precio - 2%)
  3. No hay pago pendiente al vendedor (ingreso 100% para BookyHome)

### 3. Impulsos Promocionales (Vendedores)
- **Comisión**: 5% del monto pagado
- **Flujo**:
  1. Vendedor contrata un impulso (libro destacado, banner, email, etc.)
  2. Aplica descuento según su plan de herramientas
  3. BookyHome registra el ingreso neto (monto pagado - 5%)
  4. No hay pago pendiente al vendedor (ingreso 100% para BookyHome)

## Configuración

### Variables de Entorno (.env)

```env
# Configuración de BookyPago Finanzas
BOOKYPAGO_COMISION_VENTA=0.10        # 10% comisión por venta
BOOKYPAGO_COMISION_IMPULSO=0.05      # 5% comisión por impulso
BOOKYPAGO_COMISION_PLAN=0.02         # 2% comisión por plan
BOOKYPAGO_DIAS_PAGO=7                # Días de retención antes de pagar al vendedor
BOOKYPAGO_MINIMO_PAGO=50000          # Mínimo para procesar nómina ($50,000 COP)
```

## Endpoints API

### Balance y Estadísticas

#### Obtener Balance
```http
GET /api/v1/bookypago-finanzas/balance
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "ok": true,
  "balance": {
    "ingresos_totales": 1500000,
    "pagos_totales": 800000,
    "balance": 700000,
    "ingresos_por_tipo": {
      "venta": 1200000,
      "plan": 200000,
      "impulso": 100000
    },
    "pagos_pendientes": 15
  }
}
```

#### Obtener Estadísticas
```http
GET /api/v1/bookypago-finanzas/estadisticas
Authorization: Bearer {token}
```

#### Obtener Historial
```http
GET /api/v1/bookypago-finanzas/historial?dias=30
Authorization: Bearer {token}
```

### Registro Manual de Ingresos

#### Registrar Ingreso por Venta
```http
POST /api/v1/bookypago-finanzas/ingreso/venta
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_venta": 123,
  "monto_venta": 100000,
  "id_vendedor": 45
}
```

#### Registrar Ingreso por Plan
```http
POST /api/v1/bookypago-finanzas/ingreso/plan
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_tienda": 1,
  "id_plan": 2,
  "monto_plan": 15000,
  "periodicidad": "mensual"
}
```

#### Registrar Ingreso por Impulso
```http
POST /api/v1/bookypago-finanzas/ingreso/impulso
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_impulso": 789,
  "id_tienda": 1,
  "monto_impulso": 23750
}
```

### Nómina y Pagos a Vendedores

#### Obtener Nómina (Pagos Pendientes Agrupados)
```http
GET /api/v1/bookypago-finanzas/nomina
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "ok": true,
  "nomina": {
    "vendedores": [
      {
        "id_vendedor": 45,
        "total_pendiente": 270000,
        "pagos": [
          {
            "id": 1,
            "id_vendedor": 45,
            "monto": 90000,
            "id_venta": 123,
            "fecha_venta": "2026-07-30T12:00:00Z",
            "estado": "pendiente"
          }
        ]
      }
    ],
    "total_general": 270000,
    "total_pagos": 3
  }
}
```

#### Procesar Nómina de Vendedor
```http
POST /api/v1/bookypago-finanzas/nomina/procesar/{id_vendedor}
Authorization: Bearer {token}
Content-Type: application/json

{
  "referencia": "BANCOLOMBIA-REF-123456"
}
```

#### Obtener Pagos Pendientes de Vendedor Específico
```http
GET /api/v1/bookypago-finanzas/pagos-pendientes/{id_vendedor}
Authorization: Bearer {token}
```

## Integración Automática

El sistema de BookyPago Finanzas se integra automáticamente con los sistemas existentes:

### Ventas (payments.py)
Cuando se completa un pago:
- Calcula automáticamente la comisión (10%)
- Registra el ingreso de BookyHome
- Crea el pago pendiente para el vendedor

### Planes (herramientas.py)
Cuando un vendedor contrata un plan:
- Calcula la comisión de procesamiento (2%)
- Registra el ingreso neto para BookyHome

### Impulsos (impulsos.py)
Cuando un vendedor contrata un impulso:
- Aplica el descuento según el plan del vendedor
- Calcula la comisión (5% sobre el monto pagado)
- Registra el ingreso neto para BookyHome

## Flujo Financiero Completo

### 1. Venta de Libro
```
Comprador paga $100,000
    ↓
BookyHome retiene $10,000 (10% comisión)
    ↓
Vendedor acumula $90,000 (pago pendiente)
    ↓
Tras 7 días (o confirmación admin)
    ↓
Admin procesa nómina → Transfiere $90,000 al vendedor
```

### 2. Contratación de Plan
```
Vendedor contrata plan Básico ($15,000)
    ↓
BookyHome registra $14,700 (precio - 2% comisión)
    ↓
Ingreso 100% para BookyHome
```

### 3. Contratación de Impulso
```
Vendedor con plan Básico (5% descuento)
    ↓
Contrata impulso Libro Destacado ($25,000)
    ↓
Precio con descuento: $23,750
    ↓
BookyHome registra $22,562.50 (monto pagado - 5% comisión)
    ↓
Ingreso 100% para BookyHome
```

## Panel de Administración

El administrador puede acceder al panel de finanzas en `/admin/finanzas` donde puede:

### Dashboard
- Ver balance actual de BookyHome
- Ver ingresos totales y pagos realizados
- Ver desglose por tipo de ingreso
- Ver estadísticas financieras

### Nómina
- Ver todos los pagos pendientes agrupados por vendedor
- Ver detalle de cada pago pendiente
- Procesar pagos en lote a vendedores
- Ingresar referencia bancaria

### Historial
- Ver historial de ingresos (últimos 30 días)
- Ver historial de pagos realizados
- Filtrar por tipo de transacción

### Registro Manual
- Registrar ingresos manualmente (para casos especiales)
- Registrar ventas, planes o impulsos manualmente

## Planes de Herramientas y Descuentos

| Plan      | Precio/mes | Descuento en Impulsos |
|-----------|------------|------------------------|
| Gratuito  | $0         | 0%                     |
| Básico    | $15,000    | 5%                     |
| Estándar  | $29,000    | 10%                    |
| Premium   | $49,000    | 20%                    |

## Seguridad y Control

- **Roles**: Solo administradores pueden acceder al panel de finanzas
- **Autenticación**: Todos los endpoints requieren token JWT válido
- **Auditoría**: Todas las transacciones quedan registradas en historial
- **Validación**: Montos mínimos configurables para procesar nómina
- **Referencias**: Cada pago procesado requiere referencia bancaria

## Criterios de Éxito

1. ✅ Admin entra a `/admin/finanzas` y ve balance real de BookyHome
2. ✅ Al ocurrir una venta/plan/impulso, el ingreso se registra automáticamente
3. ✅ Admin ve pagos pendientes por vendedor con montos correctos
4. ✅ Admin puede procesar nómina: marcar pagos como realizados con referencia
5. ✅ Los porcentajes son consistentes en todo el sistema (una sola config)
6. ✅ El vendedor ve en su panel cuánto le deben y cuándo le pagarán

## Archivos del Sistema

### Backend
- `backend/app/models/bookypago_finanzas.py` - Lógica de finanzas
- `backend/app/routers/bookypago_finanzas.py` - Endpoints API
- `backend/app/data/finanzas.json` - Almacenamiento de finanzas
- `backend/app/data/pagos_vendedores.json` - Pagos pendientes a vendedores

### Frontend
- `frontend/src/pages/BookyPagoFinanzas.jsx` - Panel de finanzas
- `frontend/src/pages/AdminDashboard.jsx` - Acceso a finanzas desde dashboard admin
- `frontend/src/components/Icons.jsx` - Icono IconWallet

## Notas Importantes

- Este sistema es para gestión financiera interna de BookyHome
- No procesa pagos externos de usuarios (eso lo hace el sistema de payments existente)
- Es ideal para el proyecto del SENA, cumpliendo con los requisitos de gestión financiera
- Los porcentajes de comisión son configurables vía variables de entorno
- El sistema de nómina permite procesar pagos en lote para mayor eficiencia