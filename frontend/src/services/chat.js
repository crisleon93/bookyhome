// src/services/chat.js
import api from "./api";

export const chatService = {
  // ============= SALAS =============
  
  getSalas: async () => {
    const response = await api.get("/chat/salas");
    return response.data;
  },

  crearSala: async (id_tienda) => {
    const response = await api.post(
      "/chat/salas",
      { id_tienda }
    );
    return response.data;
  },

  // ============= MENSAJES =============

  obtenerMensajes: async (id_sala, limit = 50, offset = 0) => {
    const response = await api.get(
      `/chat/salas/${id_sala}/mensajes?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },

  enviarMensaje: async (id_sala, mensaje) => {
    const response = await api.post(
      `/chat/mensajes`,
      {
        id_sala,
        mensaje,
      }
    );
    return response.data;
  },

  marcarMensajeLeido: async (id_mensaje) => {
    const response = await api.put(
      `/chat/mensajes/${id_mensaje}/leer`,
      {}
    );
    return response.data;
  },

  marcarSalaLeida: async (id_sala) => {
    const response = await api.put(
      `/chat/salas/${id_sala}/marcar-leidos`,
      {}
    );
    return response.data;
  },

  eliminarSala: async (id_sala) => {
    const response = await api.delete(`/chat/salas/${id_sala}`);
    return response.data;
  },

  vaciarChat: async (id_sala) => {
    const response = await api.delete(`/chat/salas/${id_sala}/mensajes`);
    return response.data;
  },
};
