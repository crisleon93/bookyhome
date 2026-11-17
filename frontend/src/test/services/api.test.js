import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const client = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };
  return { client, create: vi.fn(() => client) };
});

vi.mock('axios', () => ({ default: { create: mocks.create } }));

describe('servicio web de API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('crea el cliente con la URL configurada y el tipo de contenido JSON', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    const api = await import('../../services/api');

    expect(api.getApiBaseUrl()).toBe('https://api.example.test');
    expect(mocks.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.test',
      headers: { 'Content-Type': 'application/json' },
    });

    vi.unstubAllEnvs();
  });

  it('usa localhost cuando no se configura la URL de API', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    const api = await import('../../services/api');

    expect(api.getApiBaseUrl()).toBe('http://localhost:8000');
    vi.unstubAllEnvs();
  });

  it('añade el token de sesión al encabezado de la petición', async () => {
    await import('../../services/api');
    const requestHandler = mocks.client.interceptors.request.use.mock.calls[0][0];
    const config = { headers: {} };

    expect(requestHandler(config)).toBe(config);
    expect(config.headers.Authorization).toBeUndefined();

    localStorage.setItem('token', 'session-token');
    expect(requestHandler(config)).toBe(config);
    expect(config.headers.Authorization).toBe('Bearer session-token');
  });

  it('envía correctamente autenticación, registro, restablecimiento y librería', async () => {
    const api = await import('../../services/api');
    const payload = { email: 'reader@example.test' };
    api.login(payload);
    api.register(payload);
    api.forgotPassword(payload);
    api.resetPassword(payload);
    api.registerLibrary(payload);

    expect(mocks.client.post.mock.calls).toEqual([
      ['/login', payload],
      ['/register', payload],
      ['/forgot-password', payload],
      ['/reset-password', payload],
      ['/libreria', payload],
    ]);
  });

  it('cubre las operaciones del carrito y valores predeterminados de checkout', async () => {
    const api = await import('../../services/api');
    const payload = { id_libro: 5 };
    api.getCarrito();
    api.addToCart(payload);
    api.removeFromCart(5);
    api.checkoutCarrito();
    api.checkoutCarrito(payload);
    api.checkoutDirecto();
    api.checkoutDirecto(payload);
    api.sincronizarOrdenes();

    expect(mocks.client.get).toHaveBeenCalledWith('/carrito');
    expect(mocks.client.delete).toHaveBeenCalledWith('/carrito/5');
    expect(mocks.client.post.mock.calls).toEqual([
      ['/carrito', payload],
      ['/carrito/checkout', {}],
      ['/carrito/checkout', payload],
      ['/carrito/checkout-directo', {}],
      ['/carrito/checkout-directo', payload],
      ['/carrito/sincronizar-ordenes'],
    ]);
  });

  it('envía peticiones de pagos, órdenes y retiros con sus parámetros', async () => {
    const api = await import('../../services/api');
    const payload = { amount: 25 };
    api.postPayment(payload);
    api.getOrden(7);
    api.getDatosTransferenciaVendedor(7);
    api.getOrdenes();
    api.confirmarEntrega(7);
    api.cancelOrder(7, 'duplicada');
    api.cancelarMisPendientes();
    api.actualizarCostoEnvio(7, 'domicilio');
    api.reservarRetiroEnTienda(7, 'transferencia');
    api.notificarLlegadaTienda(7);
    api.habilitarPagoRetiro(7);
    api.confirmarEntregaRetiro(7);
    api.confirmarEntregaRetiro(8, true);

    expect(mocks.client.post.mock.calls).toEqual(expect.arrayContaining([
      ['/api/v1/payments', payload],
      ['/perfil/ordenes/7/confirmar-entrega'],
      ['/api/v1/orders/cancelar-mis-pendientes'],
      ['/api/v1/orders/7/actualizar-envio', { tipo_entrega: 'domicilio' }],
      ['/api/v1/orders/7/reservar-retiro', { metodo_pago: 'transferencia' }],
      ['/api/v1/orders/7/llegada-tienda'],
      ['/api/v1/orders/7/habilitar-pago-retiro'],
      ['/api/v1/orders/7/confirmar-entrega-retiro', { es_efectivo: false }],
      ['/api/v1/orders/8/confirmar-entrega-retiro', { es_efectivo: true }],
    ]));
    expect(mocks.client.get).toHaveBeenCalledWith('/api/v1/orders/7');
    expect(mocks.client.get).toHaveBeenCalledWith('/api/v1/orders/7/vendedor-transferencia');
    expect(mocks.client.get).toHaveBeenCalledWith('/api/v1/orders');
    expect(mocks.client.delete).toHaveBeenCalledWith('/api/v1/orders/7', { data: { motivo: 'duplicada' } });
  });

  it('cubre libros, usuarios, fotos, banners y verificación de correo', async () => {
    const api = await import('../../services/api');
    const params = { q: 'ficción' };
    const formData = new FormData();
    api.getStoredLibros();
    api.getStoredLibros(params);
    api.getLibroById(3);
    api.getUsuarios();
    api.uploadProfilePhoto(formData);
    api.uploadBannerPhoto(formData);
    api.saveBannerColor('#123456');
    api.sendConfirmationEmail(9);
    api.actualizarEstadoTienda(4, 'activa');
    api.checkEmailVerification('reader@example.test');

    expect(mocks.client.get).toHaveBeenCalledWith('/api/stored/libros', { params: {} });
    expect(mocks.client.get).toHaveBeenCalledWith('/api/stored/libros', { params });
    expect(mocks.client.get).toHaveBeenCalledWith('/api/stored/libros/3');
    expect(mocks.client.get).toHaveBeenCalledWith('/usuarios');
    expect(mocks.client.get).toHaveBeenCalledWith('/check-email-verification', {
      params: { email: 'reader@example.test' },
    });
    expect(mocks.client.post).toHaveBeenCalledWith('/perfil/foto-perfil', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(mocks.client.post).toHaveBeenCalledWith('/perfil/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(mocks.client.patch).toHaveBeenCalledWith('/perfil/banner-color', { banner_color: '#123456' });
    expect(mocks.client.patch).toHaveBeenCalledWith('/tiendas/4/estado', { estado: 'activa' });
    expect(mocks.client.post).toHaveBeenCalledWith('/api/v1/orders/9/send-confirmation');
  });

  it('cubre favoritos, listas de deseos, devoluciones, quejas y soporte', async () => {
    const api = await import('../../services/api');
    const payload = { nombre: 'Favoritos' };
    const formData = new FormData();
    api.getFavoritos();
    api.agregarFavorito(2);
    api.eliminarFavorito(2);
    api.getListasDeseos();
    api.crearListaDeseos(payload);
    api.eliminarListaDeseos(3);
    api.getLibrosListaDeseos(3);
    api.agregarLibroListaDeseos(3, payload);
    api.eliminarLibroListaDeseos(3, 2);
    api.getDevoluciones();
    api.getPedidosElegiblesDevolucion();
    api.solicitarDevolucion(payload);
    api.getQuejas();
    api.crearQueja(formData);
    api.cancelarQueja(8);
    api.getQuejasAdmin();
    api.resolverQueja(8, payload);
    api.getQuejasVendedor();
    api.getMensajesReclamo(8);
    api.enviarMensajeReclamo(8, 'Hola');
    api.getSoporte();
    api.crearSoporte(payload);

    expect(mocks.client.get.mock.calls).toEqual(expect.arrayContaining([
      ['/favoritos'], ['/lista-deseos'], ['/lista-deseos/3/libros'],
      ['/devoluciones'], ['/devoluciones/elegibles'], ['/quejas'],
      ['/quejas/admin/todas'], ['/quejas/vendedor'], ['/quejas/8/mensajes'],
      ['/quejas/soporte'],
    ]));
    expect(mocks.client.post.mock.calls).toEqual(expect.arrayContaining([
      ['/favoritos/2'], ['/lista-deseos', payload], ['/lista-deseos/3/libros', payload],
      ['/devoluciones', payload], ['/quejas', formData, { headers: { 'Content-Type': 'multipart/form-data' } }],
      ['/quejas/8/mensajes', { mensaje: 'Hola' }], ['/quejas/soporte', payload],
    ]));
    expect(mocks.client.patch).toHaveBeenCalledWith('/quejas/admin/8', payload);
    expect(mocks.client.delete).toHaveBeenCalledWith('/favoritos/2');
    expect(mocks.client.delete).toHaveBeenCalledWith('/lista-deseos/3');
    expect(mocks.client.delete).toHaveBeenCalledWith('/lista-deseos/3/libros/2');
    expect(mocks.client.delete).toHaveBeenCalledWith('/quejas/8');
  });

  it('cubre cupones, direcciones, perfil, envíos, suscripciones y calificaciones', async () => {
    const api = await import('../../services/api');
    const payload = { value: 'sample' };
    api.getCuponesDisponibles();
    api.validarCupon(payload);
    api.aplicarCupon(payload);
    api.getCuponesTienda(6);
    api.crearCupon(payload);
    api.editarCupon(7, payload);
    api.eliminarCupon(7);
    api.getDirecciones();
    api.crearDireccion(payload);
    api.actualizarDireccion(5, payload);
    api.eliminarDireccion(5);
    api.marcarDireccionPredeterminada(5);
    api.getEstadisticasUsuario();
    api.debugEstadisticas();
    api.getEmpresasMensajeria();
    api.registrarEnvio(9, payload);
    api.getMiSuscripcion();
    api.getSuscripcionVigente();
    api.getHistorialSuscripciones();
    api.crearSuscripcion(payload);
    api.cancelarSuscripcion(6);
    api.getCalificacionesTienda(4);
    api.crearCalificacionTienda(payload);
    api.actualizarCalificacionTienda(2, payload);
    api.eliminarCalificacionTienda(2);
    api.usuarioPuedeCalificarTienda(4);

    expect(mocks.client.get.mock.calls).toEqual(expect.arrayContaining([
      ['/cupones/disponibles'], ['/cupones/tienda/6'], ['/perfil/direcciones'],
      ['/perfil/estadisticas/usuario'], ['/perfil/estadisticas/debug'], ['/envios/empresas'],
      ['/suscripciones/mi-suscripcion'], ['/suscripciones/vigente'], ['/suscripciones/historial'],
      ['/perfil/calificaciones/tienda/4'], ['/perfil/calificaciones/tienda/4/usuario-puede-calificar'],
    ]));
    expect(mocks.client.post.mock.calls).toEqual(expect.arrayContaining([
      ['/cupones/validar', payload], ['/cupones/aplicar', payload], ['/cupones', payload],
      ['/direcciones', payload], ['/suscripciones', payload], ['/perfil/calificaciones/tienda', payload],
    ]));
    expect(mocks.client.patch.mock.calls).toEqual(expect.arrayContaining([
      ['/cupones/7', payload], ['/direcciones/5/default'],
    ]));
    expect(mocks.client.put.mock.calls).toEqual([
      ['/direcciones/5', payload],
      ['/envios/orden/9', payload],
      ['/perfil/calificaciones/tienda/2', payload],
    ]);
    expect(mocks.client.delete.mock.calls).toEqual(expect.arrayContaining([
      ['/cupones/7'], ['/direcciones/5'], ['/suscripciones/6'],
      ['/perfil/calificaciones/tienda/2'],
    ]));
  });
});
