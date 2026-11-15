import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  estadoLabel,
  getPaginationItems,
  infoEstadoEnvio,
  normalizarEstado,
  parseFechaPedido,
} from '../../utils/pedidosVendedor.js';

describe('utilidades de pedidos del vendedor', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['pagada', 'pagado'],
    ['APROBADO', 'pagado'],
    [' en_camino ', 'enviado'],
    ['completada', 'entregada'],
    ['anulado', 'cancelada'],
    ['', 'pendiente'],
    [null, 'pendiente'],
    ['estado-desconocido', 'pendiente'],
  ])('normaliza el estado %s', (input, expected) => {
    expect(normalizarEstado(input)).toBe(expected);
  });

  it('presenta una etiqueta legible y conserva estados desconocidos', () => {
    expect(estadoLabel('entregada')).toBe('Entregado');
    expect(estadoLabel('otro')).toBe('otro');
  });

  it('genera páginas completas cuando hay cinco o menos', () => {
    expect(getPaginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationItems(1, 0)).toEqual([]);
  });

  it.each([
    [2, [1, 2, 3, 'end-ellipsis', 10]],
    [5, [1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 10]],
    [9, [1, 'start-ellipsis', 8, 9, 10]],
  ])('muestra la ventana de páginas alrededor de la página %i', (current, expected) => {
    expect(getPaginationItems(current, 10)).toEqual(expected);
  });

  it('interpreta fechas ISO sin zona horaria como fechas locales', () => {
    const date = parseFechaPedido('2026-03-07');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(7);
    expect(date.getHours()).toBe(0);
  });

  it('conserva objetos Date válidos', () => {
    const date = new Date('2026-03-07T12:15:00Z');

    expect(parseFechaPedido(date)).toEqual(date);
  });

  it('usa la fecha actual para valores ausentes o inválidos', () => {
    const now = new Date('2026-03-07T12:00:00');
    vi.setSystemTime(now);

    expect(parseFechaPedido(null)).toEqual(now);
    expect(parseFechaPedido('fecha-inválida')).toEqual(now);
  });

  it.each([
    [{ estado: 'entregada' }, { clase: 'entregado', texto: 'Entregado' }],
    [{ estado: 'pagado' }, { clase: 'alerta', texto: 'Sin guía' }],
    [{ estado: 'pendiente' }, { clase: 'pendiente', texto: 'Pendiente' }],
    [{ estado: 'entregada', envio: {} }, { clase: 'entregado', texto: 'Entregado' }],
    [{ estado: 'pagado', envio: {} }, { clase: 'camino', texto: 'En tránsito' }],
    [{ estado: 'enviado', envio: { estado_envio: 'Entrega completada' } }, { clase: 'entregado', texto: 'Entregado' }],
    [{ estado: 'enviado', envio: { estado_envio: 'En ruta' } }, { clase: 'camino', texto: 'En tránsito' }],
    [{ estado: 'enviado', envio: { estado_envio: 'Devolución' } }, { clase: 'devolucion', texto: 'Devolución' }],
    [{ estado: 'enviado', envio: { estado_envio: 'En bodega' } }, { clase: 'procesando', texto: 'En bodega' }],
  ])('clasifica correctamente el envío %#', (pedido, expected) => {
    expect(infoEstadoEnvio(pedido)).toEqual(expected);
  });
});
