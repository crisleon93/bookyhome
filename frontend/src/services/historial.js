// src/services/historial.js
import api from "./api";

export const historialService = {
  // ============= OBTENER =============

  obtener: async (
    tipo = null,
    limit = 50,
    offset = 0
  ) => {
    const response = await api.get("/historial", {
      params: {
        tipo,
        limit,
        offset,
      },
    });
    return response.data;
  },

  // ============= REGISTRAR =============

  registrar: async (tipo, id_libro = null, id_tienda = null, descripcion = null) => {
    const response = await api.post(
      "/historial",
      {
        tipo,
        id_libro,
        id_tienda,
        descripcion,
      }
    );
    return response.data;
  },

  // ============= ESTADÍSTICAS =============

  obtenerEstadisticas: async () => {
    const response = await api.get("/historial/estadisticas");
    return response.data;
  },

  // ============= ELIMINAR =============

  eliminar: async (id_interaccion) => {
    const response = await api.delete(
      `/historial/${id_interaccion}`
    );
    return response.data;
  },
};
