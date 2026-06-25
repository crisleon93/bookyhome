// src/services/notificaciones.js
import api from "./api";

export const notificacionesService = {
  // ============= OBTENER =============

  obtener: async (
    soloNoLeidas = false,
    limit = 20,
    offset = 0
  ) => {
    const response = await api.get("/notificaciones", {
      params: {
        solo_no_leidas: soloNoLeidas,
        limit,
        offset,
      },
    });
    return response.data;
  },

  // ============= CREAR =============

  crear: async (tipo, titulo, descripcion, referencia_id) => {
    const response = await api.post(
      "/notificaciones",
      {
        tipo,
        titulo,
        descripcion,
        referencia_id,
      }
    );
    return response.data;
  },

  // ============= MARCAR COMO LEÍDO =============

  marcarLeida: async (id_notificacion) => {
    const response = await api.put(
      `/notificaciones/${id_notificacion}/leer`,
      {}
    );
    return response.data;
  },

  marcarTodasLeidas: async () => {
    const response = await api.put(
      "/notificaciones/marcar-todas-leidas",
      {}
    );
    return response.data;
  },

  // ============= ELIMINAR =============

  eliminar: async (id_notificacion) => {
    const response = await api.delete(
      `/notificaciones/${id_notificacion}`
    );
    return response.data;
  },
};
