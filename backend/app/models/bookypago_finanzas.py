"""
Sistema de Finanzas BookyPago
Gestiona los ingresos y pagos de BookyHome como empresa
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional

STORAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
FINANZAS_FILE = os.path.join(STORAGE_DIR, 'finanzas.json')
PAGOS_VENDEDORES_FILE = os.path.join(STORAGE_DIR, 'pagos_vendedores.json')
COMISIONES_FILE = os.path.join(STORAGE_DIR, 'comisiones.json')

os.makedirs(STORAGE_DIR, exist_ok=True)


def _load_store(path):
    """Carga datos desde archivo JSON"""
    if not os.path.exists(path):
        return {}
    try:
        with open(path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception:
        return {}


def _save_store(path, data):
    """Guarda datos en archivo JSON"""
    with open(path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


class BookyPagoFinanzas:
    """
    Sistema de finanzas de BookyHome
    Gestiona ingresos, pagos a vendedores, planes e impulsos
    """
    
    def __init__(self, config: Dict = None):
        """
        Inicializa el sistema de finanzas
        
        Args:
            config: Diccionario con configuración de comisiones
        """
        self.config = config or {
            'comision_venta': 0.15,  # 15% comisión por venta
            'comision_impulso': 0.10,  # 10% comisión por impulso
            'comision_plan': 0.08,  # 8% comisión por plan
            'minimo_pago': 50000,  # Mínimo para retirar
            'dias_pago': 7  # Días para procesar pagos
        }
    
    def obtener_balance(self) -> Dict:
        """
        Obtiene el balance financiero de BookyHome.

        Ingresos = suma de comisiones reales cobradas por BookyHome.
        Egresos  = solo pagos que BookyHome hace con su propio dinero
                   (operativos). Los pagos de nómina a vendedores son
                   traslados del dinero del vendedor, NO un gasto de
                   BookyHome, así que no restan del balance.
        """
        finanzas = _load_store(FINANZAS_FILE)

        ingresos = finanzas.get('ingresos', [])
        pagos    = finanzas.get('pagos', [])

        # Ingreso real de BookyHome = la comisión cobrada en cada transacción.
        # Usamos 'comision' si existe; si no, caemos a 'monto' por compatibilidad
        # con registros viejos donde ambos campos coincidían para ventas.
        total_ingresos = sum(
            float(ing.get('comision') or ing.get('monto', 0))
            for ing in ingresos
        )

        # Solo restar pagos operativos de BookyHome (tipo != 'nomina').
        # Los pagos de nómina son traslados al vendedor con dinero que
        # nunca perteneció a BookyHome (85% de la venta).
        pagos_operativos = [
            p for p in pagos
            if p.get('estado') == 'procesado' and p.get('tipo') != 'nomina'
        ]
        total_pagos = sum(float(p.get('monto', 0)) for p in pagos_operativos)

        balance = total_ingresos - total_pagos

        return {
            'ingresos_totales': total_ingresos,
            'pagos_totales': total_pagos,
            'balance': balance,
            'ingresos_por_tipo': self._ingresos_por_tipo(ingresos),
            'pagos_pendientes': len([p for p in pagos if p.get('estado') == 'pendiente']),
        }
    
    def _ingresos_por_tipo(self, ingresos: List) -> Dict:
        """Desglosa ingresos (comisiones reales) por tipo"""
        tipos = {}
        for ing in ingresos:
            tipo = ing.get('tipo', 'otro')
            if tipo not in tipos:
                tipos[tipo] = 0
            tipos[tipo] += float(ing.get('comision') or ing.get('monto', 0))
        return tipos
    
    def registrar_ingreso_venta(self, id_venta: int, monto_venta: float, id_vendedor: int) -> Dict:
        """
        Registra el ingreso de BookyHome por una venta
        
        Args:
            id_venta: ID de la venta
            monto_venta: Monto total de la venta
            id_vendedor: ID del vendedor
            
        Returns:
            Resultado de la operación
        """
        try:
            finanzas = _load_store(FINANZAS_FILE)
            
            if 'ingresos' not in finanzas:
                finanzas['ingresos'] = []
            
            # Calcular comisión de BookyHome
            comision = monto_venta * self.config['comision_venta']
            monto_vendedor = monto_venta - comision
            
            # Registrar ingreso de BookyHome
            ingreso = {
                'id': len(finanzas['ingresos']) + 1,
                'tipo': 'venta',
                'id_venta': id_venta,
                'id_vendedor': id_vendedor,
                'monto_venta': monto_venta,
                'comision': comision,
                'monto': comision,  # BookyHome gana la comisión
                'fecha': datetime.utcnow().isoformat() + 'Z',
                'estado': 'procesado'
            }
            
            finanzas['ingresos'].append(ingreso)
            _save_store(FINANZAS_FILE, finanzas)
            
            # Registrar pago pendiente al vendedor
            self._registrar_pago_pendiente_vendedor(id_vendedor, monto_vendedor, id_venta)
            
            return {
                'ok': True,
                'ingreso': ingreso,
                'pago_vendedor': monto_vendedor,
                'comision_bookyhome': comision
            }
            
        except Exception as e:
            return {'ok': False, 'error': str(e)}
    
    def registrar_ingreso_plan(self, id_tienda: int, id_plan: int, monto_plan: float, periodicidad: str) -> Dict:
        """
        Registra el ingreso por suscripción de plan
        
        Args:
            id_tienda: ID de la tienda
            id_plan: ID del plan
            monto_plan: Monto del plan
            periodicidad: mensual/anual
            
        Returns:
            Resultado de la operación
        """
        try:
            finanzas = _load_store(FINANZAS_FILE)
            
            if 'ingresos' not in finanzas:
                finanzas['ingresos'] = []
            
            # Calcular comisión de BookyHome (si aplica)
            comision = monto_plan * self.config['comision_plan']
            
            ingreso = {
                'id': len(finanzas['ingresos']) + 1,
                'tipo': 'plan',
                'id_tienda': id_tienda,
                'id_plan': id_plan,
                'monto_plan': monto_plan,
                'comision': comision,
                'monto': monto_plan - comision,  # Ingreso neto
                'periodicidad': periodicidad,
                'fecha': datetime.utcnow().isoformat() + 'Z',
                'estado': 'procesado'
            }
            
            finanzas['ingresos'].append(ingreso)
            _save_store(FINANZAS_FILE, finanzas)
            
            return {'ok': True, 'ingreso': ingreso}
            
        except Exception as e:
            return {'ok': False, 'error': str(e)}
    
    def registrar_ingreso_impulso(self, id_impulso: int, id_tienda: int, monto_impulso: float) -> Dict:
        """
        Registra el ingreso por impulso promocional
        
        Args:
            id_impulso: ID del impulso
            id_tienda: ID de la tienda
            monto_impulso: Monto del impulso
            
        Returns:
            Resultado de la operación
        """
        try:
            finanzas = _load_store(FINANZAS_FILE)
            
            if 'ingresos' not in finanzas:
                finanzas['ingresos'] = []
            
            # Calcular comisión de BookyHome
            comision = monto_impulso * self.config['comision_impulso']
            
            ingreso = {
                'id': len(finanzas['ingresos']) + 1,
                'tipo': 'impulso',
                'id_impulso': id_impulso,
                'id_tienda': id_tienda,
                'monto_impulso': monto_impulso,
                'comision': comision,
                'monto': monto_impulso - comision,  # Ingreso neto
                'fecha': datetime.utcnow().isoformat() + 'Z',
                'estado': 'procesado'
            }
            
            finanzas['ingresos'].append(ingreso)
            _save_store(FINANZAS_FILE, finanzas)
            
            return {'ok': True, 'ingreso': ingreso}
            
        except Exception as e:
            return {'ok': False, 'error': str(e)}
    
    def _registrar_pago_pendiente_vendedor(self, id_vendedor: int, monto: float, id_venta: int):
        """Registra un pago pendiente para un vendedor"""
        pagos_vendedores = _load_store(PAGOS_VENDEDORES_FILE)
        
        if isinstance(pagos_vendedores, dict):
            pagos_vendedores = []
        
        pago_pendiente = {
            'id': len(pagos_vendedores) + 1,
            'id_vendedor': id_vendedor,
            'monto': monto,
            'id_venta': id_venta,
            'fecha_venta': datetime.utcnow().isoformat() + 'Z',
            'estado': 'pendiente',
            'fecha_programada': (datetime.utcnow().timestamp() + (self.config['dias_pago'] * 86400))
        }
        
        pagos_vendedores.append(pago_pendiente)
        _save_store(PAGOS_VENDEDORES_FILE, pagos_vendedores)
    
    def obtener_pagos_pendientes_vendedor(self, id_vendedor: int) -> List:
        """Obtiene los pagos pendientes de un vendedor"""
        pagos_vendedores = _load_store(PAGOS_VENDEDORES_FILE)
        
        if isinstance(pagos_vendedores, dict):
            pagos_vendedores = []
        
        pagos_vendedor = [
            p for p in pagos_vendedores 
            if p['id_vendedor'] == id_vendedor and p['estado'] == 'pendiente'
        ]
        
        return sorted(pagos_vendedor, key=lambda x: x['fecha_venta'])
    
    def obtener_nomina(self) -> Dict:
        """
        Obtiene la nómina: todos los pagos pendientes agrupados por vendedor
        
        Returns:
            Diccionario con pagos pendientes agrupados por vendedor
        """
        pagos_vendedores = _load_store(PAGOS_VENDEDORES_FILE)
        
        if isinstance(pagos_vendedores, dict):
            pagos_vendedores = []
        
        # Filtrar solo pagos pendientes
        pagos_pendientes = [p for p in pagos_vendedores if p['estado'] == 'pendiente']
        
        # Agrupar por vendedor
        nomina = {}
        for pago in pagos_pendientes:
            id_vendedor = pago['id_vendedor']
            if id_vendedor not in nomina:
                nomina[id_vendedor] = {
                    'id_vendedor': id_vendedor,
                    'total_pendiente': 0,
                    'pagos': []
                }
            nomina[id_vendedor]['total_pendiente'] += pago['monto']
            nomina[id_vendedor]['pagos'].append(pago)
        
        return {
            'vendedores': list(nomina.values()),
            'total_general': sum(v['total_pendiente'] for v in nomina.values()),
            'total_vendedores': len(nomina)
        }
    
    def procesar_nomina_vendedor(self, id_vendedor: int, referencia: str) -> Dict:
        """
        Procesa todos los pagos pendientes de un vendedor en lote
        
        Args:
            id_vendedor: ID del vendedor
            referencia: Referencia bancaria del pago
            
        Returns:
            Resultado de la operación
        """
        try:
            pagos_vendedores = _load_store(PAGOS_VENDEDORES_FILE)
            
            if isinstance(pagos_vendedores, dict):
                pagos_vendedores = []
            
            # Filtrar pagos pendientes del vendedor
            pagos_vendedor = [
                p for p in pagos_vendedores 
                if p['id_vendedor'] == id_vendedor and p['estado'] == 'pendiente'
            ]
            
            if not pagos_vendedor:
                return {'ok': False, 'error': 'No hay pagos pendientes para este vendedor'}
            
            # Actualizar estado de todos los pagos
            total_procesado = 0
            for pago in pagos_vendedor:
                pago['estado'] = 'procesado'
                pago['fecha_pago'] = datetime.utcnow().isoformat() + 'Z'
                pago['referencia'] = referencia
                total_procesado += pago['monto']
            
            _save_store(PAGOS_VENDEDORES_FILE, pagos_vendedores)
            
            # Registrar el pago en finanzas
            finanzas = _load_store(FINANZAS_FILE)
            if 'pagos' not in finanzas:
                finanzas['pagos'] = []
            
            pago_registro = {
                'id': len(finanzas['pagos']) + 1,
                'tipo': 'nomina',
                'id_vendedor': id_vendedor,
                'monto': total_procesado,
                'referencia': referencia,
                'fecha': datetime.utcnow().isoformat() + 'Z',
                'estado': 'procesado',
                'num_pagos': len(pagos_vendedor)
            }
            
            finanzas['pagos'].append(pago_registro)
            _save_store(FINANZAS_FILE, finanzas)
            
            return {
                'ok': True,
                'num_pagos': len(pagos_vendedor),
                'total_procesado': total_procesado,
                'referencia': referencia
            }
            
        except Exception as e:
            return {'ok': False, 'error': str(e)}
    
    def procesar_pago_vendedor(self, id_pago: int) -> Dict:
        """
        Procesa un pago a un vendedor
        
        Args:
            id_pago: ID del pago a procesar
            
        Returns:
            Resultado de la operación
        """
        try:
            pagos_vendedores = _load_store(PAGOS_VENDEDORES_FILE)
            
            if isinstance(pagos_vendedores, dict):
                pagos_vendedores = []
            
            pago = None
            for p in pagos_vendedores:
                if p['id'] == id_pago:
                    pago = p
                    break
            
            if not pago:
                return {'ok': False, 'error': 'Pago no encontrado'}
            
            if pago['estado'] != 'pendiente':
                return {'ok': False, 'error': 'Pago ya procesado'}
            
            # Actualizar estado del pago
            pago['estado'] = 'procesado'
            pago['fecha_procesado'] = datetime.utcnow().isoformat() + 'Z'
            
            # Registrar en finanzas como egreso
            finanzas = _load_store(FINANZAS_FILE)
            
            if 'pagos' not in finanzas:
                finanzas['pagos'] = []
            
            egreso = {
                'id': len(finanzas['pagos']) + 1,
                'tipo': 'pago_vendedor',
                'id_pago_vendedor': id_pago,
                'id_vendedor': pago['id_vendedor'],
                'monto': pago['monto'],
                'fecha': datetime.utcnow().isoformat() + 'Z',
                'estado': 'completado'
            }
            
            finanzas['pagos'].append(egreso)
            _save_store(FINANZAS_FILE, finanzas)
            _save_store(PAGOS_VENDEDORES_FILE, pagos_vendedores)
            
            return {'ok': True, 'pago': egreso}
            
        except Exception as e:
            return {'ok': False, 'error': str(e)}
    
    def obtener_historial_financiero(self, dias: int = 30) -> Dict:
        """
        Obtiene el historial financiero de los últimos N días
        
        Args:
            dias: Número de días de historial
            
        Returns:
            Historial de ingresos y pagos
        """
        finanzas = _load_store(FINANZAS_FILE)
        
        fecha_limite = datetime.utcnow().timestamp() - (dias * 86400)
        
        ingresos = finanzas.get('ingresos', [])
        pagos = finanzas.get('pagos', [])
        
        # Filtrar por fecha
        ingresos_recientes = [
            ing for ing in ingresos 
            if datetime.fromisoformat(ing['fecha'].replace('Z', '+00:00')).timestamp() > fecha_limite
        ]
        
        pagos_recientes = [
            pag for pag in pagos 
            if datetime.fromisoformat(pag['fecha'].replace('Z', '+00:00')).timestamp() > fecha_limite
        ]
        
        return {
            'ingresos': ingresos_recientes,
            'pagos': pagos_recientes,
            'periodo_dias': dias
        }
    
    def obtener_estadisticas(self) -> Dict:
        """
        Obtiene estadísticas financieras
        
        Returns:
            Estadísticas de ingresos, pagos y proyecciones
        """
        balance = self.obtener_balance()
        historial = self.obtener_historial_financiero(30)
        
        return {
            'balance_actual': balance,
            'ingresos_30_dias': sum(
                float(ing.get('comision') or ing.get('monto', 0))
                for ing in historial['ingresos']
            ),
            'pagos_30_dias': sum(float(pag.get('monto', 0)) for pag in historial['pagos']),
            'promedio_diario': sum(
                float(ing.get('comision') or ing.get('monto', 0))
                for ing in historial['ingresos']
            ) / 30,
            'ventas_totales':      len([i for i in historial['ingresos'] if i.get('tipo') == 'venta']),
            'planes_activos':      len([i for i in historial['ingresos'] if i.get('tipo') == 'plan']),
            'impulsos_comprados':  len([i for i in historial['ingresos'] if i.get('tipo') == 'impulso']),
        }


# Instancia global del sistema de finanzas
bookypago_finanzas = BookyPagoFinanzas()