import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AsistenteIA from '../../components/AsistenteIA';
import { chatAsistente } from '../../services/asistente';

vi.mock('../../services/asistente', () => ({ chatAsistente: vi.fn() }));

const renderAssistant = (path = '/') => render(
  <MemoryRouter initialEntries={[path]}>
    <AsistenteIA />
  </MemoryRouter>,
);

describe('AsistenteIA', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('inicia con un saludo y abre una nueva sesión persistida para invitado', () => {
    renderAssistant();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente Booky' }));

    expect(screen.getByText('¡Hola! Soy Booky, tu compañero lector. ¿En qué puedo ayudarte hoy?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nueva sesión' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('booky_assistant_session_history_guest'))).toHaveLength(1);
    expect(localStorage.getItem('booky_assistant_session_active_id_guest')).toBe('default');
  });

  it('envía la pregunta, la ruta actual y el historial de conversación', async () => {
    chatAsistente.mockResolvedValue({ data: { respuesta: 'Prueba **destacada**\n- Primer punto\n1. Segundo punto' } });
    renderAssistant('/catalogo');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente Booky' }));
    fireEvent.change(screen.getByPlaceholderText('Escribe tu pregunta sobre BookyHome...'), {
      target: { value: '  ¿Qué libro recomiendas?  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(chatAsistente).toHaveBeenCalledWith({
      mensaje: '¿Qué libro recomiendas?',
      pagina: '/catalogo',
      historial: [],
    }));
    expect(await screen.findByText('Prueba')).toBeInTheDocument();
    expect(screen.getByText('destacada').tagName).toBe('STRONG');
    expect(screen.getByText('Primer punto')).toBeInTheDocument();
    expect(screen.getByText('Segundo punto')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('booky_assistant_session_history_guest'))[0].title)
      .toBe('¿Qué libro recomiendas?');
  });

  it('muestra un mensaje de error recuperable si la API falla', async () => {
    chatAsistente.mockRejectedValue(new Error('servicio no disponible'));
    renderAssistant();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente Booky' }));
    fireEvent.change(screen.getByPlaceholderText('Escribe tu pregunta sobre BookyHome...'), {
      target: { value: 'Pregunta' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('No pude responder en este momento. Inténtalo de nuevo en unos segundos.'))
      .toBeInTheDocument();
  });

  it('ignora mensajes vacíos y crea, colapsa y elimina sesiones', () => {
    renderAssistant();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente Booky' }));
    fireEvent.change(screen.getByPlaceholderText('Escribe tu pregunta sobre BookyHome...'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(chatAsistente).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Nueva sesión' }));
    const sessions = JSON.parse(localStorage.getItem('booky_assistant_session_history_guest'));
    expect(sessions).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Colapsar sesiones' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Colapsar sesiones' }));
    expect(screen.getByRole('button', { name: 'Expandir sesiones' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expandir sesiones' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Eliminar sesión/ })[0]);
    expect(JSON.parse(localStorage.getItem('booky_assistant_session_history_guest'))).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /Eliminar sesión/ }));
    expect(JSON.parse(localStorage.getItem('booky_assistant_session_history_guest'))).toHaveLength(1);
  });

  it('carga historial asociado al usuario del token y sincroniza cambios de autenticación', () => {
    const tokenPayload = btoa(JSON.stringify({ sub: 42, nombre: 'Lector' }));
    localStorage.setItem('token', `header.${tokenPayload}.signature`);
    const sessions = [{
      id: 'existing',
      title: 'Conversación guardada',
      updatedAt: 1,
      messages: [
        { from: 'bot', text: '¡Hola! Soy Booky, tu compañero lector.' },
        { from: 'user', text: 'Hola Booky' },
        { from: 'bot', text: '¿En qué puedo ayudarte?' },
      ],
    }];
    localStorage.setItem('booky_assistant_session_history_42', JSON.stringify(sessions));
    localStorage.setItem('booky_assistant_session_active_id_42', 'existing');
    renderAssistant();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente Booky' }));

    expect(screen.getAllByText('Hola Booky')[0]).toBeInTheDocument();
    expect(screen.getByText('¿En qué puedo ayudarte?')).toBeInTheDocument();
    expect(screen.queryByText('¡Hola! Soy Booky, tu compañero lector.')).not.toBeInTheDocument();

    localStorage.setItem('booky_assistant_session_history_42', JSON.stringify(sessions));
    act(() => window.dispatchEvent(new Event('storage')));
    expect(screen.getByRole('button', { name: 'Hola Booky' })).toBeInTheDocument();
  });
});
