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
    platform: 'android',
    create: vi.fn((config) => {
      client.defaults = config;
      return client;
    }),
  };
});

vi.mock('axios', () => ({
  default: { create: mocks.create },
}));

vi.mock('react-native', () => ({
  Platform: { get OS() { return mocks.platform; } },
}));

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

const loadApi = () => import('../../services/api.js');

describe('servicio móvil de API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.platform = 'android';
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

    vi.unstubAllGlobals();
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

  it('envía fotos de perfil y banner como multipart con tiempo suficiente para subirlas', async () => {
    const api = await loadApi();
    const formData = new FormData();

    api.uploadProfilePhoto(formData);
    api.uploadBannerPhoto(formData);

    expect(mocks.client.post).toHaveBeenNthCalledWith(1, '/perfil/foto-perfil', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    expect(mocks.client.post).toHaveBeenNthCalledWith(2, '/perfil/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  });

  it('envía todas las operaciones exportadas a un método HTTP', async () => {
    const api = await loadApi();
    const payload = {
      token: 'token',
      id: 'id',
      id_libro: 'libro',
      id_lista: 'lista',
      id_orden: 'orden',
      id_tienda: 'tienda',
      idVendedor: 'vendedor',
      idCuenta: 'cuenta',
      idMetodo: 'metodo',
      estado: 'estado',
      respuesta: 'respuesta',
      mensaje: 'mensaje',
      bloqueado: true,
      oculto: false,
      motivo: 'motivo',
    };
    const operations = Object.entries(api).filter(([name, value]) =>
      typeof value === 'function' && !['getApiBaseUrl', 'resolveImageUrl'].includes(name)
    );

    for (const [name, operation] of operations) {
      if (name === 'subirArchivoVariante') {
        await operation('libro', 'variante', {
          uri: 'file:///libro.pdf',
          name: 'libro.pdf',
          mimeType: 'application/pdf',
        });
      } else {
        await operation(payload);
      }
    }

    const requests = ['get', 'post', 'put', 'patch', 'delete']
      .flatMap((method) => mocks.client[method].mock.calls.map(([url]) => ({ method, url })));
    expect(requests).toHaveLength(operations.length);
    expect(requests.every(({ url }) => typeof url === 'string' && url.length > 0)).toBe(true);
    expect(requests.some(({ method, url }) => method === 'get' && url === '/usuarios')).toBe(true);
    expect(requests.some(({ method, url }) => method === 'patch' && url === '/perfil/banner-color')).toBe(true);
    expect(api.getApiBaseUrl()).toBe('https://api.example.test');
  });

  it('normaliza URL de imágenes remotas, locales y relativas', async () => {
    const api = await loadApi();

    expect(api.resolveImageUrl(null)).toBeNull();
    expect(api.resolveImageUrl(' , /fallback.jpg')).toBeNull();
    expect(api.resolveImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64');
    expect(api.resolveImageUrl('blob:https://app.example.test/image')).toBe('blob:https://app.example.test/image');
    expect(api.resolveImageUrl('https://cdn.example.test/book.jpg,/fallback.jpg'))
      .toBe('https://cdn.example.test/book.jpg');
    expect(api.resolveImageUrl('http://localhost:3000/book.jpg'))
      .toBe('https://api.example.test/book.jpg');
    expect(api.resolveImageUrl('http://127.0.0.1:8000/book.jpg'))
      .toBe('https://api.example.test/book.jpg');
    expect(api.resolveImageUrl('http://127.12.34.56/book.jpg'))
      .toBe('https://api.example.test/book.jpg');
    expect(api.resolveImageUrl('http://128.0.0.1/book.jpg'))
      .toBe('http://128.0.0.1/book.jpg');
    expect(api.resolveImageUrl('http://[::1]:8000/book.jpg'))
      .toBe('https://api.example.test/book.jpg');
    expect(api.resolveImageUrl('/uploads/book.jpg'))
      .toBe('https://api.example.test/uploads/book.jpg');
    expect(api.resolveImageUrl('uploads/book.jpg'))
      .toBe('https://api.example.test/uploads/book.jpg');
  });

  it('sube variantes digitales desde web y rechaza respuestas de archivo fallidas', async () => {
    vi.resetModules();
    mocks.platform = 'web';
    const api = await loadApi();
    const file = new Blob(['contenido'], { type: 'application/pdf' });

    await api.subirArchivoVariante('libro', 'variante', {
      uri: 'https://files.example.test/libro.pdf',
      name: 'libro.pdf',
      file,
    });
    expect(mocks.client.post).toHaveBeenCalledWith(
      '/libros/libro/variantes/variante/archivo',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(api.subirArchivoVariante('libro', 'variante', {
      uri: 'https://files.example.test/fallido.pdf',
      name: 'fallido.pdf',
    })).rejects.toThrow('No se pudo leer el archivo digital seleccionado.');
  });
});

function apiClientConfig() {
  return mocks.client.defaults;
}
