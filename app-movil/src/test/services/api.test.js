import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const client = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: {},
  };

  return {
    client,
    create: vi.fn((config) => {
      client.defaults = config;
      return client;
    }),
  };
});

vi.mock('axios', () => ({
  default: { create: mocks.create },
}));

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

const loadApi = () => import('../../services/api.js');

describe('servicio móvil de API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    vi.restoreAllMocks();
  });

  it('configura Axios con la URL requerida y un timeout de 15 segundos', async () => {
    const api = await loadApi();

    expect(api.getApiBaseUrl()).toBe('https://api.example.test');
    expect(mocks.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.test',
      timeout: 15000,
    });
  });

  it('rechaza la configuración cuando falta la URL de API', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    await expect(loadApi()).rejects.toThrow('Configura EXPO_PUBLIC_API_URL');
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rechaza HTTP en producción', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api.example.test';
    process.env.NODE_ENV = 'production';

    await expect(loadApi()).rejects.toThrow('debe usar HTTPS en producción');
  });

  it('permite HTTP en desarrollo local', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    process.env.NODE_ENV = 'development';

    await expect(loadApi()).resolves.toBeDefined();
    expect(apiClientConfig()).toMatchObject({
      baseURL: 'http://localhost:8000',
    });
  });

  it('registra y ejecuta los interceptores de request y response', async () => {
    await loadApi();
    const requestHandler = mocks.client.interceptors.request.use.mock.calls[0][0];
    const requestErrorHandler = mocks.client.interceptors.request.use.mock.calls[0][1];
    const responseHandler = mocks.client.interceptors.response.use.mock.calls[0][0];
    const responseErrorHandler = mocks.client.interceptors.response.use.mock.calls[0][1];
    const request = { method: 'get', baseURL: 'https://api.example.test', url: '/libros' };
    const response = { status: 200 };
    const error = Object.assign(new Error('falló'), {
      config: { url: '/libros' },
      response: { status: 500 },
    });
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(requestHandler(request)).toBe(request);
    await expect(requestErrorHandler(error)).rejects.toBe(error);
    expect(responseHandler(response)).toBe(response);
    await expect(responseErrorHandler(error)).rejects.toBe(error);
    expect(log).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('envía credenciales y parámetros de verificación a sus endpoints', async () => {
    const api = await loadApi();
    const credentials = { email: 'user@example.test', password: 'secret' };

    api.login(credentials);
    api.verifyEmail({ token: 'verify-token' });

    expect(mocks.client.post).toHaveBeenCalledWith('/login', credentials);
    expect(mocks.client.get).toHaveBeenCalledWith('/verify-email', {
      params: { token: 'verify-token' },
    });
  });

  it('aplica valores predeterminados al historial de chat y conserva los parámetros dados', async () => {
    const api = await loadApi();

    api.getChatHistory(12);
    api.getChatHistory(13, { limit: 10, offset: 20 });

    expect(mocks.client.get).toHaveBeenNthCalledWith(1, '/chat/salas/12/mensajes', {
      params: { limit: 50, offset: 0 },
    });
    expect(mocks.client.get).toHaveBeenNthCalledWith(2, '/chat/salas/13/mensajes', {
      params: { limit: 10, offset: 20 },
    });
  });

  it('incluye el motivo de cancelación solo cuando fue proporcionado', async () => {
    const api = await loadApi();

    api.cancelOrder(41, 'duplicada');
    api.cancelOrder(42);

    expect(mocks.client.delete).toHaveBeenNthCalledWith(1, '/api/v1/orders/41', {
      data: { motivo: 'duplicada' },
    });
    expect(mocks.client.delete).toHaveBeenNthCalledWith(2, '/api/v1/orders/42', {
      data: undefined,
    });
  });

  it('envía el motivo de cambio de estado de tienda solo si no está vacío', async () => {
    const api = await loadApi();

    api.cambiarEstadoTienda(4, 'suspendida', 'documentación pendiente');
    api.cambiarEstadoTienda(5, 'activa', '');

    expect(mocks.client.patch).toHaveBeenNthCalledWith(1, '/tiendas/4/estado', {
      estado: 'suspendida',
      motivo: 'documentación pendiente',
    });
    expect(mocks.client.patch).toHaveBeenNthCalledWith(2, '/tiendas/5/estado', {
      estado: 'activa',
    });
  });

  it('serializa el stock como formulario multipart', async () => {
    const api = await loadApi();

    api.updateStockLibro(17, 8);

    const [url, formData, config] = mocks.client.patch.mock.calls[0];
    expect(url).toBe('/libros/17/stock');
    expect(formData.get('stock')).toBe('8');
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
  });
});

function apiClientConfig() {
  return mocks.client.defaults;
}
