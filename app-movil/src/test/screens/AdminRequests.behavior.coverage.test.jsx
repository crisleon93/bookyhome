// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminRequests from '../../screens/AdminRequests'
import {
  enviarMensajeSolicitudAdmin,
  getMensajesSolicitudAdmin,
  resolverSolicitudAdmin,
} from '../../services/api'
import { Alert } from 'react-native'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  enviarMensaje: vi.fn(),
  getMensajes: vi.fn(),
  resolverSolicitud: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    value,
    placeholder,
    accessibilityLabel,
    accessibilityRole,
    disabled,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        role: accessibilityRole || 'button',
      }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        disabled,
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  const renderPart = (part) => ReactModule.isValidElement(part)
    ? part
    : typeof part === 'function' ? ReactModule.createElement(part) : part
  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Cargando'),
    Alert: { alert: mocks.alert },
    FlatList: ({ data = [], renderItem, ListHeaderComponent, ListFooterComponent, ListEmptyComponent }) => (
      ReactModule.createElement('div', null,
        renderPart(ListHeaderComponent),
        data.length
          ? data.map((item, index) => ReactModule.createElement(
            ReactModule.Fragment,
            { key: index },
            renderItem({ item, index }),
          ))
          : renderPart(ListEmptyComponent),
        renderPart(ListFooterComponent),
      )
    ),
    Image: element('img'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' }, children)
      : null,
    PanResponder: { create: () => ({ panHandlers: {} }) },
    RefreshControl: () => null,
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})
vi.mock('../../services/api', () => ({
  getApiBaseUrl: () => 'https://api.example.test',
  getMensajesSolicitudAdmin: mocks.getMensajes,
  enviarMensajeSolicitudAdmin: mocks.enviarMensaje,
  resolverSolicitudAdmin: mocks.resolverSolicitud,
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconCheck: Icon,
    IconChevronLeft: Icon,
    IconEye: Icon,
    IconEyeOff: Icon,
    IconMail: Icon,
    IconMessage: () => <span>Enviar</span>,
    IconStoreAlt: Icon,
    IconTool: Icon,
    IconUser: Icon,
  }
})

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getMensajes.mockResolvedValue({
    data: [{ id_mensaje: 4, nombre_usuario: 'Ana', mensaje: 'Ya lo reviso', fecha_creacion: '2026-03-20' }],
  })
  mocks.enviarMensaje.mockResolvedValue({})
  mocks.resolverSolicitud.mockResolvedValue({})
})

describe('AdminRequests', () => {
  const complaint = {
    id_solicitud: 31,
    tipo_solicitud: 'reclamo',
    estado: 'Abierto',
    comprador: 'Ana Compradora',
    nombre_tienda: 'Librería Sol',
    asunto: 'Libro dañado',
    descripcion: 'El libro llegó con páginas rotas.',
    respuesta: 'Estamos investigando.',
    id_orden: 18,
    total_orden: 24000,
    fecha_creacion: '2026-03-20',
    evidencia_url: '/evidencia.jpg',
  }

  it('filtra reclamos, abre el chat, envía un mensaje y actualiza la lista', async () => {
    const onRefresh = vi.fn()
    render(<AdminRequests type="reclamos" solicitudes={[complaint]} onRefresh={onRefresh} />)

    expect(screen.getByText('1 solicitud(es)')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar comprador, tienda, orden o ID...'), {
      target: { value: 'LIBRO DAÑADO' },
    })
    expect(screen.getAllByText('Orden #18')).not.toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalles' }))
    expect(screen.getByText('El libro llegó con páginas rotas.')).toBeTruthy()
    expect(screen.getByText('Respuesta actual del administrador')).toBeTruthy()
    expect(screen.getByText('Evidencia gráfica adjunta')).toBeTruthy()

    fireEvent.click(screen.getByText('Contactar / Chat con la tienda'))
    expect(await screen.findByText('Conversación #31')).toBeTruthy()
    expect(screen.getByText('Ya lo reviso')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Escribe un mensaje...'), {
      target: { value: '  Estamos atendiendo el caso  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    await waitFor(() => {
      expect(enviarMensajeSolicitudAdmin).toHaveBeenCalledWith(31, 'Estamos atendiendo el caso')
      expect(getMensajesSolicitudAdmin).toHaveBeenCalledWith(31)
      expect(onRefresh).toHaveBeenCalled()
    })
  })

  it('filtra tickets por rol y valida la respuesta antes de resolver', async () => {
    const requests = [
      { id_solicitud: 40, tipo_solicitud: 'soporte', rol_usuario: 'comprador', comprador: 'Compradora', asunto: 'Consulta', estado: 'Abierto' },
      { id_solicitud: 41, tipo_solicitud: 'soporte', rol_usuario: 'vendedor', comprador: 'Vendedor Uno', asunto: 'No puedo publicar', estado: 'En revisión' },
    ]
    render(<AdminRequests type="soporte" solicitudes={requests} />)

    expect(screen.getByText('Compradora')).toBeTruthy()
    fireEvent.click(screen.getByText('Vendedores'))
    expect(screen.getByText('Vendedor Uno')).toBeTruthy()
    expect(screen.queryByText('Compradora')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalles del ticket' }))
    fireEvent.click(screen.getByText('Resolver y notificar'))

    fireEvent.click(screen.getByText('Guardar y notificar'))
    expect(Alert.alert).toHaveBeenCalledWith(
      'Respuesta requerida',
      expect.stringContaining('al menos 3 caracteres'),
    )
    fireEvent.change(screen.getByPlaceholderText('Respuesta (mínimo 3 caracteres)'), {
      target: { value: '  Ya se solucionó el acceso  ' },
    })
    fireEvent.click(screen.getByText('Guardar y notificar'))

    await waitFor(() => expect(resolverSolicitudAdmin).toHaveBeenCalledWith(
      41,
      'Resuelto',
      'Ya se solucionó el acceso',
    ))
    expect(Alert.alert).toHaveBeenCalledWith('Actualizado', expect.any(String))
  })
})
