import { describe, expect, it, vi } from 'vitest';
import { chatAsistente } from '../../services/asistente';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: { post: vi.fn() },
}));

describe('servicio del asistente', () => {
  it('envía el payload al endpoint de chat del asistente y devuelve la respuesta', async () => {
    const payload = { mensaje: 'Recomiéndame una novela', historial: [] };
    const response = { data: { respuesta: 'Prueba' } };
    vi.mocked(api.post).mockResolvedValue(response);

    await expect(chatAsistente(payload)).resolves.toBe(response);
    expect(api.post).toHaveBeenCalledWith('/asistente/chat', payload);
  });

  it('propaga errores del cliente HTTP', async () => {
    const error = new Error('API no disponible');
    vi.mocked(api.post).mockRejectedValue(error);

    await expect(chatAsistente({ mensaje: 'Hola' })).rejects.toBe(error);
  });
});
