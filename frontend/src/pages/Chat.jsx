// src/pages/Chat.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../hooks/useAuth";
import { chatService } from "../services/chat";
import { jwtDecode } from "jwt-decode";
import "../styles/Chat.css";

export default function Chat({ embedded = false, selectedSalaProp = null, onSelectSala = null }) {
  const navigate = useNavigate();
  const token = getToken();
  const params = useParams();
  const id_sala = embedded ? null : params.id_sala;

  const [salas, setSalas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(selectedSalaProp || id_sala || null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

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

  // ============= OBTENER SALAS =============
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    cargarSalas();
    const interval = setInterval(cargarSalas, 5000);
    return () => clearInterval(interval);
  }, [token, navigate, cargarSalas]);

  // ============= CARGAR MENSAJES =============
  const cargarMensajes = useCallback(async (scrollToBottom = false) => {
    if (!selectedSala) return;
    try {
      const data = await chatService.obtenerMensajes(selectedSala, 50, 0);
      setMensajes(data.mensajes || []);
      if (scrollToBottom) {
        setShouldScrollToBottom(true);
      }
      await chatService.marcarSalaLeida(selectedSala);
    } catch {
      setError("Error cargando mensajes");
    }
  }, [selectedSala]);

  useEffect(() => {
    if (selectedSala) {
      cargarMensajes(true);
      const interval = setInterval(() => cargarMensajes(false), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedSala, cargarMensajes]);

  // ============= AUTO-SCROLL =============
  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom]);

  // ============= ENVIAR MENSAJE =============
  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || !selectedSala) return;

    try {
      setLoading(true);
      await chatService.enviarMensaje(selectedSala, nuevoMensaje);
      setNuevoMensaje("");
      await cargarMensajes();
    } catch {
      setError("Error enviando mensaje");
    } finally {
      setLoading(false);
    }
  };

  // ============= SELECCIONAR SALA =============
  const handleSeleccionarSala = (sala) => {
    setSelectedSala(sala.id_sala);
    setShouldScrollToBottom(true);
    if (onSelectSala) {
      try { onSelectSala(sala.id_sala); } catch { /* ignore */ }
    }
    if (!embedded) navigate(`/chat/${sala.id_sala}`);
  };

  // ============= UI =============
  return (
    <div className={`chat-container ${embedded ? 'embedded' : ''}`}>
      <div className="chat-wrapper">
        {/* PANEL IZQUIERDO - SALAS */}
        <div className="chat-salas">
          <div className="salas-header">
            <h2>Mensajes</h2>
            <span className="salas-count">{salas.length}</span>
          </div>

          <div className="salas-list">
            {salas.length === 0 ? (
              <div className="salas-empty">
                <p>{embedded ? 'Aún no tienes conversaciones' : 'No tienes conversaciones'}</p>
                <small>
                  {embedded
                    ? 'No has recibido mensajes de clientes todavía.'
                    : 'Inicia una conversación con una tienda'}
                </small>
              </div>
            ) : (
              salas.map((sala) => (
                <div
                  key={sala.id_sala}
                  className={`sala-item ${
                    selectedSala === sala.id_sala ? "active" : ""
                  }`}
                  onClick={() => handleSeleccionarSala(sala)}
                >
                  <div className="sala-info">
                    <h4>{sala.nombre_tienda}</h4>
                    <p className="sala-preview">
                      {sala.ultimo_mensaje?.substring(0, 40) || "Sin mensajes"}
                    </p>
                  </div>
                  {sala.no_leidos > 0 && (
                    <span className="notificacion-badge">{sala.no_leidos}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL DERECHO - CONVERSACIÓN */}
        <div className="chat-conversacion">
          {selectedSala ? (
            <>
              {/* HEADER */}
              <div className="chat-header">
                <h2>
                  {salas.find((s) => s.id_sala === selectedSala)?.nombre_tienda}
                </h2>
              </div>

              {/* MENSAJES */}
              <div className="chat-mensajes">
                {mensajes.length === 0 ? (
                  <div className="mensajes-empty">
                    <p>No hay mensajes</p>
                  </div>
                ) : (
                  mensajes.map((msg) => (
                    <div
                      key={msg.id_mensaje}
                      className={`mensaje ${
                        msg.id_remitente === usuarioActual?.id_usuario
                          ? "propio"
                          : "otro"
                      }`}
                    >
                      <div className="mensaje-body">
                        <p className="mensaje-texto">{msg.mensaje}</p>
                        <span className="mensaje-hora">
                          {new Date(msg.enviado_en).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT */}
              <form onSubmit={handleEnviarMensaje} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  maxLength={500}
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !nuevoMensaje.trim()}>
                  {loading ? "..." : "Enviar"}
                </button>
              </form>

              {error && <div className="error-message">{error}</div>}
            </>
          ) : (
            <div className="chat-empty">
              <p>Selecciona una conversación para empezar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
