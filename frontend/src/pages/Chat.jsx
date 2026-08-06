// src/pages/Chat.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../hooks/useAuth";
import { chatService } from "../services/chat";
import { jwtDecode } from "jwt-decode";
import "../styles/Chat.css";
import axios from 'axios';

const WS_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/^http/, "ws");

export default function Chat({
  embedded = false,
  selectedSalaProp = null,
  onSelectSala = null,
}) {
  const navigate = useNavigate();
  const token = getToken();
  const params = useParams();

  const id_sala = embedded ? null : Number(params.id_sala);

  const [salas, setSalas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(
    selectedSalaProp || id_sala || null
  );
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  // helpers de fecha para separadores
  const formatFechaSeparador = (fechaStr) => {
    if (!fechaStr) return '';
    const date = new Date(fechaStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return '';
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    const mismaFecha = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (mismaFecha(date, hoy)) return 'Hoy';
    if (mismaFecha(date, ayer)) return 'Ayer';
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatHora = (fechaStr) => {
    if (!fechaStr) return '';
    const date = new Date(fechaStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  // Obtener ID del usuario desde el token JWT
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsuarioActual({ id_usuario: parseInt(decoded.sub) });
      } catch {
        console.error("Error decodificando token");
      }
    }
  }, [token]);

  const cargarSalas = useCallback(async () => {
    try {
      const data = await chatService.getSalas();
      setSalas(data.salas || []);
    } catch {
      console.error("Error cargando salas");
    }
  }, []);

  const mensajesContainerRef = useRef(null);
  const wsRef = useRef(null);
  const reconectarTimeoutRef = useRef(null);
  const intentosReconexion = useRef(0);
  const selectedSalaRef = useRef(selectedSala);

  // Si cambia la sala desde el componente padre
  useEffect(() => {
    if (selectedSalaProp) {
      setSelectedSala(selectedSalaProp);
    }
  }, [selectedSalaProp]);

  // Mantiene sincronizado el ref para que el onmessage del WS (closure fija)
  // siempre sepa cuál es la sala abierta actualmente.
  useEffect(() => {
    selectedSalaRef.current = selectedSala;
  }, [selectedSala]);

  // ==========================
  // CARGAR SALAS (carga inicial; el WS mantiene la lista actualizada después)
  // ==========================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    cargarSalas();
  }, [token, navigate, cargarSalas]);

  // ==========================
  // USUARIO ACTUAL
  // ==========================

  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
          }/perfil/mi-perfil`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUsuarioActual(res.data);
      } catch (err) {
        console.error("Error obteniendo usuario:", err);
      }
    };

    if (token) {
      obtenerUsuarioActual();
    }
  }, [token]);

  // ==========================
  // WEBSOCKET (tiempo real)
  // ==========================

  useEffect(() => {
    if (!token) return;

    const conectarWebSocket = () => {
      const ws = new WebSocket(`${WS_BASE_URL}/chat/ws?token=${token}`);

      ws.onopen = () => {
        intentosReconexion.current = 0;
      };

      ws.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.tipo === "nuevo_mensaje" || data.tipo === "mensaje_enviado") {
          const msg = data.mensaje;

          // Si el mensaje es de la sala abierta actualmente, lo agregamos al hilo
          if (msg.id_sala === selectedSalaRef.current) {
            setMensajes((prev) => {
              if (prev.some((m) => m.id_mensaje === msg.id_mensaje)) return prev;
              return [...prev, msg];
            });
            if (data.tipo === "nuevo_mensaje") {
              chatService.marcarSalaLeida(msg.id_sala).catch(() => {});
            }
          }

          // Actualizamos la lista de salas (último mensaje / no leídos)
          // sin importar cuál esté abierta en este momento.
          setSalas((prev) => {
            const idx = prev.findIndex((s) => s.id_sala === msg.id_sala);
            if (idx === -1) return prev;
            const copia = [...prev];
            const sala = { ...copia[idx] };
            sala.ultimo_mensaje = msg.mensaje;
            if (
              data.tipo === "nuevo_mensaje" &&
              msg.id_sala !== selectedSalaRef.current
            ) {
              sala.no_leidos = (sala.no_leidos || 0) + 1;
            }
            copia.splice(idx, 1);
            copia.unshift(sala);
            return copia;
          });
        }

        if (data.tipo === "error") {
          console.warn("Error del servidor de chat:", data.detalle);
        }
      };

      ws.onerror = (e) => {
        console.error("Error en WebSocket de chat:", e);
      };

      ws.onclose = (event) => {
        if (event.code === 4401) {
          // Token inválido/expirado: no reintentamos.
          console.warn("Token inválido en WS de chat, no se reintenta la conexión");
          return;
        }

        intentosReconexion.current += 1;
        const espera = Math.min(1000 * intentosReconexion.current, 10000);
        reconectarTimeoutRef.current = setTimeout(conectarWebSocket, espera);
      };

      wsRef.current = ws;
    };

    conectarWebSocket();

    return () => {
      if (reconectarTimeoutRef.current) clearTimeout(reconectarTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // evita reconexión fantasma al desmontar
        wsRef.current.close();
      }
    };
  }, [token]);

  // ==========================
  // MENSAJES (carga inicial al cambiar de sala; el WS mantiene el resto)
  // ==========================

  const cargarMensajes = useCallback(async () => {
    if (!selectedSala) return;

    try {
      const data = await chatService.obtenerMensajes(selectedSala, 50, 0);

      setMensajes(data.mensajes || []);

      await chatService.marcarSalaLeida(selectedSala);
    } catch (err) {
      console.error(err);
      setError("Error cargando mensajes");
    }
  }, [selectedSala]);

  useEffect(() => {
    if (!selectedSala) return;

    cargarMensajes();
  }, [selectedSala, cargarMensajes]);

  // Scroll automático: mueve solo el panel de mensajes, no la página entera
  useEffect(() => {
    const el = mensajesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [mensajes]);

  // ==========================
  // ENVIAR MENSAJE
  // ==========================

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !selectedSala) return;

    const textoEnviar = nuevoMensaje;
    setNuevoMensaje("");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Envío súper rápido vía WebSocket
      wsRef.current.send(
        JSON.stringify({
          tipo: "mensaje",
          id_sala: selectedSala,
          mensaje: textoEnviar,
        })
      );
    } else {
      // Fallback REST si el socket se desconecta temporalmente
      try {
        setLoading(true);
        await chatService.enviarMensaje(selectedSala, textoEnviar);
        await cargarMensajes();
      } catch (err) {
        console.error(err);
        setError("Error enviando mensaje");
      } finally {
        setLoading(false);
      }
    }
  };

  // ==========================
  // SELECCIONAR SALA
  // ==========================

  const handleSeleccionarSala = (sala) => {
    setSelectedSala(sala.id_sala);

    if (onSelectSala) {
      onSelectSala(sala.id_sala);
    }

    if (!embedded) {
      navigate(`/chat/${sala.id_sala}`);
    }
  };

  // ==========================
  // NOMBRE A MOSTRAR (CORREGIDO)
  // ==========================

  const nombreMostrar = (sala) => {
    if (!sala) return "";
    const rol = (
      usuarioActual?.rol ||
      usuarioActual?.rol_nombre ||
      usuarioActual?.tipo_usuario ||
      ""
    ).toString().toLowerCase();
    const esVendedor = rol === "vendedor" || usuarioActual?.id_rol === 2;

    if (esVendedor) {
      return sala.nombre_comprador || sala.nombre_cliente || sala.nombre_usuario || "Comprador";
    } else {
      return sala.nombre_tienda || sala.nombre_libreria || sala.nombre_vendedor || "Tienda / Vendedor";
    }
  };

  // ==========================
  // UI
  // ==========================

  return (
    <div className={`chat-container ${embedded ? 'embedded' : ''}`}>
      <div className="chat-wrapper">
        {/* PANEL IZQUIERDO */}

        <div className="chat-salas">
          <div className="salas-header">
            <h2>Mensajes</h2>
            <span className="salas-count">{salas.length}</span>
          </div>

          <div className="salas-list">
            {salas.length === 0 ? (
              <div className="salas-empty">
                <p>
                  {embedded
                    ? "Aún no tienes conversaciones"
                    : "No tienes conversaciones"}
                </p>

                <small>
                  {embedded
                    ? "No has recibido mensajes de clientes todavía."
                    : "Inicia una conversación con una tienda"}
                </small>
              </div>
            ) : (
              salas.map((sala) => (
                <div
                  key={sala.id_sala}
                  className={`sala-item ${
                    selectedSala === sala.id_sala
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleSeleccionarSala(sala)
                  }
                >
                  <div className="sala-info">
                    <h4>{nombreMostrar(sala)}</h4>

                    <p className="sala-preview">
                      {sala.ultimo_mensaje?.substring(
                        0,
                        40
                      ) || "Sin mensajes"}
                    </p>
                  </div>

                  {sala.no_leidos > 0 && (
                    <span className="notificacion-badge">
                      {sala.no_leidos}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL DERECHO */}

        <div className="chat-conversacion">
          {selectedSala ? (
            <>
              <div className="chat-header">
                <h2>
                  {nombreMostrar(
                    salas.find(
                      (s) =>
                        s.id_sala === selectedSala
                    )
                  )}
                </h2>
              </div>

              <div className="chat-mensajes" ref={mensajesContainerRef}>
                {mensajes.length === 0 ? (
                  <div className="mensajes-empty">
                    <p>No hay mensajes</p>
                  </div>
                ) : (
                  mensajes.map((msg, index) => {
                    const esPropio = msg.id_remitente === usuarioActual?.id_usuario;
                    const anterior = mensajes[index - 1];
                    const fechaActual = formatFechaSeparador(msg.enviado_en);
                    const fechaAnterior = anterior ? formatFechaSeparador(anterior.enviado_en) : null;
                    const mostrarSeparador = fechaActual && fechaActual !== fechaAnterior;

                    return (
                      <div key={msg.id_mensaje}>
                        {mostrarSeparador && (
                          <div className="fecha-separador">
                            <span>{fechaActual}</span>
                          </div>
                        )}
                        <div className={`mensaje ${esPropio ? 'propio' : 'otro'}`}>
                          <div className="mensaje-body">
                            {!esPropio && (
                              <span className="mensaje-remitente">
                                {msg.nombre_remitente || 'Usuario'}
                              </span>
                            )}
                            <p className="mensaje-texto">{msg.mensaje}</p>
                            <span className="mensaje-hora">
                              {formatHora(msg.enviado_en)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleEnviarMensaje}
                className="chat-input-form"
              >
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={nuevoMensaje}
                  onChange={(e) =>
                    setNuevoMensaje(e.target.value)
                  }
                  maxLength={500}
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !nuevoMensaje.trim()
                  }
                >
                  {loading ? "..." : "Enviar"}
                </button>
              </form>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="chat-empty">
              <p>
                Selecciona una conversación para empezar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}