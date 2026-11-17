// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminProfile from '../../screens/AdminProfile'
import { Alert } from 'react-native'
import { getProfile, saveBannerColor, updateProfile } from '../../services/api'

const mocks = vi.hoisted(() => ({ setDarkMode: vi.fn(), alert: vi.fn() }))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    value,
    placeholder,
    accessibilityLabel,
    disabled,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
      }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        disabled,
        'aria-label': accessibilityLabel,
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    if (tag === 'img') return ReactModule.createElement('img', { alt: accessibilityLabel || '' })
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Cargando'),
    Alert: { alert: mocks.alert },
    Image: element('img'),
    Platform: { OS: 'web' },
    RefreshControl: () => null,
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles, absoluteFill: {} },
    Switch: ({ value, onValueChange, accessibilityLabel }) => ReactModule.createElement('input', {
      type: 'checkbox',
      role: 'switch',
      checked: value,
      'aria-label': accessibilityLabel,
      onChange: (event) => onValueChange(event.target.checked),
    }),
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}))
vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}))
vi.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }) => <div>{children}</div> }))
vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({
    darkMode: false,
    setDarkMode: mocks.setDarkMode,
    colors: { page: '#fff', card: '#fff', border: '#eee', text: '#000', muted: '#666', inset: '#f5f5f5' },
  }),
}))
vi.mock('../../services/api', () => ({
  getApiBaseUrl: () => 'https://api.example.test',
  getProfile: vi.fn(),
  saveBannerColor: vi.fn(),
  updateProfile: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  uploadProfilePhoto: vi.fn(),
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconBook: Icon,
    IconCheck: Icon,
    IconPackage: Icon,
    IconSettings: Icon,
    IconStore: Icon,
    IconTool: Icon,
    IconUser: Icon,
    IconUsers: Icon,
  }
})

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  getProfile.mockResolvedValue({
    data: {
      nombre_usuario: 'Ana Pérez',
      telefono: '3001234567',
      correo_usuario: 'ana@example.test',
      fecha_registro: '2026-01-15',
      banner_color: '#7A1E3A',
    },
  })
  updateProfile.mockResolvedValue({})
  saveBannerColor.mockResolvedValue({})
})

describe('AdminProfile', () => {
  it('carga los datos, valida color de banner y guarda los cambios', async () => {
    const onProfileNameChange = vi.fn()
    render(
      <AdminProfile
        stats={{ usuarios: 12, libros: 8, ordenes: 5, tiendas: 3 }}
        solicitudes={[
          { estado: 'Abierto', tipo_solicitud: 'Reclamo' },
          { estado: 'Resuelto', tipo_solicitud: 'soporte' },
        ]}
        onProfileNameChange={onProfileNameChange}
      />,
    )

    expect(await screen.findByText('Información personal')).toBeTruthy()
    expect(screen.getByText(/Miembro desde .*2026/)).toBeTruthy()
    expect(screen.getByText('Reclamos recibidos')).toBeTruthy()

    fireEvent.click(screen.getByText('Editar banner'))
    fireEvent.change(screen.getByPlaceholderText('#7A1E3A'), { target: { value: '#abc' } })
    fireEvent.click(screen.getByText('Aplicar'))
    expect(Alert.alert).toHaveBeenCalledWith(
      'Color inválido',
      expect.stringContaining('hexadecimal válido'),
    )

    fireEvent.change(screen.getByPlaceholderText('#7A1E3A'), { target: { value: '#ABCDEF' } })
    fireEvent.click(screen.getByText('Aplicar'))
    fireEvent.change(screen.getByPlaceholderText('Nombres'), { target: { value: '  Beatriz ' } })
    fireEvent.change(screen.getByPlaceholderText('Apellidos'), { target: { value: ' Ruiz ' } })
    fireEvent.change(screen.getByPlaceholderText('Número de contacto'), { target: { value: ' 3110000000 ' } })
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        nombre_usuario: 'Beatriz Ruiz',
        telefono: '3110000000',
      })
      expect(saveBannerColor).toHaveBeenCalledWith('#ABCDEF')
    })
    expect(onProfileNameChange).toHaveBeenCalledWith('Beatriz Ruiz')
    expect(Alert.alert).toHaveBeenCalledWith('Listo', 'El perfil se actualizó correctamente.')
  })

  it('impide guardar si el nombre obligatorio queda vacío', async () => {
    render(<AdminProfile />)
    await screen.findByText('Información personal')
    fireEvent.change(screen.getByPlaceholderText('Nombres'), { target: { value: '   ' } })
    fireEvent.click(screen.getByText('Guardar cambios'))

    expect(Alert.alert).toHaveBeenCalledWith('Dato requerido', 'El nombre no puede quedar vacío.')
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('guarda las fotos seleccionadas junto al perfil y notifica sus URL', async () => {
    const picker = await import('expo-image-picker')
    const api = await import('../../services/api')
    const onProfilePhotoChange = vi.fn()
    const onProfileBannerChange = vi.fn()
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true })
    picker.launchImageLibraryAsync
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///profile.webp', file: new Blob(['photo']) }],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///banner.png', file: new Blob(['banner']) }],
      })
    api.uploadProfilePhoto.mockResolvedValue({ data: { url: '/uploads/profile.webp' } })
    api.uploadBannerPhoto.mockResolvedValue({ data: { banner_perfil: '/uploads/banner.png' } })
    render(<AdminProfile onProfilePhotoChange={onProfilePhotoChange} onProfileBannerChange={onProfileBannerChange} />)

    await screen.findByText('Información personal')
    fireEvent.click(screen.getByText('Cambiar foto'))
    await waitFor(() => expect(picker.launchImageLibraryAsync).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByText('Editar banner'))
    fireEvent.click(screen.getByText('Elegir imagen'))
    await waitFor(() => expect(picker.launchImageLibraryAsync).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(api.uploadProfilePhoto).toHaveBeenCalledOnce()
      expect(api.uploadBannerPhoto).toHaveBeenCalledOnce()
    })
    expect(onProfilePhotoChange).toHaveBeenCalledWith('https://api.example.test/uploads/profile.webp')
    expect(onProfileBannerChange).toHaveBeenCalledWith('https://api.example.test/uploads/banner.png', null)
    expect(Alert.alert).toHaveBeenCalledWith('Listo', 'El perfil se actualizó correctamente.')
  })

  it('advierte si no hay permiso para seleccionar una foto', async () => {
    const picker = await import('expo-image-picker')
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false })
    render(<AdminProfile />)

    await screen.findByText('Información personal')
    fireEvent.click(screen.getByText('Cambiar foto'))

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
      'Permiso requerido',
      'Permite el acceso a la galería para seleccionar una imagen.',
    ))
  })
})
