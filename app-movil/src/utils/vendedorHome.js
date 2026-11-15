export const fmt = (val) =>
  val == null
    ? '$0 COP'
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.floor(val));

export const getBookImageUri = (book, resolveImageUrl) => {
  const raw = book?.imagen_url || book?.imagen_principal || book?.imagen
    || (Array.isArray(book?.imagenes) ? book.imagenes[0] : book?.imagenes) || book?.foto;
  return resolveImageUrl(raw);
};

export const getNotificationIcon = (type) => {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('pedido') || normalized.includes('orden')) return '🛍️';
  if (normalized.includes('pago')) return '💳';
  if (normalized.includes('mensaje')) return '💬';
  if (normalized.includes('entrega') || normalized.includes('envio')) return '🚚';
  if (normalized.includes('resena')) return '⭐';
  return '🔔';
};

export const parseSaleDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatPeriodDate = (date, options) => date.toLocaleDateString('es-CO', options);

export const buildPeriodData = (ventas, periodoGrafico, desplazamientoGrafico, fechaActual = new Date()) => {
  const hoy = new Date(fechaActual);
  hoy.setHours(0, 0, 0, 0);
  let inicio;
  let cantidad;
  let titulo;
  let paso;
  let etiquetas;

  if (periodoGrafico === 'semana') {
    const diaSemana = (hoy.getDay() + 6) % 7;
    inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diaSemana + desplazamientoGrafico * 7);
    cantidad = 7;
    paso = 'dia';
    etiquetas = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    titulo = desplazamientoGrafico === 0
      ? `Esta semana · ${formatPeriodDate(inicio, { day: 'numeric', month: 'short' })} - ${formatPeriodDate(fin, { day: 'numeric', month: 'short' })}`
      : `${formatPeriodDate(inicio, { day: 'numeric', month: 'short' })} - ${formatPeriodDate(fin, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } else if (periodoGrafico === 'mes') {
    const mes = new Date(hoy.getFullYear(), hoy.getMonth() + desplazamientoGrafico, 1);
    inicio = mes;
    cantidad = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    paso = 'dia';
    etiquetas = Array.from({ length: cantidad }, (_, index) => String(index + 1));
    titulo = formatPeriodDate(mes, { month: 'long', year: 'numeric' });
    titulo = desplazamientoGrafico === 0 ? `Este mes · ${titulo}` : titulo;
  } else {
    const anio = hoy.getFullYear() + desplazamientoGrafico;
    inicio = new Date(anio, 0, 1);
    cantidad = 12;
    paso = 'mes';
    etiquetas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    titulo = desplazamientoGrafico === 0 ? `Este año · ${anio}` : `Año ${anio}`;
  }

  const totales = new Map();
  (Array.isArray(ventas) ? ventas : []).forEach((venta) => {
    const fecha = parseSaleDate(venta.fecha);
    if (!fecha) return;
    const clave = paso === 'dia'
      ? dateKey(fecha)
      : `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const agregado = totales.get(clave) || { total: 0, ordenes: new Set() };
    agregado.total += Number(venta.total) || 0;
    if (venta.id_orden != null) agregado.ordenes.add(venta.id_orden);
    totales.set(clave, agregado);
  });

  const items = Array.from({ length: cantidad }, (_, index) => {
    const fecha = new Date(inicio);
    if (paso === 'dia') fecha.setDate(inicio.getDate() + index);
    else fecha.setMonth(index);
    const clave = paso === 'dia'
      ? dateKey(fecha)
      : `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const agregado = totales.get(clave);
    const esHoy = paso === 'mes'
      ? fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth()
      : dateKey(fecha) === dateKey(hoy);
    return {
      label: etiquetas[index],
      fecha,
      total: agregado?.total || 0,
      ordenes: agregado?.ordenes.size || 0,
      esHoy,
    };
  });

  return { titulo, items };
};
