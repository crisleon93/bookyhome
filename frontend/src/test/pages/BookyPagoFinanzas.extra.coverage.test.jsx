import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../../services/api';
import BookyPagoFinanzas from '../../pages/BookyPagoFinanzas';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../components/ToastProvider', () => ({
  notify: vi.fn(),
}));

vi.mock('../../components/Icons', () => {
  const Icon = () => <span data-testid="icon" />;
  return {
    IconWallet: Icon,
    IconTrendingUp: Icon,
    IconRefresh: Icon,
    IconPackage: Icon,
    IconStore: Icon,
    IconBolt: Icon,
    IconChartBar: Icon,
  };
});

describe('BookyPagoFinanzas — Cobertura ampliada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('maneja errores en cargarTodo limpiamente cuando el backend falla', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockRejectedValue(new Error('Fallo de conexión'));

    render(
      <MemoryRouter>
        <BookyPagoFinanzas />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    errorSpy.mockRestore();
  });

  it('muestra la pestaña de Comisiones con métricas completas', async () => {
    api.get.mockImplementation((url) =>
      Promise.resolve({
        data: url.includes('/balance')
          ? {
              balance: {
                balance: 5000000,
                ingresos_totales: 3500000,
                pagos_totales: 1500000,
                ingresos_por_tipo: { venta: 2000000, plan: 1000000, impulso: 500000 },
              },
            }
          : url.includes('/estadisticas')
          ? {
              estadisticas: {
                ingresos_30_dias: 3500000,
                promedio_diario: 116666,
                ventas_totales: 28,
              },
            }
          : {
              historial: {
                ingresos: [],
                pagos: [],
              },
            },
      })
    );

    render(
      <MemoryRouter>
        <BookyPagoFinanzas defaultTab="comisiones" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Comisiones de BookyHome')).toBeInTheDocument();
    expect(screen.getByText('Total comisiones acumuladas')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument(); // Ventas procesadas
    expect(screen.getByText('Comisiones por Ventas')).toBeInTheDocument();
    expect(screen.getByText('Cobros por Planes')).toBeInTheDocument();
    expect(screen.getByText('Cobros por Impulsos')).toBeInTheDocument();
  });

  it('muestra estados vacíos en Historial cuando no hay registros', async () => {
    api.get.mockResolvedValue({
      data: {
        balance: { balance: 0, ingresos_totales: 0, ingresos_por_tipo: {} },
        estadisticas: {},
        historial: { ingresos: [], pagos: [] },
      },
    });

    render(
      <MemoryRouter>
        <BookyPagoFinanzas defaultTab="historial" />
      </MemoryRouter>
    );

    expect(await screen.findByText('No hay ingresos en los últimos 30 días')).toBeInTheDocument();
    expect(screen.getByText('Sin pagos operativos registrados')).toBeInTheDocument();
  });

  it('renderiza pagos e ingresos en la tabla de Historial', async () => {
    const hoy = new Date().toISOString();
    api.get.mockImplementation((url) =>
      Promise.resolve({
        data: url.includes('/balance')
          ? { balance: { balance: 100000, ingresos_totales: 100000 } }
          : url.includes('/estadisticas')
          ? { estadisticas: {} }
          : {
              historial: {
                ingresos: [
                  {
                    id: 1,
                    fecha: hoy,
                    tipo: 'plan',
                    monto: 30000,
                    estado: 'completado',
                  },
                  {
                    id: 2,
                    fecha: hoy,
                    tipo: 'venta',
                    comision: 15000,
                    monto_venta: 100000,
                    estado: 'procesado',
                  },
                ],
                pagos: [
                  {
                    id: 10,
                    fecha: hoy,
                    tipo: 'transferencia',
                    monto: 50000,
                    estado: 'aprobado',
                  },
                ],
              },
            },
      })
    );

    render(
      <MemoryRouter>
        <BookyPagoFinanzas defaultTab="historial" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Historial Financiero · Últimos 30 días')).toBeInTheDocument();
    expect(screen.getAllByText('Pagos operativos').length).toBeGreaterThan(0);
    expect(screen.getByText('Transferencia')).toBeInTheDocument();
  });

  it('interactúa con Estadísticas con valores millonarios y puntos SVG', async () => {
    const hoy = new Date().toISOString();
    api.get.mockImplementation((url) =>
      Promise.resolve({
        data: url.includes('/balance')
          ? {
              balance: {
                balance: 15000000,
                ingresos_totales: 12500000,
                ingresos_por_tipo: { venta: 8000000, plan: 3000000, impulso: 1500000 },
              },
            }
          : url.includes('/estadisticas')
          ? {
              estadisticas: {
                ingresos_30_dias: 12500000,
                promedio_diario: 416666,
              },
            }
          : {
              historial: {
                ingresos: [
                  { id: 1, fecha: hoy, tipo: 'venta', comision: 2500000 },
                  { id: 2, fecha: hoy, tipo: 'plan', comision: 1200000 },
                ],
                pagos: [],
              },
            },
      })
    );

    render(
      <MemoryRouter>
        <BookyPagoFinanzas defaultTab="estadisticas" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Estadísticas Financieras')).toBeInTheDocument();

    // Cambiar filtros
    fireEvent.click(screen.getByRole('button', { name: /Planes/i }));
    fireEvent.click(screen.getByRole('button', { name: /Impulsos/i }));
    fireEvent.click(screen.getByRole('button', { name: /Todo/i }));

    // Simular hover en elementos del SVG
    const groups = document.querySelectorAll('svg g');
    if (groups.length > 0) {
      fireEvent.mouseEnter(groups[groups.length - 1]);
      fireEvent.mouseLeave(groups[groups.length - 1]);
    }
  });

  it('navega entre todas las pestañas principales', async () => {
    api.get.mockResolvedValue({
      data: {
        balance: {
          balance: 200000,
          ingresos_totales: 200000,
          ingresos_por_tipo: { venta: 150000, plan: 30000, impulso: 20000 },
        },
        estadisticas: {},
        historial: { ingresos: [], pagos: [] },
      },
    });

    render(
      <MemoryRouter>
        <BookyPagoFinanzas />
      </MemoryRouter>
    );

    expect(await screen.findByText('Desglose de Ingresos')).toBeInTheDocument();

    // Ir a Estadísticas
    fireEvent.click(screen.getByRole('button', { name: /Estadísticas/i }));
    expect(await screen.findByText('Estadísticas Financieras')).toBeInTheDocument();

    // Ir a Historial
    fireEvent.click(screen.getByRole('button', { name: /Historial/i }));
    expect(await screen.findByText('Historial Financiero · Últimos 30 días')).toBeInTheDocument();

    // Ir a Comisiones
    fireEvent.click(screen.getByRole('button', { name: /Comisiones/i }));
    expect(await screen.findByText('Comisiones de BookyHome')).toBeInTheDocument();

    // Volver a Balance
    fireEvent.click(screen.getByRole('button', { name: /Balance/i }));
    expect(await screen.findByText('Desglose de Ingresos')).toBeInTheDocument();
  });
});
