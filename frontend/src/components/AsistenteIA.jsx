import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { chatAsistente } from '../services/asistente';
import bookyMascot from '../assets/booky.png';
import bookyHappy from '../assets/Bookyalegre.png';
import bookyThinking from '../assets/Bookypensante.png';

const ASSISTANT_SESSION_PREFIX = 'booky_assistant_session';
const BOOKY_THEME = {
  panel: '#120d12',
  panelSoft: '#1b1217',
  panelMuted: '#22171d',
  brand: '#541223',
  brandDark: '#3b0d19',
  accent: '#7A1E3A',
  accentSoft: '#F4E2E7',
  bubbleUser: '#541223',
  bubbleBot: '#F4E2E7',
  ink: '#2d1018',
  text: '#F5EDF1',
  textMuted: 'rgba(245, 237, 241, 0.7)',
  border: '#E8D5DA',
  panelBg: '#F7EEF1',
};

function getUserPayloadFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  const payload = getUserPayloadFromToken();
  return payload?.sub ? String(payload.sub) : null;
}

function getCurrentUserName() {
  const payload = getUserPayloadFromToken();
  return payload?.nombre || payload?.email || 'Usuario';
}

function buildWelcomeMessages(userName = 'Usuario') {
  return [
    {
      from: 'bot',
      text: userName && userName !== 'Usuario'
        ? `¡Hola ${userName}! Soy Booky, tu compañero lector. ¿En qué puedo ayudarte hoy?`
        : '¡Hola! Soy Booky, tu compañero lector. ¿En qué puedo ayudarte hoy?',
    },
  ];
}

function getSessionTitle(messages = []) {
  const userText = messages.find((message) => message.from === 'user' && message.text)?.text?.trim();
  if (!userText) return 'Nueva conversación';
  return userText.length > 26 ? `${userText.slice(0, 26)}...` : userText;
}

function createSessionEntry(messagesOverride = null) {
  const baseMessages = messagesOverride || buildWelcomeMessages(getCurrentUserName());
  return {
    id: `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: 'Nueva conversación',
    updatedAt: Date.now(),
    messages: baseMessages,
  };
}

function getStoredSessions(userId = null) {
  try {
    const key = `${ASSISTANT_SESSION_PREFIX}_history_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredSessions(sessions = [], userId = null) {
  localStorage.setItem(`${ASSISTANT_SESSION_PREFIX}_history_${userId || 'guest'}`, JSON.stringify(sessions));
}

const isAssistantGreeting = (text = '') => {
  const normalized = text.trim().toLowerCase();
  // Solo detecta mensajes de bienvenida específicos del asistente, no mensajes generales del usuario
  return (normalized.includes('soy booky') && normalized.includes('tu compañero lector'))
    || (normalized.includes('¡hola') && normalized.includes('soy booky'))
    || (normalized.includes('bienvenido a bookyhome') && normalized.includes('puedes explorar'))
    || (normalized.includes('puedo ayudarte a conocer bookyhome'));
};

const sanitizeMessages = (messages = []) => {
  if (!Array.isArray(messages)) return [];

  const cleaned = messages.filter((message) => {
    if (!message || typeof message.text !== 'string') return false;
    if (message.from === 'bot' && isAssistantGreeting(message.text)) return false;
    return message.text.trim().length > 0;
  });

  // Si quedan mensajes tras filtrar, devolvemos esos.
  // Si no queda nada (solo había el saludo del bot), devolvemos el array original
  // para que getSessionTitle pueda leer el mensaje del usuario y actualizar el título.
  return cleaned.length > 0 ? cleaned : messages.filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0);
};

const toApiHistory = (messages) => sanitizeMessages(messages)
  .filter((message) => {
    if (message.from === 'user') return true;
    if (message.from === 'bot') return !isAssistantGreeting(message.text || '');
    return false;
  })
  .map((message) => ({
    rol: message.from === 'user' ? 'user' : 'assistant',
    contenido: message.text,
  }));

// Gemini suele responder con Markdown. Este formato pequeño evita mostrar los
// asteriscos al usuario sin añadir una dependencia extra al proyecto.
function renderInlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    return bold ? <strong key={index}>{bold[1]}</strong> : <Fragment key={index}>{part}</Fragment>;
  });
}

function MessageContent({ text }) {
  return (
    <div>
      {text.split('\n').map((line, index) => {
        const bullet = line.match(/^\s*[-*]\s+(.+)$/);
        const numbered = line.match(/^\s*(\d+)\.\s+(.+)$/);

        if (bullet) {
          return <div key={index} style={{ display: 'flex', gap: 7, marginTop: index ? 5 : 0 }}><span aria-hidden="true">•</span><span>{renderInlineMarkdown(bullet[1])}</span></div>;
        }
        if (numbered) {
          return <div key={index} style={{ display: 'flex', gap: 7, marginTop: index ? 5 : 0 }}><strong>{numbered[1]}.</strong><span>{renderInlineMarkdown(numbered[2])}</span></div>;
        }
        return line ? <div key={index} style={{ marginTop: index ? 5 : 0 }}>{renderInlineMarkdown(line)}</div> : <div key={index} style={{ height: 6 }} />;
      })}
    </div>
  );
}

export default function AsistenteIA() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const userId = getCurrentUserId();
    const sessions = getStoredSessions(userId);
    return sessions[0]?.id || 'default';
  });
  const [sessions, setSessions] = useState(() => {
    const userId = getCurrentUserId();
    const stored = getStoredSessions(userId);
    if (stored.length > 0) return stored;

    const welcome = buildWelcomeMessages(getCurrentUserName());
    const firstSession = { id: 'default', title: 'Nueva conversación', updatedAt: Date.now(), messages: welcome };
    saveStoredSessions([firstSession], userId);
    return [firstSession];
  });
  const [messages, setMessages] = useState(() => {
    const userId = getCurrentUserId();
    const storedSessions = getStoredSessions(userId);
    const activeId = localStorage.getItem(`${ASSISTANT_SESSION_PREFIX}_active_id_${userId || 'guest'}`) || storedSessions[0]?.id || 'default';
    const session = storedSessions.find((item) => item.id === activeId) || storedSessions[0];
    const sanitized = sanitizeMessages(session?.messages);
    return sanitized.length > 0 ? sanitized : buildWelcomeMessages(getCurrentUserName());
  });
  const [loading, setLoading] = useState(false);
  const [showHappy, setShowHappy] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mascotPosition, setMascotPosition] = useState(null);
  const dragStart = useRef(null);
  const dragged = useRef(false);

  useEffect(() => {
    const syncSession = () => {
      const currentUserId = getCurrentUserId();
      const storedSessions = getStoredSessions(currentUserId).map((session) => ({
        ...session,
        messages: sanitizeMessages(session.messages),
      }));
      const activeId = localStorage.getItem(`${ASSISTANT_SESSION_PREFIX}_active_id_${currentUserId || 'guest'}`) || storedSessions[0]?.id || 'default';
      const activeSession = storedSessions.find((entry) => entry.id === activeId) || storedSessions[0];

      const sanitizedMessages = sanitizeMessages(activeSession?.messages);
      setMessages(sanitizedMessages.length > 0 ? sanitizedMessages : buildWelcomeMessages(getCurrentUserName()));

      if (storedSessions.length > 0) {
        setSessions(storedSessions);
        setActiveSessionId(activeId);
      }
    };

    syncSession();
    window.addEventListener('auth-change', syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener('auth-change', syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    const cleanMessages = sanitizeMessages(messages);

    setSessions((prevSessions) => {
      const currentSessionExists = prevSessions.some((session) => session.id === activeSessionId);
      if (!currentSessionExists) {
        localStorage.setItem(`${ASSISTANT_SESSION_PREFIX}_active_id_${currentUserId || 'guest'}`, activeSessionId);
        return prevSessions;
      }

      const nextSessions = prevSessions.map((session) => {
        if (session.id !== activeSessionId) return session;
        return { ...session, messages: cleanMessages, title: getSessionTitle(cleanMessages), updatedAt: Date.now() };
      });

      saveStoredSessions(nextSessions, currentUserId);
      localStorage.setItem(`${ASSISTANT_SESSION_PREFIX}_active_id_${currentUserId || 'guest'}`, activeSessionId);
      return nextSessions;
    });
  }, [messages, activeSessionId]);

  const openSession = (sessionId) => {
    const nextSession = sessions.find((session) => session.id === sessionId);
    if (!nextSession) return;
    setActiveSessionId(sessionId);
    setMessages(nextSession.messages || buildWelcomeMessages(getCurrentUserName()));
    localStorage.setItem(`${ASSISTANT_SESSION_PREFIX}_active_id_${getCurrentUserId() || 'guest'}`, sessionId);
  };

  const createNewSession = () => {
    const userId = getCurrentUserId();
    const welcome = buildWelcomeMessages(getCurrentUserName());
    const entry = createSessionEntry(welcome);
    const nextSessions = [entry, ...sessions];
    setSessions(nextSessions);
    setActiveSessionId(entry.id);
    setMessages(welcome);
    saveStoredSessions(nextSessions, userId);
    localStorage.setItem(`${ASSISTANT_SESSION_PREFIX}_active_id_${userId || 'guest'}`, entry.id);
  };

  const deleteSession = (sessionId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setSessions((prevSessions) => {
      const remaining = prevSessions.filter((session) => session.id !== sessionId);

      if (remaining.length === 0) {
        const userId = getCurrentUserId();
        const welcome = buildWelcomeMessages(getCurrentUserName());
        const emptySession = createSessionEntry(welcome);
        const fallbackSessions = [emptySession];
        setActiveSessionId(emptySession.id);
        setMessages(welcome);
        saveStoredSessions(fallbackSessions, userId);
        localStorage.setItem(`${ASSISTANT_SESSION_PREFIX}_active_id_${userId || 'guest'}`, emptySession.id);
        return fallbackSessions;
      }

      const ordered = [...remaining].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      const nextActive = ordered[0];
      setActiveSessionId(nextActive.id);
      setMessages(nextActive.messages || buildWelcomeMessages(getCurrentUserName()));
      saveStoredSessions(ordered, getCurrentUserId());
      localStorage.setItem(`${ASSISTANT_SESSION_PREFIX}_active_id_${getCurrentUserId() || 'guest'}`, nextActive.id);
      return ordered;
    });
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const texto = input.trim();
    if (!texto || loading) return;

    const cleanedMessages = sanitizeMessages(messages);
    setMessages((prev) => [...sanitizeMessages(prev), { from: 'user', text: texto }]);
    setInput('');
    setLoading(true);
    setShowHappy(false);

    try {
      const { data } = await chatAsistente({
        mensaje: texto,
        pagina: location.pathname,
        historial: toApiHistory(cleanedMessages),
      });
      setMessages((prev) => [...sanitizeMessages(prev), { from: 'bot', text: data.respuesta }]);
      setShowHappy(true);
    } catch {
      setMessages((prev) => [
        ...sanitizeMessages(prev),
        {
          from: 'bot',
          text: 'No pude responder en este momento. Inténtalo de nuevo en unos segundos.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const headerMascot = loading ? bookyThinking : (showHappy ? bookyHappy : bookyMascot);
  const chatPosition = mascotPosition ? {
    position: 'fixed',
    left: Math.max(12, Math.min(mascotPosition.x - 278, window.innerWidth - 372)),
    top: Math.max(12, Math.min(mascotPosition.y - 472, window.innerHeight - 472)),
  } : {};

  const handleDragStart = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragStart.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, initialX: event.clientX, initialY: event.clientY };
    dragged.current = false;
    event.preventDefault();
    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd, { once: true });
    window.addEventListener('pointercancel', handleDragEnd, { once: true });
  };

  const handleDragMove = (event) => {
    if (!dragStart.current) return;
    const { offsetX, offsetY, initialX, initialY } = dragStart.current;
    const x = Math.max(8, Math.min(event.clientX - offsetX, window.innerWidth - 90));
    const y = Math.max(8, Math.min(event.clientY - offsetY, window.innerHeight - 90));
    if (Math.abs(event.clientX - initialX) > 4 || Math.abs(event.clientY - initialY) > 4) dragged.current = true;
    setMascotPosition({ x, y });
  };

  const handleDragEnd = () => {
    dragStart.current = null;
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', handleDragEnd);
    window.removeEventListener('pointercancel', handleDragEnd);
  };

  return (
    <div style={{ position: 'fixed', right: mascotPosition ? 'auto' : 20, bottom: mascotPosition ? 'auto' : 20, left: mascotPosition?.x, top: mascotPosition?.y, zIndex: 9999 }}>
      <style>{`
        @keyframes booky-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(2deg); }
        }
        @keyframes booky-thinking {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.06); }
        }
        @keyframes booky-dots {
          0%, 20% { opacity: .25; }
          50% { opacity: 1; }
          100% { opacity: .25; }
        }
        .booky-mascot-idle { animation: booky-float 2.8s ease-in-out infinite; }
        .booky-mascot-thinking { animation: booky-thinking 0.75s ease-in-out infinite; }
        .booky-thinking-dots span { animation: booky-dots 1.2s infinite; }
        .booky-thinking-dots span:nth-child(2) { animation-delay: .18s; }
        .booky-thinking-dots span:nth-child(3) { animation-delay: .36s; }
        @media (prefers-reduced-motion: reduce) {
          .booky-mascot-idle, .booky-mascot-thinking, .booky-thinking-dots span { animation: none; }
        }
      `}</style>
      {!open && (
        <button
          type="button"
          onClick={() => { if (!dragged.current) setOpen(true); }}
          onPointerDown={handleDragStart}
          style={{
            width: 82,
            height: 82,
            padding: 0,
            border: 'none',
            background: 'transparent',
            boxShadow: 'none',
            cursor: 'pointer',
            touchAction: 'none',
          }}
          aria-label="Abrir asistente Booky"
        >
          <img className="booky-mascot-idle" src={bookyMascot} alt="Booky, mascota de BookyHome" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 5px 7px rgba(64,18,28,0.22))' }} />
        </button>
      )}

      {open && (
        <div
          style={{
            ...chatPosition,
            width: 520,
            maxWidth: '92vw',
            height: 470,
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 20px 45px rgba(0,0,0,0.22)',
            border: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <aside
            style={{
              width: sidebarCollapsed ? 54 : 170,
              background: BOOKY_THEME.brandDark,
              color: BOOKY_THEME.text,
              padding: sidebarCollapsed ? '10px 8px' : '10px 8px 10px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'width 0.2s ease',
              borderRight: `1px solid rgba(255,255,255,0.08)`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingRight: sidebarCollapsed ? 0 : 6 }}>
              {!sidebarCollapsed && <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3, color: BOOKY_THEME.accentSoft }}>Sesiones</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    border: `1px solid rgba(244,226,231,0.25)`,
                    background: 'rgba(244,226,231,0.1)',
                    color: BOOKY_THEME.accentSoft,
                    fontSize: 14,
                    lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={sidebarCollapsed ? 'Expandir sesiones' : 'Colapsar sesiones'}
                >
                  {sidebarCollapsed ? '›' : '‹'}
                </button>
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={createNewSession}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      border: `1px solid rgba(244,226,231,0.25)`,
                      background: 'rgba(244,226,231,0.1)',
                      color: BOOKY_THEME.accentSoft,
                      fontSize: 18,
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                    aria-label="Nueva sesión"
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {!sidebarCollapsed && (
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sessions.map((session) => (
                  <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => openSession(session.id)}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        border: 'none',
                        borderRadius: 10,
                        background: session.id === activeSessionId ? BOOKY_THEME.accent : 'rgba(244,226,231,0.07)',
                        color: BOOKY_THEME.text,
                        padding: '8px 8px',
                        cursor: 'pointer',
                        opacity: session.id === activeSessionId ? 1 : 0.75,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: 12,
                      }}
                    >
                      {session.title || 'Nueva conversación'}
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => deleteSession(session.id, event)}
                      aria-label={`Eliminar sesión ${session.title || 'Nueva conversación'}`}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        border: `1px solid rgba(244,226,231,0.18)`,
                        background: 'rgba(244,226,231,0.07)',
                        color: BOOKY_THEME.accentSoft,
                        cursor: 'pointer',
                        fontSize: 14,
                        lineHeight: 1,
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #3b0d19 0%, #541223 45%, #7A1E3A 100%)',
                color: '#fff',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 700,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img className={loading ? 'booky-mascot-thinking' : ''} src={headerMascot} alt="" aria-hidden="true" style={{ width: 42, height: 42, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 3px 4px rgba(64,18,28,0.2))' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span>Booky</span>
                  <small style={{ fontSize: 11, fontWeight: 500, opacity: 0.86 }}>Tu compañero lector</small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: 24,
                  cursor: 'pointer',
                }}
                aria-label="Cerrar asistente"
              >
                ×
              </button>
            </div>

            <div
              style={{
                flex: 1,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: '#F8F0F3',
                overflowY: 'auto',
              }}
            >
              {messages.map((message, idx) => (
                <div
                  key={`${message.from}-${idx}`}
                  style={{
                    alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 6,
                  }}
                >
                  {message.from === 'bot' && <img src={showHappy && idx === messages.length - 1 ? bookyHappy : bookyMascot} alt="" aria-hidden="true" style={{ width: 32, height: 32, objectFit: 'contain', display: 'block', flexShrink: 0, filter: 'drop-shadow(0 2px 3px rgba(64,18,28,0.18))' }} />}
                  <div style={{ background: message.from === 'user' ? BOOKY_THEME.bubbleUser : BOOKY_THEME.bubbleBot, color: message.from === 'user' ? '#fff' : '#3E1721', padding: '10px 12px', borderRadius: 14, lineHeight: 1.4 }}>
                    <MessageContent text={message.text} />
                  </div>
                </div>
              ))}

              {loading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: BOOKY_THEME.bubbleBot,
                    color: '#3E1721',
                    padding: '10px 12px',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <img className="booky-mascot-thinking" src={bookyThinking} alt="" aria-hidden="true" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                  <span>Booky está pensando<span className="booky-thinking-dots"><span>.</span><span>.</span><span>.</span></span></span>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} style={{ borderTop: '1px solid #E8D5DA', padding: 12, display: 'flex', gap: 8, background: '#fff' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta sobre BookyHome..."
                style={{
                  flex: 1,
                  border: '1px solid #D9B6C0',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 14,
                  outline: 'none',
                  background: '#fff',
                  color: '#2d1018',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  border: 'none',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #3b0d19 0%, #541223 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '10px 14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
