import { describe, expect, it, vi } from 'vitest';
import {
  buildPeriodData,
  dateKey,
  fmt,
  formatPeriodDate,
  getBookImageUri,
  getNotificationIcon,
  parseSaleDate,
} from '../../utils/vendedorHome.js';

const referenceDate = () => new Date(2026, 2, 11, 12);

describe('utilidades del inicio del vendedor', () => {
  it('formatea montos en pesos colombianos y maneja valores ausentes', () => {
    const expected = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(1234);

    expect(fmt(null)).toBe('$0 COP');
    expect(fmt(1234.99)).toBe(expected);
  });

  it.each([
    [{ imagen_url: '/primary.jpg', imagen: '/fallback.jpg' }, '/primary.jpg'],
    [{ imagen_principal: '/cover.jpg' }, '/cover.jpg'],
    [{ imagen: '/image.jpg' }, '/image.jpg'],
    [{ imagenes: ['/first.jpg', '/second.jpg'] }, '/first.jpg'],
    [{ imagenes: '/single.jpg' }, '/single.jpg'],
    [{ foto: '/photo.jpg' }, '/photo.jpg'],
    [{}, undefined],
  ])('resuelve la imagen del libro %# usando su primera fuente disponible', (book, image) => {
    const resolveImageUrl = vi.fn((value) => value ? `resolved:${value}` : null);

    expect(getBookImageUri(book, resolveImageUrl)).toBe(image ? `resolved:${image}` : null);
    expect(resolveImageUrl).toHaveBeenCalledWith(image);
  });

  it.each([
    ['PEDIDO_NUEVO', '🛍️'],
    ['orden', '🛍️'],
    ['pago_recibido', '💳'],
    ['mensaje', '💬'],
    ['entrega', '🚚'],
    ['envio', '🚚'],
    ['resena', '⭐'],
    [null, '🔔'],
    ['otro', '🔔'],
  ])('elige el icono para la notificación %s', (type, icon) => {
    expect(getNotificationIcon(type)).toBe(icon);
  });

  it('parsea fechas ISO locales, fechas estándar e ignora valores inválidos', () => {
    const localDate = parseSaleDate('2026-03-07T22:15:00Z');
    const timestamp = parseSaleDate(new Date('2026-03-07T12:15:00Z'));

    expect(localDate.getFullYear()).toBe(2026);
    expect(localDate.getMonth()).toBe(2);
    expect(localDate.getDate()).toBe(7);
    expect(localDate.getHours()).toBe(0);
    expect(timestamp.toISOString()).toBe('2026-03-07T12:15:00.000Z');
    expect(parseSaleDate(null)).toBeNull();
    expect(parseSaleDate('fecha inválida')).toBeNull();
  });

  it('genera claves de fecha y presenta fechas en español', () => {
    const date = new Date(2026, 2, 7);

    expect(dateKey(date)).toBe('2026-03-07');
    expect(formatPeriodDate(date, { month: 'long' })).toMatch(/marzo/i);
  });

  it('agrupa las ventas por día de lunes a domingo y cuenta órdenes únicas', () => {
    const sales = [
      { fecha: '2026-03-09', total: 100, id_orden: 1 },
      { fecha: '2026-03-09', total: 50, id_orden: 1 },
      { fecha: '2026-03-11', total: 75, id_orden: 2 },
      { fecha: '2026-03-20', total: 999, id_orden: 3 },
      { fecha: 'inválida', total: 500, id_orden: 4 },
    ];
    const { items, titulo } = buildPeriodData(sales, 'semana', 0, referenceDate());

    expect(items).toHaveLength(7);
    expect(items.map((item) => item.label)).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
    expect(items[0]).toMatchObject({ total: 150, ordenes: 1, esHoy: false });
    expect(items[2]).toMatchObject({ total: 75, ordenes: 1, esHoy: true });
    expect(items[6].total).toBe(0);
    expect(titulo).toContain('Esta semana');
  });

  it('ajusta el gráfico semanal cuando se consulta una semana anterior', () => {
    const { items, titulo } = buildPeriodData([], 'semana', -1, referenceDate());

    expect(items[0].fecha).toEqual(new Date(2026, 2, 2));
    expect(items.some((item) => item.esHoy)).toBe(false);
    expect(titulo).not.toContain('Esta semana');
  });

  it('calcula todos los días del mes y marca el día actual', () => {
    const { items, titulo } = buildPeriodData([
      { fecha: '2026-03-11', total: 320, id_orden: 7 },
    ], 'mes', 0, referenceDate());

    expect(items).toHaveLength(31);
    expect(items[10]).toMatchObject({ label: '11', total: 320, esHoy: true });
    expect(titulo).toContain('Este mes');
  });

  it('incluye doce meses para el año consultado y desplaza correctamente años previos', () => {
    const { items, titulo } = buildPeriodData([
      { fecha: '2025-07-14', total: 450, id_orden: 12 },
      { fecha: '2025-07-22', total: 50, id_orden: 13 },
    ], 'anio', -1, referenceDate());

    expect(items).toHaveLength(12);
    expect(items[6]).toMatchObject({ label: 'Jul', total: 500, ordenes: 2 });
    expect(items[2].esHoy).toBe(false);
    expect(titulo).toBe('Año 2025');
  });

  it('acepta una lista de ventas vacía o con formato inesperado', () => {
    expect(buildPeriodData(null, 'anio', 0, referenceDate()).items).toHaveLength(12);
  });
});
