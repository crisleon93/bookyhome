import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SeccionMisCompras from '../../components/dashboard/SeccionMisCompras';
import * as api from '../../services/api';
import * as ToastProvider from '../../components/ToastProvider';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../services/api', () => ({
  getOrdenes: vi.fn(),
  getDevoluciones: vi.fn(),
  getOrden: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  notificarLlegadaTienda: vi.fn(),
  cancelarMisPendientes: vi.fn(),
}));

const mockOrders = [
  {
    id_orden: 1,
    id_orden_db: 101,
    fecha: '2026-11-10T12:00:00',
    total: 80000,
    estado_orden: 'entregada',
    estado: 'entregada',
    tipo_entrega: 'domicilio',
    items: [{ id_libro: 10, titulo: 'Cien Años de Soledad', cantidad: 1, precio_libro: 80000 }],
    envio: { numero_guia: 'GUIA-123', transportadora: 'Coordinadora' },
  },
  {
    id_orden: 2,
    id_orden_db: 102,
    fecha: '2026-11-12T12:00:00',
    total: 30000,
    estado_orden: 'pendiente',
    estado: 'pendiente',
    tipo_entrega: 'retiro_tienda',
    estado_retiro: 'reservado',
    pin_retiro: '4567',
    tienda_retiro: { nombre_tienda: 'Librería Central' },
    items: [{ id_libro: 20, titulo: 'El Aleph', cantidad: 1, precio_libro: 30000 }],
  },
  {
    id_orden: 3,
    id_orden_db: 103,
    fecha: '2026-11-05T12:00:00',
    total: 15000,
    estado_orden: 'cancelada',
    estado: 'cancelada',
    tipo_entrega: 'domicilio',
    items: [],
  },
];

describe('SeccionMisCompras', () => {
  let notifySpy;

  beforeEach(() => {
    vi.clearAllMocks();
    notifySpy = vi.spyOn(ToastProvider, 'notify').mockImplementation(() => {});
    api.getOrdenes.mockResolvedValue({ data: mockOrders });
    api.getDevoluciones.mockResolvedValue({ data: [] });
    api.getOrden.mockResolvedValue({ data: mockOrders[0] });
    api.notificarLlegadaTienda.mockResolvedValue({ data: { ok: true } });
    api.cancelarMisPendientes.mockResolvedValue({ data: { ok: true, canceladas: 1 } });
    api.sendConfirmationEmail.mockResolvedValue({ data: { ok: true } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carga órdenes y muestra tarjetas y filtros', async () => {
    render(<SeccionMisCompras userId={1} />);

    expect(await screen.findByText(/#101/)).toBeInTheDocument();
    expect(screen.getByText(/#102/)).toBeInTheDocument();
    expect(screen.getByText(/#103/)).toBeInTheDocument();
    expect(screen.getByText('Cien Años de Soledad')).toBeInTheDocument();

    // Filtrar por búsqueda
    const searchInput = screen.getByPlaceholderText(/Buscar por # orden/i);
    fireEvent.change(searchInput, { target: { value: 'Aleph' } });
    expect(screen.getByText(/#102/)).toBeInTheDocument();
    expect(screen.queryByText(/#101/)).not.toBeInTheDocument();

    // Limpiar búsqueda
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText(/#101/)).toBeInTheDocument();
  });

  it('filtra por chips de estado y ordena por precio', async () => {
    render(<SeccionMisCompras userId={1} />);
    await screen.findByText(/#101/);

    // Hay múltiples botones con "Entregadas" (KPIs + chips de filtro)
    const chipsEntregadas = screen.getAllByRole('button', { name: /Entregadas/i });
    fireEvent.click(chipsEntregadas[0]);
    expect(screen.getByText(/#101/)).toBeInTheDocument();
    expect(screen.queryByText(/#102/)).not.toBeInTheDocument();

    // Resetear filtro con "Todos"
    const chipsTodos = screen.getAllByRole('button', { name: /Total|Todos/i });
    fireEvent.click(chipsTodos[0]);
    expect(screen.getByText(/#102/)).toBeInTheDocument();

    // Ordenar por precio — el select tiene opciones como "📅 Más recientes"
    const sortSelect = screen.getByDisplayValue(/Más recientes/i);
    fireEvent.change(sortSelect, { target: { value: 'menor_precio' } });
    expect(sortSelect.value).toBe('menor_precio');
  });

  it('abre y cierra el modal de detalles de una orden', async () => {
    render(<SeccionMisCompras userId={1} />);
    await screen.findByText(/#101/);

    const detalleBtns = screen.getAllByRole('button', { name: /Ver Detalles/i });
    fireEvent.click(detalleBtns[0]);

    // handleAbrirDetalle usa id_orden_db || id_orden
    // El orden es "más recientes primero", así que la primera fila puede ser #102 o #101
    await waitFor(() => {
      expect(api.getOrden).toHaveBeenCalled();
    });

    // Cerrar modal — el botón ✕ tiene aria-label
    const closeBtn = screen.getByRole('button', { name: /Cerrar detalles de la orden/i });
    fireEvent.click(closeBtn);
  });

  it('notifica llegada a tienda desde el modal de detalles', async () => {
    // La orden 2 es retiro_tienda con estado_retiro "reservado" → muestra botón "Notificar llegada"
    // Primero necesitamos que getOrden devuelva la orden 2 cuando se abre el detalle
    api.getOrden.mockResolvedValue({ data: mockOrders[1] });

    render(<SeccionMisCompras userId={1} />);
    await screen.findByText(/#102/);

    // Abrir modal de detalles para la orden 2 (retiro en tienda)
    const detalleBtns = screen.getAllByRole('button', { name: /Ver Detalles/i });
    // Buscar el botón de la fila de la orden #102
    // La orden #102 está en la tabla; click su "Ver Detalles"
    fireEvent.click(detalleBtns[1]);

    // Esperar a que cargue el modal con los datos de retiro_tienda
    const llegadaBtn = await screen.findByRole('button', { name: /Notificar llegada/i });
    fireEvent.click(llegadaBtn);

    await waitFor(() => {
      expect(api.notificarLlegadaTienda).toHaveBeenCalledWith(102);
      expect(notifySpy).toHaveBeenCalledWith(
        '¡Se notificó tu llegada al vendedor con éxito!',
        'success'
      );
    });

    // Probar manejo de error
    api.notificarLlegadaTienda.mockRejectedValueOnce({
      response: { data: { detail: 'Error al notificar llegada' } },
    });
    // Re-abrir modal (el click anterior lo recargó)
    api.getOrden.mockResolvedValue({ data: mockOrders[1] });
    const llegadaBtn2 = await screen.findByRole('button', { name: /Notificar llegada/i });
    fireEvent.click(llegadaBtn2);
    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalledWith('Error al notificar llegada', 'error');
    });
  });

  it('limpia órdenes pendientes exitosamente', async () => {
    render(<SeccionMisCompras userId={1} />);
    await screen.findByText(/#102/);

    // El botón dice "🗑️ Limpiar N pendiente(s)" — buscar con regex parcial
    const limpiarBtn = screen.getByRole('button', { name: /Limpiar.*pendiente/i });
    fireEvent.click(limpiarBtn);

    await waitFor(() => {
      expect(api.cancelarMisPendientes).toHaveBeenCalled();
      // Mensaje: "1 orden pendiente cancelada."
      expect(notifySpy).toHaveBeenCalledWith(
        expect.stringMatching(/pendiente.*cancelada/i),
        'success'
      );
    });
  });

  it('permite ver baucher y enviar comprobante por correo', async () => {
    // handleVerBaucher llama getOrden con orden.id_orden (1), no id_orden_db
    api.getOrden.mockResolvedValue({
      data: {
        ...mockOrders[0],
        total_con_descuento: 80000,
      },
    });

    render(<SeccionMisCompras userId={1} />);
    await screen.findByText(/#101/);

    // Solo las órdenes con estado "Pagado" muestran "Ver Baucher"
    const baucherBtns = screen.getAllByRole('button', { name: /Ver Baucher/i });
    fireEvent.click(baucherBtns[0]);

    // El título del baucher es "¡Compra Exitosa!"
    expect(await screen.findByText(/Compra Exitosa/i)).toBeInTheDocument();

    // Botón "Enviar por correo"
    const emailBtn = screen.getByRole('button', { name: /Enviar por correo/i });
    fireEvent.click(emailBtn);

    await waitFor(() => {
      // sendConfirmationEmail se llama con ordenSeleccionada.id_orden
      expect(api.sendConfirmationEmail).toHaveBeenCalledWith(1);
      expect(notifySpy).toHaveBeenCalledWith('Comprobante de compra enviado al correo', 'success');
    });

    // Cerrar baucher — hay un botón con aria-label="Cerrar comprobante"
    const cerrarBaucherBtn = screen.getByRole('button', { name: /Cerrar comprobante/i });
    fireEvent.click(cerrarBaucherBtn);
  });

  it('navega al carrito para pagar orden pendiente desde la tabla y desde el modal', async () => {
    render(<SeccionMisCompras userId={1} />);
    await screen.findByText(/#102/);

    // 1. Pagar desde la tabla (orden #102 es pendiente)
    const pagarBtn = screen.getByRole('button', { name: /💳\s*Pagar/i });
    fireEvent.click(pagarBtn);
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/?seccion=Carrito&pagarOrden=102'),
      expect.objectContaining({ state: expect.objectContaining({ autoPayOrderId: 102 }) })
    );

    // 2. Pagar desde el modal con estado_retiro: 'habilitado_pago'
    api.getOrden.mockResolvedValueOnce({
      data: {
        ...mockOrders[1],
        estado_retiro: 'habilitado_pago',
        estado: 'pendiente',
        estado_orden: 'pendiente',
      },
    });
    const detalleBtns = screen.getAllByRole('button', { name: /Ver Detalles/i });
    fireEvent.click(detalleBtns[1]);

    const pagarModalBtn = await screen.findByRole('button', { name: /Pagar Ahora/i });
    fireEvent.click(pagarModalBtn);
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/?seccion=Carrito&pagarOrden=102'),
      expect.any(Object)
    );
  });

  it('abre baucher desde el modal de detalles de una orden pagada', async () => {
    api.getOrden.mockResolvedValue({
      data: {
        ...mockOrders[0],
        estado_orden: 'pagado',
        estado: 'pagado',
      },
    });

    render(<SeccionMisCompras userId={1} />);
    await screen.findByText(/#101/);

    const detalleBtns = screen.getAllByRole('button', { name: /Ver Detalles/i });
    fireEvent.click(detalleBtns[0]);

    const verBaucherModalBtn = await screen.findByRole('button', { name: /Ver Baucher/i });
    fireEvent.click(verBaucherModalBtn);

    expect(await screen.findByText(/Compra Exitosa/i)).toBeInTheDocument();
  });
});
