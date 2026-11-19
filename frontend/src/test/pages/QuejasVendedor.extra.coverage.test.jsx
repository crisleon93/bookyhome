import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import QuejasVendedor from '../../pages/QuejasVendedor';

const mocks = vi.hoisted(() => ({
  getApiBaseUrl: vi.fn(),
  getQuejasVendedor: vi.fn(),
  getMensajesReclamo: vi.fn(),
  enviarMensajeReclamo: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  getApiBaseUrl: mocks.getApiBaseUrl,
  getQuejasVendedor: mocks.getQuejasVendedor,
  getMensajesReclamo: mocks.getMensajesReclamo,
  enviarMensajeReclamo: mocks.enviarMensajeReclamo,
}));

vi.mock('../../components/Icons', () => {
  const Icon = () => <span data-testid="icon" />;
  return {
    IconAlertTriangle: Icon,
    IconBook: Icon,
    IconCheck: Icon,
    IconEye: Icon,
    IconInfo: Icon,
    IconMessage: Icon,
    IconPackage: Icon,
    IconSearch: Icon,
    IconRefresh: Icon,
    IconStore: Icon,
    IconStoreAlt: Icon,
    IconTruck: Icon,
  };
});

const sampleComplaints = [
  {
    id_solicitud: 1,
    id_orden: 101,
    comprador: 'Elena Gómez',
    estado: 'Abierto',
    asunto: 'Libro dañado o defectuoso',
    descripcion: 'Llegó con las hojas rotas',
    fecha_creacion: '2026-03-01T10:00:00',
    total_orden: 45000,
    titulo_libro: 'Cien Años de Soledad',
    evidencia_url: null,
  },
  {
    id_solicitud: 2,
    id_orden: 102,
    comprador: 'Mario Vargas',
    estado: 'En revisión',
    asunto: 'Pedido no recibido',
    descripcion: 'No me ha llegado el pedido',
    fecha_creacion: '2026-03-02T11:00:00',
    total_orden: 80000,
    titulo_libro: 'La Ciudad y los Perros',
    evidencia_url: '/media/ev2.png',
  },
  {
    id_solicitud: 3,
    id_orden: 103,
    comprador: 'Sara Pérez',
    estado: 'Rechazado',
    asunto: 'Error en el cobro',
    descripcion: 'Cobro duplicado',
    fecha_creacion: '2026-03-03T12:00:00',
    total_orden: 25000,
    titulo_libro: 'Rayuela',
    evidencia_url: null,
  },
];

describe('QuejasVendedor — Cobertura completa de interfaz y filtros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    HTMLElement.prototype.scrollIntoView = vi.fn();
    mocks.getApiBaseUrl.mockReturnValue('https://api.test');
    mocks.getQuejasVendedor.mockResolvedValue({ data: sampleComplaints });
    mocks.getMensajesReclamo.mockResolvedValue({
      data: [
        { id_mensaje: 1, rol: 'vendedor', nombre_usuario: 'Librería Central', mensaje: 'Hola, estamos revisando tu caso.', fecha_creacion: '2026-03-01T10:10:00' },
        { id_mensaje: 2, rol: 'admin', nombre_usuario: 'Soporte BookyHome', mensaje: 'Intervención de soporte administrativo.', fecha_creacion: '2026-03-01T10:20:00' },
        { id_mensaje: 3, rol: 'comprador', nombre_usuario: 'Elena Gómez', mensaje: 'Muchas gracias, quedo atenta.', fecha_creacion: '2026-03-01T10:30:00' },
      ],
    });
    mocks.enviarMensajeReclamo.mockResolvedValue({ data: {} });
  });

  afterEach(cleanup);

  it('filtra por los diferentes estados: abierto, en revisión, resueltos y todos', async () => {
    render(<QuejasVendedor />);
    expect(await screen.findByText('Total Reclamos')).toBeInTheDocument();
    expect(screen.getByText('3 recibidas')).toBeInTheDocument();

    // Filtro Abierto
    fireEvent.click(screen.getByRole('button', { name: /Abiertos/i }));
    expect(screen.getByText('1 recibidas')).toBeInTheDocument();

    // Filtro En revisión
    fireEvent.click(screen.getByRole('button', { name: /En Revisión/i }));
    expect(screen.getByText('1 recibidas')).toBeInTheDocument();

    // Filtro Resueltos
    fireEvent.click(screen.getByRole('button', { name: /Resueltos/i }));
    expect(screen.getByText('0 recibidas')).toBeInTheDocument();

    // Volver a Todos
    fireEvent.click(screen.getByRole('button', { name: /Todos/i }));
    expect(screen.getByText('3 recibidas')).toBeInTheDocument();
  });

  it('permite contraer y expandir el panel lateral de solicitudes', async () => {
    render(<QuejasVendedor />);
    expect(await screen.findByText('Total Reclamos')).toBeInTheDocument();

    // Buscar botón de toggle lateral
    const toggleBtn = screen.getAllByTitle(/Contraer lista/i)[0];
    fireEvent.click(toggleBtn);

    // Debe mostrar botón para expandir
    const expandBtn = screen.getAllByTitle(/Expandir lista/i)[0];
    expect(expandBtn).toBeInTheDocument();

    // Expandir de nuevo
    fireEvent.click(expandBtn);
    expect(screen.getByText('Solicitudes')).toBeInTheDocument();
  });

  it('selecciona queja mediante teclado Enter y Espacio', async () => {
    render(<QuejasVendedor />);
    expect(await screen.findByText('Total Reclamos')).toBeInTheDocument();

    const itemMario = screen.getAllByText(/Pedido no recibido/i)[0].closest('[role="button"]');
    if (itemMario) {
      fireEvent.keyDown(itemMario, { key: 'Enter' });
      expect(await screen.findByText(/No me ha llegado el pedido/i)).toBeInTheDocument();
    }

    const itemElena = screen.getAllByText(/Libro dañado/i)[0].closest('[role="button"]');
    if (itemElena) {
      fireEvent.keyDown(itemElena, { key: ' ' });
      expect(await screen.findByText(/Llegó con las hojas rotas/i)).toBeInTheDocument();
    }
  });

  it('utiliza plantillas rápidas de respuesta para llenar el mensaje', async () => {
    render(<QuejasVendedor />);
    expect(await screen.findByText('Total Reclamos')).toBeInTheDocument();

    // Clic en una de las plantillas rápidas
    const plantillaBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('...'));
    if (plantillaBtns.length > 0) {
      fireEvent.click(plantillaBtns[0]);
      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje o solución/i);
      expect(textarea.value.length).toBeGreaterThan(0);
    }
  });

  it('muestra estado sin respuestas cuando el reclamo no tiene mensajes', async () => {
    mocks.getMensajesReclamo.mockResolvedValueOnce({ data: [] });
    render(<QuejasVendedor />);
    expect(await screen.findByText('Total Reclamos')).toBeInTheDocument();

    expect(await screen.findByText(/Aún no hay respuestas en este reclamo/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando falla la carga de quejas', async () => {
    mocks.getQuejasVendedor.mockRejectedValueOnce(new Error('Fallo de servidor'));
    render(<QuejasVendedor />);

    expect(await screen.findByText(/No se pudieron cargar los reclamos/i)).toBeInTheDocument();
  });

  it('muestra mensaje cuando la búsqueda no coincide con ningún reclamo', async () => {
    render(<QuejasVendedor />);
    expect(await screen.findByText('Total Reclamos')).toBeInTheDocument();

    const inputBusqueda = screen.getByPlaceholderText(/Buscar por comprador/i);
    fireEvent.change(inputBusqueda, { target: { value: 'CompradorInexistenteXYZ' } });

    expect(screen.getByText('Sin reclamos')).toBeInTheDocument();
  });
});
