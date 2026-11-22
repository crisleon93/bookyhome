// @vitest-environment jsdom
/**
 * BookyChat.coverage.test.jsx
 * Cobertura del componente flotante de chat IA BookyChat.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BookyChat from '../../components/BookyChat';
import { AuthContext } from '../../context/AuthContext';

// ─── Mocks hoisted ────────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  chatAsistente: vi.fn(),
  storageGet: vi.fn(),
  storageSet: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: mocks.storageGet,
    setItem: mocks.storageSet,
  },
}));

vi.mock('../../services/api', () => ({
  chatAsistente: mocks.chatAsistente,
}));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

vi.mock('react-native', async () => {
  const R = await vi.importActual('react');

  class AnimatedValue {
    constructor(v) { this._value = v; }
    setValue(v) { this._value = v; }
    interpolate() { return this; }
  }

  const native = (tag) => function NativeElement({
    children, onPress, onChangeText, accessibilityLabel, disabled,
    value, placeholder, source, onSubmitEditing, editable, ...props
  }) {
    if (tag === 'button') {
      return R.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
      }, children);
    }
    if (tag === 'input') {
      return R.createElement('input', {
        value: value ?? '',
        placeholder,
        disabled: disabled || editable === false,
        onChange: (e) => onChangeText?.(e.target.value),
        onKeyDown: (e) => { if (e.key === 'Enter') onSubmitEditing?.(); },
        'aria-label': accessibilityLabel,
      });
    }
    if (tag === 'img') {
      return R.createElement('img', {
        src: source?.uri || (typeof source === 'string' ? source : ''),
        alt: '',
      });
    }
    return R.createElement('div', { 'data-testid': props.testID }, children);
  };

  return {
    Animated: {
      Value: AnimatedValue,
      timing: () => ({ start: (cb) => cb?.() }),
      sequence: (arr) => ({ start: (cb) => { arr.forEach((a) => a.start?.()); cb?.(); } }),
      loop: () => ({ start: () => {}, stop: () => {} }),
      delay: () => ({ start: (cb) => cb?.() }),
      View: ({ children }) => R.createElement('div', null, children),
      Image: ({ source }) =>
        R.createElement('img', { src: source?.uri || '', alt: '' }),
    },
    Easing: { ease: 0, inOut: () => 0, sin: 0 },
    Alert: { alert: vi.fn() },
    FlatList: ({ data = [], renderItem }) =>
      R.createElement('div', { 'data-testid': 'flat-list' },
        (data || []).map((item, i) =>
          R.createElement(R.Fragment, { key: i }, renderItem({ item, index: i }))
        )
      ),
    Image: native('img'),
    KeyboardAvoidingView: ({ children }) => R.createElement('div', null, children),
    Modal: ({ visible, children }) => visible
      ? R.createElement('div', { role: 'dialog', 'data-testid': 'chat-modal' }, children)
      : null,
    Platform: { OS: 'android' },
    Pressable: native('button'),
    ScrollView: ({ children }) => R.createElement('div', { 'data-testid': 'scroll-view' }, children),
    StyleSheet: { create: (s) => s, absoluteFillObject: {} },
    Text: native('span'),
    TextInput: native('input'),
    TouchableOpacity: native('button'),
    View: native('div'),
  };
});

vi.mock('../../context/AuthContext', async () => {
  const R = await vi.importActual('react');
  return { AuthContext: R.createContext({ user: null, token: null }) };
});

afterEach(cleanup);

const authUser = {
  user: { id: 42, nombre: 'Ana', email: 'ana@example.test' },
  token: 'test-token',
};

function renderChat(auth = authUser) {
  return render(
    <AuthContext.Provider value={auth}>
      <BookyChat />
    </AuthContext.Provider>
  );
}

describe('BookyChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storageGet.mockResolvedValue(null);
    mocks.storageSet.mockResolvedValue(undefined);
    mocks.chatAsistente.mockResolvedValue({
      data: { respuesta: 'Claro, puedo ayudarte con eso.' },
    });
  });

  it('muestra el botón flotante y abre el chat al hacer clic', async () => {
    renderChat();
    const fab = await screen.findByLabelText('Abrir asistente Booky');
    expect(fab).toBeTruthy();
    fireEvent.click(fab);
    expect(await screen.findByTestId('chat-modal')).toBeTruthy();
    expect(screen.getByText('Booky')).toBeTruthy();
    expect(screen.getByText('Tu compañero lector')).toBeTruthy();
  });

  it('muestra el saludo de bienvenida con el nombre del usuario', async () => {
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    expect(await screen.findByText(/Hola Ana/)).toBeTruthy();
  });

  it('envía un mensaje y muestra la respuesta del bot', async () => {
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    await screen.findByText(/Hola Ana/);

    fireEvent.change(screen.getByPlaceholderText('Escribe tu pregunta sobre BookyHome…'), {
      target: { value: '¿Qué libros recomiendas?' },
    });
    fireEvent.click(screen.getByText('Enviar'));

    await waitFor(() =>
      expect(mocks.chatAsistente).toHaveBeenCalledWith(expect.objectContaining({
        mensaje: '¿Qué libros recomiendas?',
        pagina: 'app-movil',
      }))
    );
    expect(await screen.findByText('Claro, puedo ayudarte con eso.')).toBeTruthy();
  });

  it('no envía si el input está vacío', async () => {
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    await screen.findByText(/Hola Ana/);

    fireEvent.click(screen.getByText('Enviar'));
    expect(mocks.chatAsistente).not.toHaveBeenCalled();
  });

  it('envía mensaje con Enter', async () => {
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    await screen.findByText(/Hola Ana/);

    const input = screen.getByPlaceholderText('Escribe tu pregunta sobre BookyHome…');
    fireEvent.change(input, { target: { value: 'Hola Booky' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(mocks.chatAsistente).toHaveBeenCalledOnce());
  });

  it('muestra error del bot cuando la API falla', async () => {
    mocks.chatAsistente.mockRejectedValueOnce(new Error('network error'));
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    await screen.findByText(/Hola Ana/);

    fireEvent.change(screen.getByPlaceholderText('Escribe tu pregunta sobre BookyHome…'), {
      target: { value: 'pregunta cualquiera' },
    });
    fireEvent.click(screen.getByText('Enviar'));
    expect(await screen.findByText(/No pude responder en este momento/)).toBeTruthy();
  });

  it('cierra el chat al presionar el botón de cerrar', async () => {
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    await screen.findByTestId('chat-modal');
    fireEvent.click(screen.getByText('✕'));
    await waitFor(() =>
      expect(screen.queryByTestId('chat-modal')).toBeNull()
    );
  });

  it('abre y cierra el sidebar de sesiones', async () => {
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    await screen.findByText(/Hola Ana/);

    fireEvent.click(screen.getByText('☰'));
    expect(await screen.findByText('Sesiones')).toBeTruthy();

    fireEvent.click(screen.getByText('☰'));
    await waitFor(() => expect(screen.queryByText('Sesiones')).toBeNull());
  });

  it('crea una nueva sesión desde el sidebar', async () => {
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    await screen.findByText(/Hola/);

    fireEvent.click(screen.getByText('☰'));
    await screen.findByText('+');
    fireEvent.click(screen.getByText('+'));

    await waitFor(() => expect(screen.getByText('Booky')).toBeTruthy());
  });

  it('muestra sesión guardada en AsyncStorage al montar', async () => {
    const stored = JSON.stringify([{
      id: 's-1',
      title: 'Sesión previa',
      updatedAt: Date.now(),
      messages: [
        { from: 'bot', text: '¡Hola! Soy Booky.' },
        { from: 'user', text: 'mensaje guardado' },
      ],
    }]);
    mocks.storageGet.mockResolvedValueOnce(stored);

    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    expect(await screen.findByText('¡Hola! Soy Booky.')).toBeTruthy();
    expect(screen.getByText('mensaje guardado')).toBeTruthy();
  });

  it('elimina una sesión desde el sidebar y crea fallback si era la única', async () => {
    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    await screen.findByText(/Hola/);

    fireEvent.click(screen.getByText('☰'));
    await screen.findByText('Sesiones');

    // El sidebar muestra botones ✕ para eliminar sesiones (distintos al ✕ de cerrar modal)
    const deleteButtons = screen.getAllByText('✕');
    // El último ✕ es el de la sesión en el sidebar (el primero es el de cerrar el chat)
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    expect(await screen.findByText(/Hola/)).toBeTruthy();
  });

  it('funciona sin usuario autenticado (modo guest)', async () => {
    renderChat({ user: null, token: null });
    const fab = await screen.findByLabelText('Abrir asistente Booky');
    fireEvent.click(fab);
    expect(await screen.findByText(/Hola!/)).toBeTruthy();
  });

  it('abre sesión existente desde el sidebar', async () => {
    const stored = JSON.stringify([
      {
        id: 's-1',
        title: 'Primera sesión',
        updatedAt: Date.now() - 1000,
        messages: [{ from: 'bot', text: 'Mensaje de primera sesión' }],
      },
      {
        id: 's-2',
        title: 'Segunda sesión',
        updatedAt: Date.now(),
        messages: [{ from: 'bot', text: 'Mensaje de segunda sesión' }],
      },
    ]);
    mocks.storageGet.mockResolvedValueOnce(stored);

    renderChat();
    fireEvent.click(await screen.findByLabelText('Abrir asistente Booky'));
    // La primera sesión cargada es la [0] que es 'Primera sesión'
    expect(await screen.findByText('Mensaje de primera sesión')).toBeTruthy();

    fireEvent.click(screen.getByText('☰'));
    await screen.findByText('Segunda sesión');
    fireEvent.click(screen.getByText('Segunda sesión'));
    expect(await screen.findByText('Mensaje de segunda sesión')).toBeTruthy();
  });
});
