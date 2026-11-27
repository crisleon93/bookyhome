// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Header from '../../components/Header'
import { AuthContext } from '../../context/AuthContext'

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), signOut: vi.fn() }))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    onSubmitEditing,
    value,
    placeholder,
    accessibilityLabel,
    onStartShouldSetResponder,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        'aria-label': accessibilityLabel,
        title: props.title,
      }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        onChange: (event) => onChangeText?.(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') onSubmitEditing?.(event)
        },
      })
    }
    if (tag === 'img') return ReactModule.createElement('img', { alt: 'BookyHome' })
    return ReactModule.createElement(tag, { onMouseDown: onStartShouldSetResponder }, children)
  }
  return {
    Image: element('img'),
    Modal: ({ visible, children, onRequestClose }) => visible
      ? ReactModule.createElement(ReactModule.Fragment, null,
        ReactModule.createElement('div', { role: 'dialog' }, children),
        ReactModule.createElement('button', { type: 'button', onClick: onRequestClose }, 'Dismiss modal'))
      : null,
    StatusBar: () => null,
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { AuthContext: ReactModule.createContext({ user: null }) }
})
vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: (styles) => styles,
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconSearch: Icon,
    IconUser: Icon,
    IconUserPlus: Icon,
    IconLocation: Icon,
    IconClose: Icon,
    IconChevronRight: Icon,
    IconBook: Icon,
    IconMenu: () => <span>Menú</span>,
    IconCart: Icon,
    IconCamera: () => <span>Cámara</span>,
    IconFilter: () => <span>Filtros</span>,
  }
})
vi.mock('../../components/SidebarMenu', () => ({
  default: ({ visible, onClose }) => visible
    ? <button onClick={onClose}>Cerrar menú lateral</button>
    : null,
}))
vi.mock('../../components/BarcodeScanner', () => ({
  default: ({ visible, onBarcodeDetected, onClose }) => visible
    ? <>
      <button onClick={() => onBarcodeDetected('9781234567890')}>Detectar código</button>
      <button onClick={onClose}>Cerrar escáner</button>
    </>
    : null,
}))
vi.mock('../../components/FiltrosBusqueda', () => ({
  default: ({ visible, filtros = {}, onApply, onClose }) => visible
    ? (
      <div>
        <output data-testid="filters-initial">{JSON.stringify(filtros)}</output>
        <button onClick={() => onApply({ busqueda: '  fantasía ', categoria_id: 7, ordenar_por: 'precio_asc' }, 'libros')}>Aplicar filtros de libros</button>
        <button onClick={() => onApply({ nombre_tienda: 'Librería Sol', correo_vendedor: 'sol@example.test', ordenar_por: 'relevancia' }, 'librerias')}>Aplicar filtros de librerías</button>
        <button onClick={() => onApply({ busqueda: 'ciencia', categoria_nombre: 'Ciencia' }, 'libros')}>Enviar filtros a la pantalla</button>
        <button onClick={onClose}>Cerrar filtros</button>
      </div>
    )
    : null,
}))

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
})

const withAuth = (ui) => (
  <AuthContext.Provider value={{ user: { id_usuario: 4 }, signOut: mocks.signOut }}>
    {ui}
  </AuthContext.Provider>
)

describe('Header', () => {
  it('entrega los filtros actuales al abrir el modal desde el encabezado', () => {
    render(
      <Header
        variant="dashboard"
        filtrosIniciales={{ busqueda: 'novela', categoria_id: 7 }}
      />,
    );

    fireEvent.click(screen.getByText('Filtros'));
    expect(JSON.parse(screen.getByTestId('filters-initial').textContent)).toMatchObject({
      busqueda: 'novela',
      categoria_id: 7,
    });
  });

  it('cubre enlaces públicos, limpieza de búsqueda y filtros de navegación predeterminados', () => {
    const navigation = { navigate: mocks.navigate }
    render(<Header navigation={navigation} filtrosActivos={1} />);

    fireEvent.click(screen.getByText('Ingresa'));
    expect(mocks.navigate).toHaveBeenCalledWith('Login');
    fireEvent.click(screen.getByText('Crear cuenta'));
    fireEvent.click(screen.getByText('Soy comprador'));
    expect(mocks.navigate).toHaveBeenCalledWith('Register');

    const search = screen.getByPlaceholderText('Buscar libros...');
    fireEvent.change(search, { target: { value: 'novela' } });
    fireEvent.click(search.parentElement.querySelector('button'));
    expect(search.value).toBe('');

    fireEvent.click(screen.getByText('Envíos a Colombia'));
    fireEvent.click(screen.getByText('Cali'));
    fireEvent.click(screen.getByText('Filtros'));
    fireEvent.click(screen.getByText('Aplicar filtros de libros'));
    expect(mocks.navigate).toHaveBeenLastCalledWith('CatalogoPublico', {
      q: '  fantasía ',
      categoryId: 7,
      ordenar_por: 'precio_asc',
    });

    fireEvent.click(screen.getByText('Filtros'));
    fireEvent.click(screen.getByText('Aplicar filtros de librerías'));
    expect(mocks.navigate).toHaveBeenLastCalledWith('CatalogoPublico', {
      nombre_tienda: 'Librería Sol',
      correo_vendedor: 'sol@example.test',
      ordenar_por: undefined,
    });
  });

  it('navega desde las acciones del dashboard y cierra sus modales', () => {
    const { container } = render(<Header variant="dashboard" navigation={mocks} />);
    fireEvent.click(screen.getByRole('button', { name: 'BookyHome' }));
    expect(mocks.navigate).toHaveBeenCalledWith('PostLogin');
    fireEvent.click(container.querySelectorAll('button')[2]);
    expect(mocks.navigate).toHaveBeenCalledWith('Cart');

    fireEvent.click(screen.getByText('Cámara'));
    fireEvent.click(screen.getByText('Detectar código'));
    fireEvent.click(screen.getByText('Filtros'));
    fireEvent.click(screen.getByText('Enviar filtros a la pantalla'));
  });

  it('busca, abre el registro de librería y navega con ubicación seleccionada', () => {
    const onSearch = vi.fn()
    render(withAuth(<Header navigation={mocks} onSearch={onSearch} />))

    const search = screen.getByPlaceholderText('Buscar libros...')
    fireEvent.change(search, { target: { value: '  novela ' } })
    expect(onSearch).toHaveBeenCalledWith('  novela ')
    fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' })
    expect(mocks.navigate).toHaveBeenCalledWith('CatalogoPublico', { q: 'novela' })

    fireEvent.click(screen.getByText('Crear cuenta'))
    fireEvent.click(screen.getByText('Tengo una librería'))
    expect(mocks.navigate).toHaveBeenCalledWith('RegisterLibrary')

    fireEvent.click(screen.getByText('Envíos a Colombia'))
    fireEvent.click(screen.getByText('Medellín'))
    expect(screen.queryByText('Elige tu ubicación')).toBeNull()
  })

  it('maneja el menú, el escáner y distintos resultados de filtros', () => {
    const onBarcodeScanned = vi.fn()
    const onFilterApply = vi.fn()
    render(withAuth(
      <Header
        variant="dashboard"
        navigation={mocks}
        onBarcodeScanned={onBarcodeScanned}
        onFilterApply={onFilterApply}
        filtrosActivos={12}
      />,
    ))

    expect(screen.getByText('9+')).toBeTruthy()
    fireEvent.click(screen.getByText('Menú'))
    fireEvent.click(screen.getByText('Cerrar menú lateral'))
    fireEvent.click(screen.getByText('Cámara'))
    fireEvent.click(screen.getByText('Detectar código'))
    expect(onBarcodeScanned).toHaveBeenCalledWith('9781234567890')

    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(screen.getByText('Enviar filtros a la pantalla'))
    expect(onFilterApply).toHaveBeenCalledWith({ busqueda: 'ciencia', categoria_nombre: 'Ciencia' }, 'libros')
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(screen.getByText('Aplicar filtros de librerías'))
    expect(onFilterApply).toHaveBeenCalledWith(
      { nombre_tienda: 'Librería Sol', correo_vendedor: 'sol@example.test', ordenar_por: 'relevancia' },
      'librerias',
    )
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(screen.getByText('Cerrar filtros'))
    fireEvent.click(screen.getByText('Cámara'))
    fireEvent.click(screen.getByText('Cerrar escáner'))
    expect(screen.queryByText('Cerrar escáner')).toBeNull()
  })

  it('cierra los modales de registro y ubicación por la acción del sistema', () => {
    render(<Header navigation={mocks} />)
    fireEvent.click(screen.getByText('Crear cuenta'))
    fireEvent.click(screen.getByText('Dismiss modal'))
    expect(screen.queryByText('¿Cómo quieres unirte a BookyHome?')).toBeNull()

    fireEvent.click(screen.getByText('Envíos a Colombia'))
    fireEvent.click(screen.getByText('Dismiss modal'))
    expect(screen.queryByText('Elige tu ubicación')).toBeNull()
  })

  it('cierra los selectores de cuenta y ciudad con sus botones de cerrar', () => {
    render(<Header navigation={mocks} />)
    fireEvent.click(screen.getByText('Crear cuenta'))
    fireEvent.click(screen.getByRole('dialog').querySelectorAll('button')[1])
    expect(screen.queryByText('¿Cómo quieres unirte a BookyHome?')).toBeNull()

    fireEvent.click(screen.getByText('Envíos a Colombia'))
    const dialog = screen.getByRole('dialog')
    dialog.querySelectorAll('div').forEach((element) => fireEvent.mouseDown(element))
    fireEvent.click(dialog.querySelectorAll('button')[1])
    expect(screen.queryByText('Elige tu ubicación')).toBeNull()
  })
})
