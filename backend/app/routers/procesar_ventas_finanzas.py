"""
Script para procesar ventas de prueba y registrarlas en BookyPago Finanzas
"""
import json
import os
from datetime import datetime

# Rutas de archivos
ORDERS_FILE = os.path.join(os.path.dirname(__file__), 'backend', 'app', 'data', 'orders.json')
FINANZAS_FILE = os.path.join(os.path.dirname(__file__), 'backend', 'app', 'data', 'finanzas.json')
PAGOS_VENDEDORES_FILE = os.path.join(os.path.dirname(__file__), 'backend', 'app', 'data', 'pagos_vendedores.json')

# Configuración de comisiones
COMISION_VENTA = 0.10  # 10%

# Mapeo de compradores a vendedores (vendedores 26-30)
COMPRADOR_VENDEDOR = {
    16: 26, 17: 27, 18: 28, 19: 29, 20: 30,
    21: 26, 22: 27, 23: 28, 24: 29, 25: 30
}

def load_json(file_path):
    """Carga archivo JSON"""
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error cargando {file_path}: {e}")
        return {}

def save_json(file_path, data):
    """Guarda archivo JSON"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def procesar_ventas():
    """Procesa todas las ventas y las registra en finanzas"""
    
    # Cargar datos
    orders = load_json(ORDERS_FILE)
    finanzas = load_json(FINANZAS_FILE)
    pagos_vendedores = load_json(PAGOS_VENDEDORES_FILE)
    
    # Inicializar estructuras si no existen
    if 'ingresos' not in finanzas:
        finanzas['ingresos'] = []
    if 'pagos' not in finanzas:
        finanzas['pagos'] = []
    
    if isinstance(pagos_vendedores, dict):
        pagos_vendedores = []
    
    # Limpiar datos previos incorrectos (IDs duplicados)
    finanzas['ingresos'] = [ing for ing in finanzas['ingresos'] if ing.get('id') <= 4]
    pagos_vendedores = []
    
    # Contador para IDs únicos
    next_ingreso_id = max([ing.get('id', 0) for ing in finanzas['ingresos']] + [0]) + 1
    next_pago_id = 1
    
    # Procesar cada comprador
    ingresos_nuevos = []
    pagos_nuevos = []
    ventas_procesadas = 0
    
    for id_comprador, ordenes in orders.items():
        try:
            id_comprador_int = int(id_comprador)
            if id_comprador_int not in range(16, 26):  # Solo compradores 16-25
                continue
                
            id_vendedor = COMPRADOR_VENDEDOR.get(id_comprador_int, 26)
            
            for orden in ordenes:
                # Solo procesar ventas pagadas, enviadas o entregadas
                if orden['estado'] in ['pagado', 'Enviado', 'Entregado']:
                    monto_venta = orden['total']
                    comision = monto_venta * COMISION_VENTA
                    monto_vendedor = monto_venta - comision
                    
                    # Usar ID único compuesto para evitar duplicados
                    venta_key = f"{id_comprador_int}_{orden['id_orden']}"
                    
                    # Verificar si ya existe este ingreso
                    existe = False
                    for ing in finanzas['ingresos']:
                        if ing.get('tipo') == 'venta' and ing.get('venta_key') == venta_key:
                            existe = True
                            break
                    
                    if not existe:
                        # Registrar ingreso de BookyHome
                        nuevo_ingreso = {
                            'id': next_ingreso_id,
                            'tipo': 'venta',
                            'venta_key': venta_key,
                            'id_venta': orden['id_orden'],
                            'id_vendedor': id_vendedor,
                            'monto_venta': monto_venta,
                            'comision': comision,
                            'monto': comision,  # BookyHome gana la comisión
                            'fecha': orden['fecha'],
                            'estado': 'procesado'
                        }
                        ingresos_nuevos.append(nuevo_ingreso)
                        next_ingreso_id += 1
                        
                        # Registrar pago pendiente al vendedor
                        nuevo_pago = {
                            'id': next_pago_id,
                            'id_vendedor': id_vendedor,
                            'monto': monto_vendedor,
                            'id_venta': orden['id_orden'],
                            'fecha_venta': orden['fecha'],
                            'estado': 'pendiente',
                            'fecha_programada': orden['fecha']
                        }
                        pagos_nuevos.append(nuevo_pago)
                        next_pago_id += 1
                        
                        ventas_procesadas += 1
                        
                        print(f"Venta procesada: Comprador {id_comprador_int} -> Vendedor {id_vendedor}")
                        print(f"  Monto: ${monto_venta:,.0f} | Comision: ${comision:,.0f} | Pago vendedor: ${monto_vendedor:,.0f}")
                        
        except ValueError:
            continue
    
    # Guardar nuevos datos
    finanzas['ingresos'].extend(ingresos_nuevos)
    pagos_vendedores.extend(pagos_nuevos)
    
    save_json(FINANZAS_FILE, finanzas)
    save_json(PAGOS_VENDEDORES_FILE, pagos_vendedores)
    
    # Mostrar resumen
    total_ingresos = sum(ing['monto'] for ing in finanzas['ingresos'])
    total_pagos = sum(pag['monto'] for pag in pagos_vendedores)
    
    print(f"\nRESUMEN FINAL:")
    print(f"Ventas procesadas: {ventas_procesadas}")
    print(f"Ingresos nuevos: {len(ingresos_nuevos)}")
    print(f"Pagos pendientes nuevos: {len(pagos_nuevos)}")
    print(f"Total ingresos BookyHome: ${total_ingresos:,.0f}")
    print(f"Total pagos vendedores: ${total_pagos:,.0f}")
    print(f"Balance actual: ${total_ingresos - total_pagos:,.0f}")

if __name__ == '__main__':
    procesar_ventas()