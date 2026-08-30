// src/pages/Chat.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../hooks/useAuth";
import { chatService } from "../services/chat";
import { jwtDecode } from "jwt-decode";
import { IconSearch } from "../components/Icons";
import { notify } from "../components/ToastProvider";
import "../styles/Chat.css";
import axios from 'axios';

const WS_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/^http/, "ws");

// Indicador de los 4 estados estilo WhatsApp: Relojito -> 1 Chulo -> 2 Chulos grises -> 2 Chulos rosados
function MessageCheckmark({ msg }) {
  if (msg.pendiente) {
    return (
      <span className="msg-checkmarks pendiente" title="Enviando...">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </span>
    );
  }

  const esLeido = Boolean(msg.mensaje_leido) && (msg.mensaje_leido === true || msg.mensaje_leido === 1 || msg.mensaje_leido === "1");

  if (esLeido) {
    return (
      <span className="msg-checkmarks leido" title="Visto">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 5.5L5 9.5L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 5.5L9 9.5L15 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  const esEntregado = msg.entregado === true || msg.entregado === 1 || msg.entregado === "1";

  if (esEntregado) {
    return (
      <span className="msg-checkmarks entregado" title="Entregado">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 5.5L5 9.5L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 5.5L9 9.5L15 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  return (
    <span className="msg-checkmarks enviado" title="Enviado">
      <svg width="13" height="11" viewBox="0 0 16 11" fill="none">
        <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// Componente individual e interactivo de nota de voz estilo WhatsApp
function VoiceNoteBubble({
  msg,
  esPropio,
  usuarioActual,
  duracionTexto,
  audioUrl,
  durSegundos,
  formatHora,
  getIniciales,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const animRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const fotoRemitente = esPropio ? usuarioActual?.foto_perfil : msg.foto_remitente;
  const fotoUrl = fotoRemitente
    ? fotoRemitente.startsWith("http")
      ? fotoRemitente
      : `${apiBase}/${fotoRemitente.replace(/^\//, "")}`
    : null;
  const nombreAvatar = esPropio
    ? usuarioActual?.nombre_usuario || "Yo"
    : msg.nombre_remitente || "U";

  const TOTAL_BARS = 36;
  const waveHeights = [
    4, 8, 14, 10, 20, 16, 26, 12, 22, 18, 24, 10, 16, 8, 22, 14, 26, 10,
    20, 16, 24, 12, 18, 8, 20, 16, 26, 10, 22, 14, 18, 10, 24, 8, 16, 6
  ];

  const durTotal = Math.max(durSegundos || 4, 1);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (animRef.current) clearInterval(animRef.current);
      setIsPlaying(false);
    } else {
      // Pausar cualquier otro elemento de audio en la página
      document.querySelectorAll("audio").forEach((a) => {
        if (a !== audioRef.current) {
          a.pause();
          a.currentTime = 0;
        }
      });

      if (!audioRef.current && audioUrl) {
        audioRef.current = new Audio(audioUrl);
      }

      setIsPlaying(true);

      if (audioRef.current) {
        audioRef.current.currentTime = (progress / 100) * durTotal;
        audioRef.current.play().catch((err) => {
          console.warn("Audio play warning:", err);
        });

        audioRef.current.onended = () => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
          if (animRef.current) clearInterval(animRef.current);
        };
      }

      // Intervalo súper fluido a 50ms para mover el scrubber y las barras
      if (animRef.current) clearInterval(animRef.current);
      animRef.current = setInterval(() => {
        if (audioRef.current) {
          const cur = audioRef.current.currentTime || 0;
          if (cur >= durTotal || audioRef.current.ended) {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            clearInterval(animRef.current);
            return;
          }
          setCurrentTime(Math.floor(cur));
          setProgress(Math.min(100, Math.max(0, (cur / durTotal) * 100)));
        } else {
          setIsPlaying(false);
          if (animRef.current) clearInterval(animRef.current);
        }
      }, 50);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
    setProgress(newProgress);
    const newTime = (newProgress / 100) * durTotal;
    setCurrentTime(Math.floor(newTime));
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  const formatTiempo = (seg) => {
    const min = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${min}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="audio-player-widget">
      {/* 1. Avatar con foto de perfil en la IZQUIERDA (Estilo WhatsApp) */}
      <div className="audio-bubble-avatar">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={nombreAvatar}
            className="audio-avatar-img"
            onError={(e) => {
              e.target.style.display = "none";
              const fallback = e.target.parentElement.querySelector(".audio-avatar-fallback");
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}
        <span
          className="audio-avatar-fallback"
          style={{ display: fotoUrl ? "none" : "flex" }}
        >
          {getIniciales(nombreAvatar)}
        </span>
        <span className="mic-badge-small" title="Nota de voz">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFAEC0" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </span>
      </div>

      {/* 2. Botón Play/Pause */}
      <button
        type="button"
        className={`audio-play-toggle-btn ${isPlaying ? "playing" : ""}`}
        onClick={togglePlay}
        title={isPlaying ? "Pausar nota de voz" : "Reproducir nota de voz"}
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1.5" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        )}
      </button>

      {/* 3. Onda de Audio con Scrubber Interactivo */}
      <div className="audio-track-container">
        <div className="audio-waveform-wrapper" onClick={handleSeek} style={{ cursor: "pointer" }}>
          <div className="audio-waveform-bars">
            {waveHeights.map((h, barIdx) => {
              const barPct = (barIdx / (TOTAL_BARS - 1)) * 100;
              const isPlayed = progress >= barPct;
              return (
                <span
                  key={barIdx}
                  className={`audio-wave-bar ${isPlayed ? "filled" : ""}`}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>
          <span
            className="audio-scrubber-thumb"
            style={{ left: `${Math.min(98, Math.max(2, progress))}%` }}
          />
        </div>

        <div className="audio-meta-row">
          <span className="audio-time-label">
            {isPlaying ? formatTiempo(currentTime) : duracionTexto}
          </span>
          <div className="audio-hora-check">
            <span className="mensaje-hora">
              {formatHora(msg.enviado_en)}
            </span>
            {esPropio && <MessageCheckmark msg={msg} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Detector y convertidor de banderas Unicode a código ISO para soporte 100% en Windows
function getFlagCountryCode(str) {
  if (!str) return null;
  const chars = Array.from(str);
  if (chars.length === 2) {
    const cp1 = chars[0].codePointAt(0);
    const cp2 = chars[1].codePointAt(0);
    if (cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF && cp2 >= 0x1F1E6 && cp2 <= 0x1F1FF) {
      const char1 = String.fromCharCode(cp1 - 0x1F1E6 + 65);
      const char2 = String.fromCharCode(cp2 - 0x1F1E6 + 65);
      return (char1 + char2).toLowerCase();
    }
  }
  return null;
}

// Convierte un emoji unicode a su URL en Twemoji CDN (coloridos y modernos)
function getEmojiImageUrl(emoji) {
  const codePoints = [...emoji]
    .filter(c => c.codePointAt(0) !== 0xFE0F) // quitar variation selector
    .map(c => c.codePointAt(0).toString(16).padStart(4, '0'));
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints.join('-')}.svg`;
}

function RenderEmoji({ emoji, size = 22 }) {
  const code = getFlagCountryCode(emoji);
  if (code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        alt={emoji}
        width={Math.round(size * 1.15)}
        height={Math.round(size * 0.8)}
        style={{ borderRadius: "2px", objectFit: "cover", verticalAlign: "middle", boxShadow: "0 1px 2px rgba(0,0,0,0.3)", display: "inline-block" }}
      />
    );
  }
  return (
    <img
      src={getEmojiImageUrl(emoji)}
      alt={emoji}
      width={size}
      height={size}
      style={{ verticalAlign: "middle", display: "inline-block", imageRendering: "auto" }}
      loading="lazy"
      onError={(e) => { e.target.style.display = "none"; e.target.insertAdjacentText("afterend", emoji); }}
    />
  );
}

// Categorías completas de emojis estilo WhatsApp
const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    icon: "😃",
    name: "Emoticonos y personas",
    emojis: [
      "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","🥹","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😮‍💨","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫣","🤭","🫢","🫡","🤫","🫠","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","👽","🤖","🎃","👍","👎","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦿","🦶","👂","🦻","👃","🫀","🫁","🧠","🥷","🦸","🦹","🧙","🧚","🧛","🧜","🧝","🧞","🧟","🫂","💃","🕺"
    ]
  },
  {
    id: "animals",
    icon: "🐶",
    name: "Animales y naturaleza",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁","🍄","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻"
    ]
  },
  {
    id: "food",
    icon: "☕",
    name: "Comida y bebida",
    emojis: [
      "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","🫖","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊"
    ]
  },
  {
    id: "activities",
    icon: "⚽",
    name: "Actividades",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"
    ]
  },
  {
    id: "travel",
    icon: "🚗",
    name: "Viajes y lugares",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🦯","🦽","🦼","🛴","🚲","🛵","🏍️","🛺","🚨","🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩️","💺","🛰️","🚀","🛸","🚁","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢","⚓","🛟","🪝","⛽","🚧","🚦","🚥","🗺️","🗿","🗽","🗼","🏰","🏯","🏟️","🎡","🎢","🎠","⛲","🏖️","🏝️","🏜️","🌋","⛰️","🏔️","🏕️","⛺","🏠","🏡","🏘️","🏚️","🏗️","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏩","💒","🏛️","⛪","🕌","🛕","🕍","⛩️","🕋"
    ]
  },
  {
    id: "objects",
    icon: "💡",
    name: "Objetos",
    emojis: [
      "💡","🔦","🏮","🪔","🧱","🪵","🪨","🪙","💵","💴","💶","💷","💰","💳","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️","🚬","⚰️","🪦","⚱️","🏺","🔮","📿","🧿","💈","🧪","🧫","🧬","🔬","🔭","📡","💉","🩸","💊","🩹","🩺","🩻","🚪","🛗","🪞","🪟","🛏️","🛋️","🪑","🚽","🪠","🚿","🛁","🪒","🧴","🧷","🧹","🧺","🧻","🪣","🧼","🪥","🧽","🧯","🛒","🎁","🎈","🎏","🎀","🪄","🪅","🎊","🎉","🎎","🎐","✉️","📩","📨","📧","💌","📬","📭","📮","📦","🏷️","📜","📃","📄","📁","📂","🗂️","📅","📆","🗓️","📇","📈","📉","📊","📋","📌","📍","📎","🖇️","📏","📐","✂️","🗃️","🗄️","🗑️","🔒","🔓","🔏","🔐","🔑","🗝️"
    ]
  },
  {
    id: "symbols",
    icon: "🔣",
    name: "Símbolos",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","VS","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🈳","🈂️","🛂","🛃","🛄","🛅","🚹","🚺","🚼","⚧️","🚻","🚮","🎦","📶","🈁","🆖","🆗","🆙","🆒","NEW","FREE","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","▶️","⏩","⏭️","⏯️","◀️","⏪","⏮️","🔼","⏫","🔽","⏬","⏸️","⏹️","⏺️","⏏️","📯","🔔","🔕","📣","📢","👁️‍🗨️","💬","💭","🗯️","♠️","♣️","♥️","♦️","🃏","🎴","🀄","🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚","🕛","🕜","🕝","🕞","🕟","🕠","🕡","🕢","🕣","🕤","🕥","🕦","🕧"
    ]
  },
  {
    id: "flags",
    icon: "🚩",
    name: "Banderas",
    emojis: [
      "🏁","🚩","🎌","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️",
      "🇨🇴","🇲🇽","🇦🇷","🇪🇸","🇺🇸","🇧🇷","🇨🇱","🇵🇪","🇪🇨","🇻🇪",
      "🇺🇾","🇵🇾","🇧🇴","🇨🇷","🇵🇦","🇩🇴","🇬🇹","🇭🇳","🇸🇻","🇳🇮",
      "🇨🇦","🇫🇷","🇩🇪","🇮🇹","🇬🇧","🇯🇵","🇰🇷","🇨🇳","🇮🇳","🇵🇹",
      "🇷🇺","🇳🇱","🇧🇪","🇨🇭","🇸🇪","🇳🇴","🇩🇰","🇦🇺","🇳🇿","🇨🇺",
      "🇵🇷","🇿🇦","🇪🇬","🇸🇦","🇦🇪","🇮🇱","🇹🇷","🇬🇷","🇮🇪","🇵🇱",
      "🇦🇹","🇯🇲","🇭🇹","🇵🇭","🇲🇾","🇸🇬","🇹🇭","🇻🇳","🇮🇩","🇯🇴"
    ]
  }
];

// Modal completo estilo WhatsApp para elegir cualquier reacción
function ReactionPickerModal({ idMensaje, onClose, onSelectEmoji }) {
  const [activeTab, setActiveTab] = useState("recientes");
  const [searchTerm, setSearchTerm] = useState("");
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try {
      const stored = localStorage.getItem("bkh_recent_reactions");
      return stored ? JSON.parse(stored) : ["😂", "❤️", "👍", "🇨🇴", "😮", "😢", "🙏", "🔥", "🎉", "👏", "😍", "✨", "💯"];
    } catch {
      return ["😂", "❤️", "👍", "🇨🇴", "😮", "😢", "🙏"];
    }
  });

  const scrollContainerRef = useRef(null);
  const categoryRefs = useRef({});

  const handlePickEmoji = (emoji) => {
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 32);
    setRecentEmojis(updated);
    try {
      localStorage.setItem("bkh_recent_reactions", JSON.stringify(updated));
    } catch (e) {}
    onSelectEmoji(idMensaje, emoji);
    onClose();
  };

  const scrollToCategory = (catId) => {
    setActiveTab(catId);
    if (categoryRefs.current[catId]) {
      categoryRefs.current[catId].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredCategories = searchTerm.trim()
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(searchTerm.trim())),
      })).filter((cat) => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  return (
    <div className="reaction-modal-backdrop" onClick={onClose}>
      <div className="reaction-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Barra superior de pestañas */}
        <div className="reaction-modal-tabs">
          <button
            type="button"
            className={`reaction-tab-btn ${activeTab === "recientes" ? "active" : ""}`}
            onClick={() => scrollToCategory("recientes")}
            title="Recientes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`reaction-tab-btn ${activeTab === cat.id ? "active" : ""}`}
              onClick={() => scrollToCategory(cat.id)}
              title={cat.name}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>{cat.icon}</span>
            </button>
          ))}
        </div>

        {/* Buscador de reacciones */}
        <div className="reaction-modal-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Busca una reacción"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button type="button" className="reaction-search-clear" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>

        {/* Listado con scroll de categorías y emojis */}
        <div className="reaction-modal-scroll" ref={scrollContainerRef}>
          {!searchTerm && recentEmojis.length > 0 && (
            <div
              className="reaction-category-section"
              ref={(el) => (categoryRefs.current["recientes"] = el)}
            >
              <h4 className="reaction-category-title">Reacciones recientes</h4>
              <div className="reaction-emoji-grid">
                {recentEmojis.map((emoji, idx) => (
                  <button
                    key={`rec_${idx}`}
                    type="button"
                    className="reaction-picker-emoji-btn"
                    onClick={() => handlePickEmoji(emoji)}
                  >
                    <RenderEmoji emoji={emoji} size={24} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="reaction-category-section"
              ref={(el) => (categoryRefs.current[cat.id] = el)}
            >
              <h4 className="reaction-category-title">{cat.name}</h4>
              <div className="reaction-emoji-grid">
                {cat.emojis.map((emoji, idx) => (
                  <button
                    key={`${cat.id}_${idx}`}
                    type="button"
                    className="reaction-picker-emoji-btn"
                    onClick={() => handlePickEmoji(emoji)}
                  >
                    <RenderEmoji emoji={emoji} size={24} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Panel completo de emojis / GIFs / Stickers estilo WhatsApp Web para el input
function ChatEmojiPickerTray({ onSelectEmoji, onClose, config }) {
  const [activeBottomTab, setActiveBottomTab] = useState("emojis"); // "emojis" | "gifs" | "stickers"
  const [activeCat, setActiveCat] = useState("smileys");
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef(null);
  const catSectionRefs = useRef({});

  const sampleGifs = [
    { id: "g1", title: "Thumbs Up", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
    { id: "g2", title: "Celebration", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif" },
    { id: "g3", title: "Reading Book", url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif" },
    { id: "g4", title: "Mind Blown", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" },
    { id: "g5", title: "Happy Dance", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
    { id: "g6", title: "Thank You", url: "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif" },
  ];

  const sampleStickers = [
    { id: "s1", emoji: "📚", label: "Libros", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4da.svg" },
    { id: "s2", emoji: "🔥", label: "Fuego", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f525.svg" },
    { id: "s3", emoji: "✨", label: "Brillos", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2728.svg" },
    { id: "s4", emoji: "❤️", label: "Amor", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2764.svg" },
    { id: "s5", emoji: "🎉", label: "Fiesta", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f389.svg" },
    { id: "s6", emoji: "☕", label: "Café", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2615.svg" },
    { id: "s7", emoji: "💯", label: "100%", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4af.svg" },
    { id: "s8", emoji: "🌸", label: "Flor", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f338.svg" },
  ];

  // Desplazamiento preciso dentro del contenedor interno sin saltar la página
  const scrollToCat = (catId) => {
    setActiveCat(catId);
    const container = scrollRef.current;
    const target = catSectionRefs.current[catId];
    if (container && target) {
      container.scrollTo({
        top: target.offsetTop,
        behavior: "smooth"
      });
    }
  };

  // Sincronizar la categoría activa al scrollear manualmente
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || searchTerm.trim()) return;
    const scrollPos = container.scrollTop + 30;
    for (const cat of EMOJI_CATEGORIES) {
      const el = catSectionRefs.current[cat.id];
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (scrollPos >= top && scrollPos < bottom) {
          setActiveCat(cat.id);
          break;
        }
      }
    }
  };

  const filteredCategories = searchTerm.trim()
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(searchTerm.trim())),
      })).filter((cat) => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  const bubbleTheme = config?.temaBurbujas || "bookyhome";
  const fondoTheme = config?.fondo || "beige_dots";

  return (
    <div
      className={`chat-emoji-tray theme-bubble-${bubbleTheme} theme-fondo-${fondoTheme}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Barra superior de categorías (solo en modo Emojis) */}
      {activeBottomTab === "emojis" && (
        <div className="chat-emoji-tray-header">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`chat-emoji-tray-cat-btn ${activeCat === cat.id ? "active" : ""}`}
              onClick={() => scrollToCat(cat.id)}
              title={cat.name}
            >
              <RenderEmoji emoji={cat.icon} size={20} />
            </button>
          ))}
        </div>
      )}

      {/* 2. Buscador estilo WhatsApp */}
      <div className="chat-emoji-tray-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={activeBottomTab === "emojis" ? "Buscar emoji" : activeBottomTab === "gifs" ? "Buscar GIF..." : "Buscar sticker..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button type="button" className="chat-emoji-tray-clear" onClick={() => setSearchTerm("")}>
            ✕
          </button>
        )}
      </div>

      {/* 3. Contenido principal con scroll */}
      <div className="chat-emoji-tray-body" ref={scrollRef} onScroll={handleScroll}>
        {activeBottomTab === "emojis" && (
          <>
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="chat-emoji-tray-section"
                ref={(el) => (catSectionRefs.current[cat.id] = el)}
              >
                <h4 className="chat-emoji-tray-section-title">{cat.name}</h4>
                <div className="chat-emoji-tray-grid">
                  {cat.emojis.map((emoji, idx) => (
                    <button
                      key={`${cat.id}_${idx}`}
                      type="button"
                      className="chat-emoji-tray-btn"
                      title={emoji}
                      onClick={() => onSelectEmoji(emoji)}
                    >
                      <RenderEmoji emoji={emoji} size={26} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {activeBottomTab === "gifs" && (
          <div className="chat-emoji-tray-gifs-grid">
            {sampleGifs.map((g) => (
              <div
                key={g.id}
                className="chat-emoji-tray-gif-card"
                onClick={() => {
                  onSelectEmoji(`[GIF: ${g.url}]`);
                  if (onClose) onClose();
                }}
              >
                <img src={g.url} alt={g.title} loading="lazy" />
                <span>{g.title}</span>
              </div>
            ))}
          </div>
        )}

        {activeBottomTab === "stickers" && (
          <div className="chat-emoji-tray-stickers-grid">
            {sampleStickers.map((s) => (
              <button
                key={s.id}
                type="button"
                className="chat-emoji-tray-sticker-item"
                title={s.label}
                onClick={() => {
                  onSelectEmoji(s.emoji);
                  if (onClose) onClose();
                }}
              >
                <img src={s.url} alt={s.label} width={46} height={46} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Barra inferior de pestañas [😃, GIF, 🏷️] */}
      <div className="chat-emoji-tray-footer">
        <div className="chat-emoji-tray-pills">
          <button
            type="button"
            className={`chat-emoji-tray-pill ${activeBottomTab === "emojis" ? "active" : ""}`}
            onClick={() => setActiveBottomTab("emojis")}
            title="Emojis"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
          <button
            type="button"
            className={`chat-emoji-tray-pill ${activeBottomTab === "gifs" ? "active" : ""}`}
            onClick={() => setActiveBottomTab("gifs")}
            title="GIFs"
          >
            <span style={{ fontSize: "11.5px", fontWeight: 800, letterSpacing: "0.5px" }}>GIF</span>
          </button>
          <button
            type="button"
            className={`chat-emoji-tray-pill ${activeBottomTab === "stickers" ? "active" : ""}`}
            onClick={() => setActiveBottomTab("stickers")}
            title="Stickers"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6l-8-12z" />
              <path d="M14 2v6h6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Configuración y Personalización del Chat
function ChatSettingsModal({ config, setConfig, onClose }) {
  const [activeTab, setActiveTab] = useState("apariencia"); // "apariencia" | "salas" | "burbujas" | "texto" | "general"

  const fondos = [
    { id: "beige_dots", nombre: "Clásico BookyHome", color: "#EFEAE2", desc: "Beige con textura punteada" },
    { id: "dark", nombre: "Modo Oscuro", color: "#0B141A", desc: "Fondo oscuro profundo" },
    { id: "rose", nombre: "Rosa Pastel", color: "#FDF2F4", desc: "Tono suave de la marca" },
    { id: "mint", nombre: "Verde Menta", color: "#E6F4EA", desc: "Fresco y relajante" },
    { id: "slate", nombre: "Gris Slate", color: "#F1F5F9", desc: "Neutro y minimalista" },
    { id: "pure_white", nombre: "Blanco Puro", color: "#FFFFFF", desc: "Limpio sin distracciones" },
  ];

  const temasBurbujas = [
    { id: "bookyhome", nombre: "BookyHome Vinotinto", propioBg: "#541223", otroBg: "#FCE8EE", desc: "Oficial BookyHome" },
    { id: "whatsapp", nombre: "Verde Esmeralda", propioBg: "#005C4B", otroBg: "#FFFFFF", desc: "Tonos verdes y frescos" },
    { id: "midnight", nombre: "Azul Medianoche", propioBg: "#1E3A8A", otroBg: "#EFF6FF", desc: "Moderno y corporativo" },
    { id: "monochrome", nombre: "Carbón Minimalista", propioBg: "#1F2937", otroBg: "#F3F4F6", desc: "Escala de grises elegante" },
  ];

  const disenosSalas = [
    {
      id: "clasico",
      nombre: "Clásico BookyHome",
      desc: "Lista continua tradicional con acento lateral vinotinto",
    },
    {
      id: "borde_neon",
      nombre: "Contorno Neón Oscuro",
      desc: "Tarjeta flotante con borde verde neón brillante (Estilo WhatsApp Plus)",
    },
    {
      id: "capsula_solida",
      nombre: "Cápsula Morada Vibrante",
      desc: "Tarjeta curva con fondo sólido en morado e índigo (Estilo Telegram)",
    },
    {
      id: "flotante_glass",
      nombre: "Tarjeta Flotante Minimalista",
      desc: "Tarjetas elevadas blancas con sombra suave y esquinas redondeadas",
    },
    {
      id: "gradiente_cyber",
      nombre: "Degradado Cyber Vinotinto",
      desc: "Tarjeta moderna con borde brillante en degradado de la marca",
    },
  ];

  const tamanosFuente = [
    { id: "pequena", nombre: "Pequeña", size: "13px" },
    { id: "mediana", nombre: "Mediana", size: "14.2px" },
    { id: "grande", nombre: "Grande", size: "16px" },
  ];

  const handleUpdate = (key, value) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem("bkh_chat_theme_settings", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRestablecer = () => {
    const defaults = {
      fondo: "beige_dots",
      tamanoFuente: "mediana",
      temaBurbujas: "bookyhome",
      disenoSalas: "clasico",
      patronVisible: true,
      enterParaEnviar: true,
      sonidoNotificaciones: true,
    };
    setConfig(defaults);
    try {
      localStorage.setItem("bkh_chat_theme_settings", JSON.stringify(defaults));
    } catch {}
  };

  return (
    <div className="bkh-config-modal-overlay" onClick={onClose}>
      <div className="bkh-config-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="bkh-config-modal-header">
          <div className="bkh-config-modal-header-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <h3>Configuración y Apariencia del Chat</h3>
          </div>
          <button type="button" className="bkh-config-modal-close" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        {/* Pestañas de navegación de ajustes — scroll horizontal con rueda */}
        <div
          className="bkh-config-tabs"
          ref={(el) => {
            if (!el) return;
            el._bkhWheelHandler = el._bkhWheelHandler || ((e) => {
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                el.scrollLeft += e.deltaY * 1.5;
              }
            });
            el.removeEventListener("wheel", el._bkhWheelHandler);
            el.addEventListener("wheel", el._bkhWheelHandler, { passive: false });
          }}
        >
          <button
            type="button"
            className={`bkh-config-tab ${activeTab === "apariencia" ? "active" : ""}`}
            onClick={() => setActiveTab("apariencia")}
          >
            🎨 Fondo
          </button>
          <button
            type="button"
            className={`bkh-config-tab ${activeTab === "salas" ? "active" : ""}`}
            onClick={() => setActiveTab("salas")}
          >
            📋 Lista de Chats
          </button>
          <button
            type="button"
            className={`bkh-config-tab ${activeTab === "burbujas" ? "active" : ""}`}
            onClick={() => setActiveTab("burbujas")}
          >
            💬 Burbujas
          </button>
          <button
            type="button"
            className={`bkh-config-tab ${activeTab === "texto" ? "active" : ""}`}
            onClick={() => setActiveTab("texto")}
          >
            🔤 Tamaño Letra
          </button>
          <button
            type="button"
            className={`bkh-config-tab ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            ⚡ Preferencias
          </button>
        </div>

        <div className="bkh-config-modal-body">
          {/* TAB 1: FONDO DEL CHAT */}
          {activeTab === "apariencia" && (
            <div className="bkh-config-section">
              <h4 className="bkh-config-subtitle">Elige el color y estilo de fondo del chat</h4>
              <div className="bkh-config-wallpapers-grid">
                {fondos.map((f) => (
                  <div
                    key={f.id}
                    className={`bkh-wallpaper-card ${config.fondo === f.id ? "selected" : ""}`}
                    onClick={() => handleUpdate("fondo", f.id)}
                  >
                    <div className="bkh-wallpaper-preview" style={{ backgroundColor: f.color }}>
                      {f.id === "beige_dots" && <span className="bkh-preview-dots">•••</span>}
                      {config.fondo === f.id && <span className="bkh-check-badge">✓</span>}
                    </div>
                    <div className="bkh-wallpaper-info">
                      <span className="bkh-wallpaper-title">{f.nombre}</span>
                      <span className="bkh-wallpaper-desc">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bkh-config-toggle-row">
                <div>
                  <strong>Textura de fondo (Patrón punteado)</strong>
                  <p>Muestra u oculta la sutil textura de fondo en el área de mensajes.</p>
                </div>
                <label className="bkh-switch">
                  <input
                    type="checkbox"
                    checked={config.patronVisible}
                    onChange={(e) => handleUpdate("patronVisible", e.target.checked)}
                  />
                  <span className="bkh-slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: LISTA DE CHATS */}
          {activeTab === "salas" && (
            <div className="bkh-config-section">
              <h4 className="bkh-config-subtitle">Elige el estilo visual de la lista de conversaciones</h4>
              <div className="bkh-salas-designs-grid">
                {disenosSalas.map((d) => {
                  const isSelected = (config.disenoSalas || "clasico") === d.id;
                  return (
                    <div
                      key={d.id}
                      className={`bkh-sala-design-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleUpdate("disenoSalas", d.id)}
                    >
                      {/* Vista previa de cada diseño */}
                      <div className={`bkh-sala-preview bkh-sala-preview--${d.id}`}>
                        <div className={`bkh-sala-preview-item bkh-sala-preview-item--${d.id}`}>
                          <div className="bkh-sala-prev-avatar">BH</div>
                          <div className="bkh-sala-prev-content">
                            <div className="bkh-sala-prev-name">BookyHome Store</div>
                            <div className="bkh-sala-prev-msg">¿Tiene el libro disponible?</div>
                          </div>
                          <div className="bkh-sala-prev-time">12:17 a.m.</div>
                        </div>
                        <div className={`bkh-sala-preview-item bkh-sala-preview-item--${d.id}`} style={{ opacity: 0.55 }}>
                          <div className="bkh-sala-prev-avatar">LE</div>
                          <div className="bkh-sala-prev-content">
                            <div className="bkh-sala-prev-name">Librería El Sótano</div>
                            <div className="bkh-sala-prev-msg">Claro, con gusto le ayudo</div>
                          </div>
                          <div className="bkh-sala-prev-time">Ayer</div>
                        </div>
                      </div>
                      <div className="bkh-sala-design-info">
                        <span className="bkh-sala-design-name">{d.nombre}</span>
                        <span className="bkh-sala-design-desc">{d.desc}</span>
                      </div>
                      {isSelected && <span className="bkh-check-badge-corner">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BURBUJAS */}
          {activeTab === "burbujas" && (
            <div className="bkh-config-section">
              <h4 className="bkh-config-subtitle">Combinación de colores para mensajes enviados y recibidos</h4>
              <div className="bkh-config-bubbles-grid">
                {temasBurbujas.map((t) => (
                  <div
                    key={t.id}
                    className={`bkh-bubble-theme-card ${config.temaBurbujas === t.id ? "selected" : ""}`}
                    onClick={() => handleUpdate("temaBurbujas", t.id)}
                  >
                    <div className="bkh-bubble-preview-row">
                      <div className="bkh-preview-msg incoming" style={{ backgroundColor: t.otroBg, color: t.id === "whatsapp" || t.id === "monochrome" ? "#111827" : "#3B0B1A" }}>
                        Hola 👋
                      </div>
                      <div className="bkh-preview-msg outgoing" style={{ backgroundColor: t.propioBg, color: "#FFFFFF" }}>
                        ¡Todo bien! ✓✓
                      </div>
                    </div>
                    <div className="bkh-bubble-info">
                      <span className="bkh-bubble-title">{t.nombre}</span>
                      <span className="bkh-bubble-desc">{t.desc}</span>
                    </div>
                    {config.temaBurbujas === t.id && <span className="bkh-check-badge-corner">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TAMAÑO DE LETRA */}
          {activeTab === "texto" && (
            <div className="bkh-config-section">
              <h4 className="bkh-config-subtitle">Ajusta el tamaño del texto para una lectura cómoda</h4>
              <div className="bkh-config-font-pills">
                {tamanosFuente.map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    className={`bkh-font-pill ${config.tamanoFuente === tf.id ? "active" : ""}`}
                    onClick={() => handleUpdate("tamanoFuente", tf.id)}
                  >
                    <span className="bkh-font-pill-name">{tf.nombre}</span>
                    <span className="bkh-font-pill-size">({tf.size})</span>
                  </button>
                ))}
              </div>

              {/* Vista previa en tiempo real del tamaño */}
              <div className="bkh-font-preview-box">
                <p className="bkh-preview-label">Vista previa del mensaje:</p>
                <div
                  className="bkh-preview-bubble-sample"
                  style={{
                    fontSize: config.tamanoFuente === "pequena" ? "13px" : config.tamanoFuente === "grande" ? "16px" : "14.2px",
                    lineHeight: config.tamanoFuente === "pequena" ? "17px" : config.tamanoFuente === "grande" ? "22px" : "19px"
                  }}
                >
                  Este es un ejemplo de cómo se leerán tus mensajes en el chat de BookyHome con este tamaño de letra.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GENERAL / PREFERENCIAS */}
          {activeTab === "general" && (
            <div className="bkh-config-section">
              <h4 className="bkh-config-subtitle">Comportamiento y accesibilidad</h4>
              <div className="bkh-config-toggle-row">
                <div>
                  <strong>Enviar al presionar Enter</strong>
                  <p>Si está activo, al pulsar Enter se enviará el mensaje. Con Shift + Enter se hace un salto de línea.</p>
                </div>
                <label className="bkh-switch">
                  <input
                    type="checkbox"
                    checked={config.enterParaEnviar}
                    onChange={(e) => handleUpdate("enterParaEnviar", e.target.checked)}
                  />
                  <span className="bkh-slider"></span>
                </label>
              </div>

              <div className="bkh-config-toggle-row">
                <div>
                  <strong>Sonidos de notificación</strong>
                  <p>Reproducir un tono sutil al enviar o recibir mensajes en el chat.</p>
                </div>
                <label className="bkh-switch">
                  <input
                    type="checkbox"
                    checked={config.sonidoNotificaciones}
                    onChange={(e) => handleUpdate("sonidoNotificaciones", e.target.checked)}
                  />
                  <span className="bkh-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bkh-config-modal-footer">
          <button type="button" className="bkh-btn-secondary" onClick={handleRestablecer}>
            Restablecer valores
          </button>
          <button type="button" className="bkh-btn-primary" onClick={onClose}>
            Listo / Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedSala, setSelectedSala] = useState(() => {
    if (selectedSalaProp) return selectedSalaProp;
    if (id_sala) return id_sala;
    try {
      const saved = localStorage.getItem("bkh_selected_sala");
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [mostrarBannerNotif, setMostrarBannerNotif] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted" || Notification.permission === "denied") {
        return false;
      }
    }
    try {
      return localStorage.getItem("bkh_notif_banner_dismissed") !== "true";
    } catch {
      return false;
    }
  });
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [mostrarAdjuntos, setMostrarAdjuntos] = useState(false);
  const [mostrarModalConfig, setMostrarModalConfig] = useState(false);

  // Configuración de aspecto, burbujas y comportamiento del chat
  const [configChat, setConfigChat] = useState(() => {
    try {
      const saved = localStorage.getItem("bkh_chat_theme_settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fondo: "beige_dots",
      tamanoFuente: "mediana",
      temaBurbujas: "bookyhome",
      patronVisible: true,
      enterParaEnviar: true,
      sonidoNotificaciones: true,
    };
  });

  // Estados y refs para notas de voz en tiempo real
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [segundosGrabacion, setSegundosGrabacion] = useState(0);
  const [nivelesVoz, setNivelesVoz] = useState([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerGrabacionRef = useRef(null);

  const fileDocRef = useRef(null);
  const fileMediaRef = useRef(null);
  const fileCameraRef = useRef(null);
  const fileAudioRef = useRef(null);

  // Estados para acciones del menú contextual estilo WhatsApp
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, sala: null });
  const [chatsFijados, setChatsFijados] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bkh_chats_fijados') || '[]'); } catch { return []; }
  });
  const [chatsSilenciados, setChatsSilenciados] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bkh_chats_silenciados') || '[]'); } catch { return []; }
  });
  const [chatsArchivados, setChatsArchivados] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bkh_chats_archivados') || '[]'); } catch { return []; }
  });
  const [chatsFavoritos, setChatsFavoritos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bkh_chats_favoritos') || '[]'); } catch { return []; }
  });

  // Estado del menú contextual de mensajes y reacciones flotantes
  const [msgMenu, setMsgMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    msg: null,
    soloReacciones: false,
  });
  const [modalReacciones, setModalReacciones] = useState({ visible: false, idMensaje: null });
  const [reacciones, setReacciones] = useState(() => {
    try {
      const saved = localStorage.getItem("bkh_chat_reacciones");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [mensajesDestacados, setMensajesDestacados] = useState(() => {
    try {
      const saved = localStorage.getItem("bkh_chat_destacados");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mensajesFijados, setMensajesFijados] = useState([]);
  const [mostrarBusquedaMensajes, setMostrarBusquedaMensajes] = useState(false);
  const [busquedaMensajesTerm, setBusquedaMensajesTerm] = useState("");
  const [mostrarMenuHeader, setMostrarMenuHeader] = useState(false);
  const [mostrarInfoContacto, setMostrarInfoContacto] = useState(false);
  const [llamadaActiva, setLlamadaActiva] = useState(null);
  const headerMenuRef = useRef(null);

  const touchTimerRef = useRef(null);

  // Cerrar menús al hacer clic en cualquier parte
  useEffect(() => {
    const handleCloseMenu = (e) => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, sala: null });
      }
      if (msgMenu.visible && !e?.target?.closest(".chat-msg-context-menu") && !e?.target?.closest(".chat-msg-reactions-pill")) {
        setMsgMenu({ visible: false, x: 0, y: 0, msg: null, soloReacciones: false });
      }
      if (!e?.target?.closest(".chat-input-capsule") && !e?.target?.closest(".chat-attach-popover") && !e?.target?.closest(".chat-emojis-popover") && !e?.target?.closest(".chat-emoji-tray")) {
        setMostrarAdjuntos(false);
        setMostrarEmojis(false);
      }
      if (mostrarMenuHeader && !e?.target?.closest(".chat-header-menu-wrap")) {
        setMostrarMenuHeader(false);
      }
    };
    window.addEventListener("click", handleCloseMenu);
    window.addEventListener("contextmenu", (e) => {
      if (!e.target.closest(".sala-item") && !e.target.closest(".mensaje")) {
        handleCloseMenu(e);
      }
    });
    return () => {
      window.removeEventListener("click", handleCloseMenu);
    };
  }, [contextMenu.visible, msgMenu.visible]);
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
    return date.toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).replace(/\s+/g, '\u00A0');
  };

  const formatHoraSala = (fechaStr) => {
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
    if (mismaFecha(date, hoy)) {
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    if (mismaFecha(date, ayer)) return 'Ayer';
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Obtener iniciales para avatar
  const getIniciales = (nombre) => {
    if (!nombre) return '?';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre[0].toUpperCase();
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
      const list = data.salas || [];
      setSalas(list);

      // Restaurar automáticamente la última sala abierta al recargar
      setSelectedSala((prev) => {
        if (prev && list.some((s) => s.id_sala === prev)) return prev;
        try {
          const saved = localStorage.getItem("bkh_selected_sala");
          if (saved) {
            const num = Number(saved);
            if (list.some((s) => s.id_sala === num)) return num;
          }
        } catch {}
        return prev || null;
      });
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
      cargarSalas();
    }
  }, [selectedSalaProp, cargarSalas]);

  // Mantiene sincronizado el ref y persiste en localStorage
  useEffect(() => {
    selectedSalaRef.current = selectedSala;
    try {
      if (selectedSala) {
        localStorage.setItem("bkh_selected_sala", String(selectedSala));
      }
    } catch {}
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
              // Reemplazar mensaje temporal pendiente si existe
              const idxPendiente = prev.findIndex((m) => m.pendiente && m.mensaje === msg.mensaje);
              if (idxPendiente !== -1) {
                const copia = [...prev];
                copia[idxPendiente] = msg;
                return copia;
              }
              if (prev.some((m) => m.id_mensaje === msg.id_mensaje)) return prev;
              return [...prev, msg];
            });
            if (data.tipo === "nuevo_mensaje") {
              chatService.marcarSalaLeida(msg.id_sala).catch(() => {});
            }
          }

          // Actualizamos la lista de salas (último mensaje / no leídos)
          setSalas((prev) => {
            const idx = prev.findIndex((s) => s.id_sala === msg.id_sala);
            if (idx === -1) return prev;
            const copia = [...prev];
            const sala = { ...copia[idx] };
            sala.ultimo_mensaje = msg.mensaje;
            sala.ultimo_mensaje_fecha = msg.enviado_en;
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

        if (data.tipo === "mensaje_entregado") {
          setMensajes((prev) =>
            prev.map((m) =>
              m.id_mensaje === data.id_mensaje ? { ...m, entregado: true } : m
            )
          );
        }

        if (data.tipo === "mensajes_leidos") {
          if (data.id_sala === selectedSalaRef.current) {
            setMensajes((prev) =>
              prev.map((m) => ({ ...m, mensaje_leido: true, entregado: true }))
            );
          }
        }

        if (data.tipo === "error") {
          console.warn("Error del servidor de chat:", data.detalle);
        }
      };

      ws.onerror = (e) => {
        if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) return;
        console.error("Error en WebSocket de chat:", e);
      };

      ws.onclose = (event) => {
        if (event.code === 4401) {
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
        wsRef.current.onclose = null;
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

  const enviarTextoDirecto = async (texto) => {
    if (!texto.trim() || !selectedSala) return;

    const tempId = "temp_" + Date.now();
    const tempMsg = {
      id_mensaje: tempId,
      id_sala: selectedSala,
      id_remitente: usuarioActual?.id_usuario,
      nombre_remitente: usuarioActual?.nombre_usuario || "Yo",
      mensaje: texto,
      enviado_en: new Date().toISOString().replace('T', ' ').slice(0, 19),
      mensaje_leido: false,
      entregado: false,
      pendiente: true, // Relojito mientras se confirma
    };

    setMensajes((prev) => [...prev, tempMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          tipo: "mensaje",
          id_sala: selectedSala,
          mensaje: texto,
        })
      );
    } else {
      try {
        setLoading(true);
        const resp = await chatService.enviarMensaje(selectedSala, texto);
        if (resp?.data) {
          setMensajes((prev) =>
            prev.map((m) => (m.id_mensaje === tempId ? resp.data : m))
          );
        } else {
          setMensajes((prev) =>
            prev.map((m) => (m.id_mensaje === tempId ? { ...m, pendiente: false, id_mensaje: resp?.id_mensaje || Date.now() } : m))
          );
        }
      } catch (err) {
        console.error(err);
        setError("Error enviando mensaje. Revisa tu conexión a internet.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Siempre usa REST para payloads grandes (audio base64), nunca WebSocket
  const enviarPayloadREST = async (payload) => {
    if (!payload || !selectedSala) return;

    const tempId = "temp_audio_" + Date.now();
    const tempMsg = {
      id_mensaje: tempId,
      id_sala: selectedSala,
      id_remitente: usuarioActual?.id_usuario,
      nombre_remitente: usuarioActual?.nombre_usuario || "Yo",
      mensaje: payload,
      enviado_en: new Date().toISOString().replace('T', ' ').slice(0, 19),
      mensaje_leido: false,
      entregado: false,
      pendiente: true, // Relojito mientras se envía
    };

    setMensajes((prev) => [...prev, tempMsg]);

    try {
      setLoading(true);
      const resp = await chatService.enviarMensaje(selectedSala, payload);
      if (resp?.data) {
        setMensajes((prev) =>
          prev.map((m) => (m.id_mensaje === tempId ? resp.data : m))
        );
      } else {
        await cargarMensajes();
      }
    } catch (err) {
      console.error("Error enviando nota de voz:", err);
      notify("Error al enviar la nota de voz. Sin conexión.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !selectedSala) return;
    let textoEnviar = nuevoMensaje;
    if (respondiendoA) {
      const remitente = respondiendoA.nombre_remitente || (respondiendoA.id_remitente === usuarioActual?.id_usuario ? "Tú" : "Usuario");
      const resumen = respondiendoA.mensaje.startsWith("[AUDIO]") ? "🎤 Nota de voz" : respondiendoA.mensaje.slice(0, 60);
      textoEnviar = `┌── 💬 ${remitente}: "${resumen}"\n└── ${nuevoMensaje}`;
      setRespondiendoA(null);
    }
    setNuevoMensaje("");
    await enviarTextoDirecto(textoEnviar);
  };

  // Acciones de mensaje individual (Menú contextual y reacciones)
  const handleAbrirMenuMensaje = (e, msg, soloReacciones = false) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pillWidth = 320;
    const menuHeight = soloReacciones ? 65 : 360;

    const esLadoDerecho = rect.right > window.innerWidth / 2;
    let x;

    if (esLadoDerecho) {
      x = rect.right - pillWidth;
    } else {
      x = rect.left;
    }

    // Asegurar márgenes de pantalla de al menos 16px
    if (x + pillWidth > window.innerWidth - 16) {
      x = window.innerWidth - pillWidth - 16;
    }
    if (x < 16) {
      x = 16;
    }

    let y = rect.bottom + 6;
    if (y + menuHeight > window.innerHeight - 16) {
      y = Math.max(16, rect.top - menuHeight - 6);
    }

    setMsgMenu({
      visible: true,
      x,
      y,
      msg,
      soloReacciones,
      alignRight: esLadoDerecho,
    });
  };

  const handleReaccionar = (idMensaje, emoji) => {
    setReacciones((prev) => {
      const current = prev[idMensaje] || [];
      const updated = current.includes(emoji)
        ? current.filter((e) => e !== emoji)
        : [...current, emoji];
      const newState = { ...prev, [idMensaje]: updated };
      try {
        localStorage.setItem("bkh_chat_reacciones", JSON.stringify(newState));
      } catch (err) {
        console.warn("No se pudo guardar reacción en localStorage:", err);
      }
      return newState;
    });
    setMsgMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCopiarMensaje = (msg) => {
    if (!msg) return;
    let texto = msg.mensaje || "";
    if (texto.startsWith("[AUDIO]")) {
      texto = "🎤 Nota de voz";
    }
    navigator.clipboard?.writeText(texto).then(() => {
      notify("Texto copiado al portapapeles ✓", "success");
    }).catch(() => {
      notify("No se pudo copiar el texto", "error");
    });
    setMsgMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleResponderMensaje = (msg) => {
    setRespondiendoA(msg);
    setMsgMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleDestacarMensaje = (idMensaje) => {
    setMensajesDestacados((prev) => {
      const isDestacado = prev.includes(idMensaje);
      const next = isDestacado
        ? prev.filter((id) => id !== idMensaje)
        : [...prev, idMensaje];
      try {
        localStorage.setItem("bkh_chat_destacados", JSON.stringify(next));
      } catch (err) {
        console.warn("No se pudo guardar mensaje destacado en localStorage:", err);
      }
      notify(isDestacado ? "Mensaje no destacado" : "Mensaje destacado ⭐", "success");
      return next;
    });
    setMsgMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleFijarMensaje = (idMensaje) => {
    setMensajesFijados((prev) => {
      const isFijado = prev.includes(idMensaje);
      const next = isFijado
        ? prev.filter((id) => id !== idMensaje)
        : [...prev, idMensaje];
      notify(isFijado ? "Mensaje desfijado" : "Mensaje fijado 📌", "success");
      return next;
    });
    setMsgMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleEliminarMensajeLocal = (idMensaje) => {
    setMensajes((prev) => prev.filter((m) => m.id_mensaje !== idMensaje));
    notify("Mensaje eliminado ✓", "success");
    setMsgMenu((prev) => ({ ...prev, visible: false }));
  };

  // Grabación de notas de voz en tiempo real
  const formatTiempoGrabacion = (seg) => {
    const min = Math.floor(seg / 60);
    const s = seg % 60;
    return `${min}:${s < 10 ? '0' : ''}${s}`;
  };

  const iniciarGrabacionAudio = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        notify("Tu navegador no soporta grabación de audio", "error");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // AudioContext para analizar decibeles reales de la voz
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 32;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          audioContextRef.current = ctx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const loopLevels = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const levels = [];
            for (let i = 0; i < 12; i++) {
              const val = dataArray[i % dataArray.length] || 0;
              // Si está en silencio, se queda en 4px; al hablar sube proporcionalmente hasta 26px
              const h = Math.max(4, Math.min(26, Math.round((val / 255) * 26) + 4));
              levels.push(h);
            }
            setNivelesVoz(levels);
            animFrameRef.current = requestAnimationFrame(loopLevels);
          };
          loopLevels();
        }
      } catch (err) {
        console.warn("AudioContext no disponible para visualizador:", err);
      }

      // MediaRecorder para capturar los bytes de audio real
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setSegundosGrabacion(0);
      setGrabandoAudio(true);

      if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current);
      timerGrabacionRef.current = setInterval(() => {
        setSegundosGrabacion((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      notify("No se pudo acceder al micrófono. Verifica los permisos.", "error");
    }
  };

  const cancelarGrabacionAudio = () => {
    if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setGrabandoAudio(false);
    setSegundosGrabacion(0);
    setNivelesVoz([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
  };

  const enviarGrabacionAudio = () => {
    const durSeg = Math.max(segundosGrabacion, 1);
    const durTexto = formatTiempoGrabacion(durSeg);

    if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    // Cierra el stream antes de procesar
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setGrabandoAudio(false);
    setSegundosGrabacion(0);
    setNivelesVoz([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        const chunks = audioChunksRef.current;
        if (!chunks || chunks.length === 0) {
          notify("No se capturó audio. Intenta de nuevo.", "error");
          return;
        }
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          const payload = `[AUDIO]${JSON.stringify({ duracion: durTexto, url: base64Audio, seg: durSeg })}`;
          // IMPORTANTE: siempre por REST (el WebSocket tiene límite de ~1MB y el audio base64 puede ser mayor)
          enviarPayloadREST(payload).then(() => {
            notify("Nota de voz enviada ✓", "success");
          });
        };
        reader.onerror = () => {
          notify("Error al procesar el audio. Intenta de nuevo.", "error");
        };
      };
      mediaRecorderRef.current.stop();
    } else {
      // Fallback si el recorder ya estaba inactivo
      notify("No se grabó audio. Mantén presionado el micrófono mientras hablas.", "error");
    }
  };

  // ==========================
  // SELECCIONAR SALA
  // ==========================

  const handleSeleccionarSala = (sala) => {
    setSelectedSala(sala.id_sala);

    // Limpiar no leídos localmente
    setSalas((prev) =>
      prev.map((s) =>
        s.id_sala === sala.id_sala ? { ...s, no_leidos: 0 } : s
      )
    );

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
      const rolComprador = (sala.rol_comprador || "").toLowerCase();
      if (rolComprador === "admin" || rolComprador === "administrador" || (sala.nombre_comprador || '').toLowerCase().includes('admin')) {
        return `🛡️ ${sala.nombre_comprador || "Administración BookyHome"}`;
      }
      return sala.nombre_comprador || sala.nombre_cliente || sala.nombre_usuario || "Comprador";
    } else {
      return sala.nombre_tienda || sala.nombre_libreria || sala.nombre_vendedor || "Tienda / Vendedor";
    }
  };

  // Manejadores de acciones del menú contextual
  const handleContextMenu = (e, sala) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 220;
    const menuHeight = 360;
    let x = e.clientX;
    let y = e.clientY;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 12;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 12;
    setContextMenu({ visible: true, x, y, sala });
  };

  const handleTouchStart = (e, sala) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    touchTimerRef.current = setTimeout(() => {
      let posX = x;
      let posY = y;
      if (posX + 220 > window.innerWidth) posX = window.innerWidth - 230;
      if (posY + 360 > window.innerHeight) posY = window.innerHeight - 370;
      setContextMenu({ visible: true, x: posX, y: posY, sala });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  const toggleFijar = (idSala) => {
    setChatsFijados((prev) => {
      const estaFijado = prev.includes(idSala);
      const nuevo = estaFijado ? prev.filter((id) => id !== idSala) : [...prev, idSala];
      localStorage.setItem('bkh_chats_fijados', JSON.stringify(nuevo));
      notify(estaFijado ? "Chat desfijado" : "Chat fijado al inicio", "success");
      return nuevo;
    });
    setContextMenu({ visible: false, x: 0, y: 0, sala: null });
  };

  const toggleSilenciar = (idSala) => {
    setChatsSilenciados((prev) => {
      const estaSilenciado = prev.includes(idSala);
      const nuevo = estaSilenciado ? prev.filter((id) => id !== idSala) : [...prev, idSala];
      localStorage.setItem('bkh_chats_silenciados', JSON.stringify(nuevo));
      notify(estaSilenciado ? "Notificaciones activadas" : "Chat silenciado", "success");
      return nuevo;
    });
    setContextMenu({ visible: false, x: 0, y: 0, sala: null });
  };

  const toggleArchivar = (idSala) => {
    setChatsArchivados((prev) => {
      const estaArchivado = prev.includes(idSala);
      const nuevo = estaArchivado ? prev.filter((id) => id !== idSala) : [...prev, idSala];
      localStorage.setItem('bkh_chats_archivados', JSON.stringify(nuevo));
      notify(estaArchivado ? "Chat desarchivado" : "Chat archivado", "success");
      return nuevo;
    });
    setContextMenu({ visible: false, x: 0, y: 0, sala: null });
  };

  const toggleFavorito = (idSala) => {
    setChatsFavoritos((prev) => {
      const esFav = prev.includes(idSala);
      const nuevo = esFav ? prev.filter((id) => id !== idSala) : [...prev, idSala];
      localStorage.setItem('bkh_chats_favoritos', JSON.stringify(nuevo));
      notify(esFav ? "Eliminado de favoritos" : "Añadido a favoritos", "success");
      return nuevo;
    });
    setContextMenu({ visible: false, x: 0, y: 0, sala: null });
  };

  const toggleMarcarLeido = (idSala) => {
    setSalas((prev) =>
      prev.map((s) => {
        if (s.id_sala === idSala) {
          const yaNoLeido = (s.no_leidos || 0) > 0;
          notify(yaNoLeido ? "Chat marcado como leído" : "Chat marcado como no leído", "success");
          return { ...s, no_leidos: yaNoLeido ? 0 : 1 };
        }
        return s;
      })
    );
    setContextMenu({ visible: false, x: 0, y: 0, sala: null });
  };

  const vaciarChat = async (idSala) => {
    try {
      await chatService.vaciarChat(idSala);
      if (selectedSala === idSala) {
        setMensajes([]);
      }
      setSalas((prev) =>
        prev.map((s) => (s.id_sala === idSala ? { ...s, ultimo_mensaje: null, ultimo_mensaje_fecha: null } : s))
      );
      notify("Chat vaciado", "success");
    } catch (err) {
      console.error("Error al vaciar chat:", err);
      notify("No se pudo vaciar el chat", "error");
    }
    setContextMenu({ visible: false, x: 0, y: 0, sala: null });
  };

  const eliminarChat = async (idSala) => {
    try {
      await chatService.eliminarSala(idSala);
      setSalas((prev) => prev.filter((s) => s.id_sala !== idSala));
      if (selectedSala === idSala) {
        setSelectedSala(null);
        setMensajes([]);
      }
      // Limpiar de favoritos / fijados / silenciados
      setChatsFijados((prev) => prev.filter((id) => id !== idSala));
      setChatsSilenciados((prev) => prev.filter((id) => id !== idSala));
      setChatsFavoritos((prev) => prev.filter((id) => id !== idSala));
      setChatsArchivados((prev) => prev.filter((id) => id !== idSala));
      notify("Conversación eliminada", "success");
    } catch (err) {
      console.error("Error al eliminar conversación:", err);
      notify("No se pudo eliminar la conversación", "error");
    }
    setContextMenu({ visible: false, x: 0, y: 0, sala: null });
  };

  // Filtrar y ordenar salas (fijadas primero)
  const salasFiltradas = salas
    .filter((sala) => {
      if (chatsArchivados.includes(sala.id_sala) && filtroActivo !== "archivados") {
        return false;
      }
      if (busqueda.trim()) {
        const nombre = nombreMostrar(sala).toLowerCase();
        const ultimoMsg = (sala.ultimo_mensaje || "").toLowerCase();
        if (!nombre.includes(busqueda.toLowerCase()) && !ultimoMsg.includes(busqueda.toLowerCase())) {
          return false;
        }
      }
      if (filtroActivo === "no_leidos") {
        return (sala.no_leidos || 0) > 0;
      }
      if (filtroActivo === "favoritos") {
        return chatsFavoritos.includes(sala.id_sala);
      }
      return true;
    })
    .sort((a, b) => {
      const aFijado = chatsFijados.includes(a.id_sala) ? 1 : 0;
      const bFijado = chatsFijados.includes(b.id_sala) ? 1 : 0;
      return bFijado - aFijado;
    });

  const salaActiva = salas.find((s) => s.id_sala === selectedSala);
  const nombreSalaActiva = nombreMostrar(salaActiva);

  // ==========================
  // UI
  // ==========================

  return (
    <div
      className={`chat-container ${embedded ? 'embedded' : ''} theme-bg-${configChat.fondo} font-${configChat.tamanoFuente} theme-bubbles-${configChat.temaBurbujas} ${configChat.patronVisible ? 'pattern-on' : 'pattern-off'}`}
    >
      <div className="chat-wrapper">
        {/* PANEL IZQUIERDO */}

        <div className={`chat-salas salas-diseno--${configChat.disenoSalas || "clasico"}`}>
          <div className="salas-header">
            <h2>Mensajes</h2>
          </div>

          <div className="salas-search">
            <div className="salas-search-wrapper">
              <IconSearch className="search-icon" width={16} height={16} strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Buscar un chat o iniciar uno nuevo"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            
            {/* Chips de filtro estilo WhatsApp */}
            <div className="salas-filters">
              <button
                type="button"
                className={`salas-filter-chip ${filtroActivo === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroActivo('todos')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`salas-filter-chip ${filtroActivo === 'no_leidos' ? 'active' : ''}`}
                onClick={() => setFiltroActivo('no_leidos')}
              >
                No leídos
                {salas.some((s) => (s.no_leidos || 0) > 0) && (
                  <span className="filter-badge">
                    {salas.reduce((acc, s) => acc + (s.no_leidos || 0), 0)}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`salas-filter-chip ${filtroActivo === 'librerias' ? 'active' : ''}`}
                onClick={() => setFiltroActivo('librerias')}
              >
                Librerías
              </button>
              <button
                type="button"
                className="salas-filter-chip plus-chip"
                onClick={() => navigate('/catalogo')}
                title="Explorar librerías en el catálogo"
              >
                +
              </button>
            </div>
          </div>

          {/* Banner de notificaciones estilo WhatsApp */}
          {mostrarBannerNotif && (
            <div className="notif-banner">
              <div className="notif-banner-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
                  <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </div>
              <div className="notif-banner-content">
                <span>
                  {`Las notificaciones para tu ${typeof navigator !== 'undefined' && (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768) ? 'móvil' : 'PC'} están desactivadas.`}{' '}
                  <strong
                    className="notif-link"
                    onClick={() => {
                      if ('Notification' in window) {
                        Notification.requestPermission().then(() => {
                          setMostrarBannerNotif(false);
                          try { localStorage.setItem('bkh_notif_banner_dismissed', 'true'); } catch (e) { console.warn(e); }
                        });
                      } else {
                        setMostrarBannerNotif(false);
                        try { localStorage.setItem('bkh_notif_banner_dismissed', 'true'); } catch (e) { console.warn(e); }
                      }
                    }}
                  >
                    Activar
                  </strong>
                </span>
              </div>
              <button
                type="button"
                className="notif-banner-close"
                onClick={() => {
                  setMostrarBannerNotif(false);
                  try { localStorage.setItem('bkh_notif_banner_dismissed', 'true'); } catch (e) { console.warn(e); }
                }}
                title="Descartar aviso"
              >
                ✕
              </button>
            </div>
          )}

          <div className="salas-list">
            {salasFiltradas.length === 0 ? (
              <div className="salas-empty">
                {busqueda.trim() ? (
                  <>
                    <p>Sin resultados</p>
                    <small>No se encontraron conversaciones</small>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ) : (
              salasFiltradas.map((sala) => {
                const nombre = nombreMostrar(sala);
                const tieneNoLeidos = sala.no_leidos > 0;
                const estaFijado = chatsFijados.includes(sala.id_sala);
                const estaSilenciado = chatsSilenciados.includes(sala.id_sala);

                return (
                  <div
                    key={sala.id_sala}
                    className={`sala-item ${
                      selectedSala === sala.id_sala ? "active" : ""
                    } ${tieneNoLeidos ? "tiene-no-leidos" : ""}`}
                    onClick={() => handleSeleccionarSala(sala)}
                    onContextMenu={(e) => handleContextMenu(e, sala)}
                    onTouchStart={(e) => handleTouchStart(e, sala)}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="sala-avatar">
                      {getIniciales(nombre)}
                    </div>

                    <div className="sala-content">
                      <div className="sala-content-top">
                        <div className="sala-info">
                          <h4>{nombre}</h4>
                        </div>
                        <div className="sala-meta">
                          <span className="sala-hora">
                            {formatHoraSala(sala.ultimo_mensaje_fecha || sala.actualizado_en)}
                          </span>
                        </div>
                      </div>

                      <div className="sala-content-bottom">
                        <p className="sala-preview">
                          {sala.ultimo_mensaje?.substring(0, 45) || "Sin mensajes"}
                        </p>

                        <div className="sala-badges">
                          {estaSilenciado && (
                            <span className="mute-icon" title="Notificaciones silenciadas">
                              🔕
                            </span>
                          )}
                          {estaFijado && (
                            <span className="pin-icon" title="Chat fijado">
                              📌
                            </span>
                          )}
                          {tieneNoLeidos && (
                            <span className="notificacion-badge">
                              {sala.no_leidos}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Menú Contextual Flotante estilo WhatsApp */}
          {contextMenu.visible && contextMenu.sala && (
            <div
              className="whatsapp-context-menu"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Archivar chat */}
              <button
                type="button"
                className="ctx-menu-item"
                onClick={() => toggleArchivar(contextMenu.sala.id_sala)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                <span>{chatsArchivados.includes(contextMenu.sala.id_sala) ? "Desarchivar chat" : "Archivar chat"}</span>
              </button>

              {/* Silenciar notificaciones */}
              <button
                type="button"
                className="ctx-menu-item"
                onClick={() => toggleSilenciar(contextMenu.sala.id_sala)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
                  <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <span>{chatsSilenciados.includes(contextMenu.sala.id_sala) ? "Desactivar silencio" : "Silenciar notificaciones"}</span>
                <span className="ctx-arrow">▸</span>
              </button>

              {/* Fijar / Desfijar chat */}
              <button
                type="button"
                className="ctx-menu-item"
                onClick={() => toggleFijar(contextMenu.sala.id_sala)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                </svg>
                <span>{chatsFijados.includes(contextMenu.sala.id_sala) ? "Desfijar chat" : "Fijar chat"}</span>
              </button>

              {/* Marcar como no leído / leído */}
              <button
                type="button"
                className="ctx-menu-item"
                onClick={() => toggleMarcarLeido(contextMenu.sala.id_sala)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>{contextMenu.sala.no_leidos > 0 ? "Marcar como leído" : "Marcar como no leído"}</span>
              </button>

              {/* Eliminar de Favoritos / Añadir */}
              <button
                type="button"
                className="ctx-menu-item"
                onClick={() => toggleFavorito(contextMenu.sala.id_sala)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                <span>{chatsFavoritos.includes(contextMenu.sala.id_sala) ? "Eliminar de Favoritos" : "Añadir a Favoritos"}</span>
              </button>

              {/* Cambiar de lista */}
              <button
                type="button"
                className="ctx-menu-item"
                onClick={() => setContextMenu({ visible: false, x: 0, y: 0, sala: null })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span>Cambiar de lista</span>
                <span className="ctx-arrow">▸</span>
              </button>

              <div className="ctx-menu-divider" />

              {/* Bloquear */}
              <button
                type="button"
                className="ctx-menu-item"
                onClick={() => {
                  setContextMenu({ visible: false, x: 0, y: 0, sala: null });
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <span>Bloquear</span>
              </button>

              {/* Vaciar chat */}
              <button
                type="button"
                className="ctx-menu-item"
                onClick={() => vaciarChat(contextMenu.sala.id_sala)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Vaciar chat</span>
              </button>

              {/* Eliminar chat */}
              <button
                type="button"
                className="ctx-menu-item ctx-danger"
                onClick={() => eliminarChat(contextMenu.sala.id_sala)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Eliminar chat</span>
              </button>
            </div>
          )}
        </div>

        {/* PANEL DERECHO */}

        <div className="chat-conversacion">
          {selectedSala ? (
            <>
              <div className="chat-header">
                <div
                  className="chat-header-clickable-area"
                  onClick={() => setMostrarInfoContacto((prev) => !prev)}
                  title="Ver información del contacto"
                >
                  <div className="chat-header-avatar">
                    {getIniciales(nombreSalaActiva)}
                  </div>
                  <div className="chat-header-info">
                    <h2>{nombreSalaActiva}</h2>
                    <span className="chat-header-status">en línea</span>
                  </div>
                </div>

                {/* Acciones del header estilo WhatsApp (📹 📞 🔍 ⋮) */}
                <div className="chat-header-actions">
                  <button
                    type="button"
                    className="chat-header-btn"
                    title="Videollamada"
                    onClick={() => setLlamadaActiva({ tipo: "video", estado: "llamando" })}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="13" height="12" rx="3" />
                      <path d="M15 10l5-3v10l-5-3v-4z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="chat-header-btn"
                    title="Llamada de voz"
                    onClick={() => setLlamadaActiva({ tipo: "audio", estado: "llamando" })}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={`chat-header-btn ${mostrarBusquedaMensajes ? "active" : ""}`}
                    title="Buscar en el chat"
                    onClick={() => setMostrarBusquedaMensajes((prev) => !prev)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10.5" cy="10.5" r="6.5" />
                      <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" />
                    </svg>
                  </button>

                  <div className="chat-header-menu-wrap" ref={headerMenuRef}>
                    <button
                      type="button"
                      className={`chat-header-btn ${mostrarMenuHeader ? "active" : ""}`}
                      title="Más opciones"
                      onClick={() => setMostrarMenuHeader((prev) => !prev)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5.5" r="1.6" />
                        <circle cx="12" cy="12" r="1.6" />
                        <circle cx="12" cy="18.5" r="1.6" />
                      </svg>
                    </button>

                    {mostrarMenuHeader && (
                      <div className="chat-header-dropdown-menu">
                        {/* 1. Info del contacto */}
                        <button
                          type="button"
                          className="header-dropdown-item"
                          onClick={() => {
                            setMostrarInfoContacto(true);
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          <span>Info. del contacto</span>
                        </button>

                        {/* 3. Seleccionar mensajes */}
                        <button
                          type="button"
                          className="header-dropdown-item"
                          onClick={() => {
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                          <span>Seleccionar mensajes</span>
                        </button>

                        {/* 4. Silenciar notificaciones */}
                        <button
                          type="button"
                          className="header-dropdown-item"
                          onClick={() => {
                            if (selectedSala) toggleSilenciar(selectedSala);
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                          <span style={{ flex: 1 }}>{chatsSilenciados.includes(selectedSala) ? "Desactivar silencio" : "Silenciar notificaciones"}</span>
                          <span style={{ fontSize: "11px", opacity: 0.6 }}>▸</span>
                        </button>

                        {/* 5. Mensajes temporales */}
                        <button
                          type="button"
                          className="header-dropdown-item"
                          onClick={() => {
                            alert("Mensajes temporales desactivados por defecto en esta sala.");
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                          <span>Mensajes temporales</span>
                        </button>

                        {/* 6. Añadir a Favoritos */}
                        <button
                          type="button"
                          className="header-dropdown-item"
                          onClick={() => {
                            if (selectedSala) toggleFavorito(selectedSala);
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={chatsFavoritos.includes(selectedSala) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          <span>{chatsFavoritos.includes(selectedSala) ? "Quitar de Favoritos" : "Añadir a Favoritos"}</span>
                        </button>

                        {/* 7. Añadir a la lista */}
                        <button
                          type="button"
                          className="header-dropdown-item"
                          onClick={() => {
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/><rect x="2" y="2" width="20" height="20" rx="4"/></svg>
                          <span style={{ flex: 1 }}>Añadir a la lista</span>
                          <span style={{ fontSize: "11px", opacity: 0.6 }}>▸</span>
                        </button>

                        {/* 8. Exportar chat */}
                        <button
                          type="button"
                          className="header-dropdown-item"
                          onClick={() => {
                            if (!mensajes || mensajes.length === 0) {
                              alert("No hay mensajes para exportar.");
                              return;
                            }
                            const lineas = mensajes.map((m) => {
                              const fecha = m.enviado_en || "";
                              const remitente = m.id_remitente === usuarioActual?.id_usuario ? "Yo" : nombreSalaActiva;
                              const texto = typeof m.mensaje === "string" && m.mensaje.startsWith("[AUDIO]") ? "[Nota de voz]" : m.mensaje;
                              return `[${fecha}] ${remitente}: ${texto}`;
                            });
                            const blob = new Blob([lineas.join("\n")], { type: "text/plain;charset=utf-8" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `Chat_BookyHome_${nombreSalaActiva.replace(/\s+/g, "_")}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          <span>Exportar chat</span>
                        </button>

                        <div className="dropdown-menu-divider" />

                        {/* 9. Enviar enlace de llamada */}
                        <button
                          type="button"
                          className="header-dropdown-item"
                          onClick={() => {
                            const enlace = `${window.location.origin}/chat?sala=${selectedSala}&call=1`;
                            navigator.clipboard.writeText(enlace);
                            alert("¡Enlace de videollamada copiado al portapapeles!");
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          <span>Enviar enlace de llamada</span>
                        </button>

                        <div className="dropdown-menu-divider" />

                        {/* 12. Reportar */}
                        <button
                          type="button"
                          className="header-dropdown-item item-warning"
                          onClick={() => {
                            alert(`Se ha registrado el reporte de la conversación con ${nombreSalaActiva}.`);
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                          <span>Reportar</span>
                        </button>

                        {/* 13. Bloquear */}
                        <button
                          type="button"
                          className="header-dropdown-item item-warning"
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas bloquear a ${nombreSalaActiva}?`)) {
                              alert(`Has bloqueado a ${nombreSalaActiva}.`);
                            }
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          <span>Bloquear</span>
                        </button>

                        {/* 14. Vaciar chat */}
                        <button
                          type="button"
                          className="header-dropdown-item item-warning"
                          onClick={() => {
                            if (selectedSala) vaciarChat(selectedSala);
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                          <span>Vaciar chat</span>
                        </button>

                        {/* 15. Eliminar chat */}
                        <button
                          type="button"
                          className="header-dropdown-item item-danger"
                          onClick={() => {
                            if (selectedSala) eliminarChat(selectedSala);
                            setMostrarMenuHeader(false);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          <span>Eliminar chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de búsqueda en conversación */}
              {mostrarBusquedaMensajes && (
                <div className="chat-inline-search-bar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    placeholder="Buscar en esta conversación..."
                    value={busquedaMensajesTerm}
                    onChange={(e) => setBusquedaMensajesTerm(e.target.value)}
                    autoFocus
                  />
                  {busquedaMensajesTerm && (
                    <span className="chat-search-matches-count">
                      {mensajes.filter((m) => typeof m.mensaje === "string" && m.mensaje.toLowerCase().includes(busquedaMensajesTerm.toLowerCase())).length} resultados
                    </span>
                  )}
                  <button
                    type="button"
                    className="chat-search-close-btn"
                    onClick={() => {
                      setMostrarBusquedaMensajes(false);
                      setBusquedaMensajesTerm("");
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="chat-mensajes" ref={mensajesContainerRef}>
                {mensajes.length === 0 ? (
                  <div className="mensajes-empty">
                    <p>No hay mensajes aún — ¡envía el primero!</p>
                  </div>
                ) : (
                  mensajes.map((msg, index) => {
                    const esPropio = msg.id_remitente === usuarioActual?.id_usuario;
                    const anterior = mensajes[index - 1];
                    const fechaActual = formatFechaSeparador(msg.enviado_en);
                    const fechaAnterior = anterior ? formatFechaSeparador(anterior.enviado_en) : null;
                    const mostrarSeparador = fechaActual && fechaActual !== fechaAnterior;

                    let esNotaVoz = false;
                    let audioUrl = null;
                    let duracionTexto = '0:05';
                    let durSegundos = 5;

                    if (typeof msg.mensaje === 'string') {
                      if (msg.mensaje.startsWith('[AUDIO]')) {
                        try {
                          const data = JSON.parse(msg.mensaje.replace('[AUDIO]', ''));
                          esNotaVoz = true;
                          audioUrl = data.url;
                          duracionTexto = data.duracion || '0:05';
                          durSegundos = data.seg || 5;
                        } catch {
                          esNotaVoz = true;
                        }
                      } else if (msg.mensaje.includes('Nota de voz') || msg.mensaje.startsWith('🎤')) {
                        esNotaVoz = true;
                        const matchDur = msg.mensaje?.match(/\((\d+:\d+)\)/);
                        duracionTexto = matchDur ? matchDur[1] : '0:05';
                        const durParts = duracionTexto.split(':');
                        durSegundos = parseInt(durParts[0], 10) * 60 + parseInt(durParts[1], 10) || 5;
                      }
                    }

                    return (
                      <div key={msg.id_mensaje}>
                        {mostrarSeparador && (
                          <div className="fecha-separador">
                            <span>{fechaActual}</span>
                          </div>
                        )}
                        <div className={`mensaje-row ${esPropio ? 'propio' : 'otro'}`}>
                          {/* Botón flotante de Reacción (a la izquierda para mensajes propios) */}
                          {esPropio && (
                            <button
                              type="button"
                              className="mensaje-reaction-trigger"
                              title="Reaccionar"
                              onClick={(e) => handleAbrirMenuMensaje(e, msg, true)}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                <line x1="9" y1="9" x2="9.01" y2="9" />
                                <line x1="15" y1="9" x2="15.01" y2="9" />
                              </svg>
                            </button>
                          )}

                          <div
                            className={`mensaje ${esPropio ? 'propio' : 'otro'} ${esNotaVoz ? 'mensaje-audio' : ''}`}
                            onContextMenu={(e) => handleAbrirMenuMensaje(e, msg, false)}
                          >
                            <div className={`mensaje-body ${esNotaVoz ? 'audio-bubble-body' : ''}`}>
                              {/* Flecha hacia abajo estilo WhatsApp (Chevron menú de opciones) */}
                              <button
                                type="button"
                                className="mensaje-chevron-trigger"
                                title="Más opciones"
                                onClick={(e) => handleAbrirMenuMensaje(e, msg, false)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </button>

                              {esNotaVoz ? (
                                <VoiceNoteBubble
                                  msg={msg}
                                  esPropio={esPropio}
                                  usuarioActual={usuarioActual}
                                  duracionTexto={duracionTexto}
                                  audioUrl={audioUrl}
                                  durSegundos={durSegundos}
                                  formatHora={formatHora}
                                  getIniciales={getIniciales}
                                />
                              ) : (
                                <>
                                  <span className="mensaje-texto">{msg.mensaje}</span>
                                  <span className="mensaje-meta-inline">
                                    {mensajesDestacados.includes(msg.id_mensaje) && (
                                      <span className="mensaje-star-icon" title="Mensaje destacado">⭐</span>
                                    )}
                                    {mensajesFijados.includes(msg.id_mensaje) && (
                                      <span className="mensaje-pin-icon" title="Mensaje fijado">📌</span>
                                    )}
                                    <span className="mensaje-hora">
                                      {formatHora(msg.enviado_en)}
                                    </span>
                                    {esPropio && <MessageCheckmark msg={msg} />}
                                  </span>
                                </>
                              )}

                                  {reacciones[msg.id_mensaje]?.length > 0 && (
                                    <div
                                      className="mensaje-reactions-badge"
                                      onClick={(e) => handleAbrirMenuMensaje(e, msg, true)}
                                      title="Ver reacciones"
                                    >
                                      {reacciones[msg.id_mensaje].map((emoji, idx) => (
                                        <span key={idx} className="reaction-emoji-item">
                                          <RenderEmoji emoji={emoji} size={15} />
                                        </span>
                                      ))}
                                    </div>
                                  )}
                            </div>
                          </div>

                          {/* Botón flotante de Reacción (a la derecha para mensajes de otros) */}
                          {!esPropio && (
                            <button
                              type="button"
                              className="mensaje-reaction-trigger"
                              title="Reaccionar"
                              onClick={(e) => handleAbrirMenuMensaje(e, msg, true)}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                <line x1="9" y1="9" x2="9.01" y2="9" />
                                <line x1="15" y1="9" x2="15.01" y2="9" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {grabandoAudio ? (
                <div className="chat-recording-bar">
                  {/* Botón Cancelar / Papelera */}
                  <button
                    type="button"
                    className="rec-trash-btn"
                    onClick={cancelarGrabacionAudio}
                    title="Cancelar grabación"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>

                  <div className="rec-status">
                    <span className="rec-dot-pulse" />
                    <span className="rec-timer">{formatTiempoGrabacion(segundosGrabacion)}</span>
                  </div>

                  {/* Ondas de audio en tiempo real basadas en la voz */}
                  <div className="rec-waveform">
                    {nivelesVoz.map((h, i) => (
                      <span
                        key={i}
                        className="wave-bar"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>

                  {/* Botón Enviar Audio */}
                  <button
                    type="button"
                    className="chat-circle-action-btn send-btn"
                    onClick={enviarGrabacionAudio}
                    title="Enviar nota de voz"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleEnviarMensaje}
                  className="chat-input-form"
                >
                  <div className="chat-input-capsule">
                    {/* Inputs invisibles para selección de archivos */}
                    <input
                      type="file"
                      ref={fileDocRef}
                      style={{ display: "none" }}
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          notify(`Documento "${e.target.files[0].name}" adjuntado`, "success");
                        }
                      }}
                    />
                    <input
                      type="file"
                      ref={fileMediaRef}
                      style={{ display: "none" }}
                      accept="image/*,video/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          notify(`Archivo multimedia "${e.target.files[0].name}" adjuntado`, "success");
                        }
                      }}
                    />
                    <input
                      type="file"
                      ref={fileCameraRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          notify(`Foto capturada: "${e.target.files[0].name}"`, "success");
                        }
                      }}
                    />
                    <input
                      type="file"
                      ref={fileAudioRef}
                      style={{ display: "none" }}
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          notify(`Audio "${e.target.files[0].name}" adjuntado`, "success");
                        }
                      }}
                    />

                    {/* Popover Menú de Adjuntos estilo WhatsApp */}
                    {mostrarAdjuntos && (
                      <div className="chat-attach-popover" onClick={(e) => e.stopPropagation()}>
                        {/* 1. Documento */}
                        <button
                          type="button"
                          className="attach-item-btn"
                          onClick={() => {
                            fileDocRef.current?.click();
                            setMostrarAdjuntos(false);
                          }}
                        >
                          <div className="attach-item-icon icon-doc">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 3.5L18.5 9H13V3.5zM8 13h8v2H8v-2zm0 4h8v2H8v-2zm0-8h3v2H8V9z"/>
                            </svg>
                          </div>
                          <span>Documento</span>
                        </button>

                        {/* 2. Fotos y videos */}
                        <button
                          type="button"
                          className="attach-item-btn"
                          onClick={() => {
                            fileMediaRef.current?.click();
                            setMostrarAdjuntos(false);
                          }}
                        >
                          <div className="attach-item-icon icon-media">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                          </div>
                          <span>Fotos y videos</span>
                        </button>

                        {/* 3. Cámara */}
                        <button
                          type="button"
                          className="attach-item-btn"
                          onClick={() => {
                            fileCameraRef.current?.click();
                            setMostrarAdjuntos(false);
                          }}
                        >
                          <div className="attach-item-icon icon-cam">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                            </svg>
                          </div>
                          <span>Cámara</span>
                        </button>

                        {/* 4. Audio */}
                        <button
                          type="button"
                          className="attach-item-btn"
                          onClick={() => {
                            fileAudioRef.current?.click();
                            setMostrarAdjuntos(false);
                          }}
                        >
                          <div className="attach-item-icon icon-audio">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1a7 7 0 0 1 14 0v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z"/>
                            </svg>
                          </div>
                          <span>Audio</span>
                        </button>

                        {/* 5. Contacto */}
                        <button
                          type="button"
                          className="attach-item-btn"
                          onClick={() => {
                            notify("Tarjeta de contacto compartida", "success");
                            setMostrarAdjuntos(false);
                          }}
                        >
                          <div className="attach-item-icon icon-contact">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                          <span>Contacto</span>
                        </button>

                        {/* 6. Encuesta */}
                        <button
                          type="button"
                          className="attach-item-btn"
                          onClick={() => {
                            notify("Crear encuesta en el chat", "success");
                            setMostrarAdjuntos(false);
                          }}
                        >
                          <div className="attach-item-icon icon-poll">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4 6h16v2H4V6zm0 5h11v2H4v-2zm0 5h8v2H4v-2z"/>
                            </svg>
                          </div>
                          <span>Encuesta</span>
                        </button>

                        {/* 7. Evento */}
                        <button
                          type="button"
                          className="attach-item-btn"
                          onClick={() => {
                            notify("Crear evento en calendario", "success");
                            setMostrarAdjuntos(false);
                          }}
                        >
                          <div className="attach-item-icon icon-event">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
                            </svg>
                          </div>
                          <span>Evento</span>
                        </button>

                        {/* 8. Nuevo sticker */}
                        <button
                          type="button"
                          className="attach-item-btn"
                          onClick={() => {
                            fileMediaRef.current?.click();
                            setMostrarAdjuntos(false);
                          }}
                        >
                          <div className="attach-item-icon icon-sticker">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h9l7-7V5c0-1.1-.9-2-2-2zm-6 16.5V14h5.5L13 19.5zM11 7h2v3h3v2h-3v3h-2v-3H8v-2h3V7z"/>
                            </svg>
                          </div>
                          <span>Nuevo sticker</span>
                        </button>
                      </div>
                    )}

                    {/* Botón Adjuntar */}
                    <button
                      type="button"
                      className={`chat-capsule-icon-btn ${mostrarAdjuntos ? "active" : ""}`}
                      title="Adjuntar"
                      onClick={() => {
                        setMostrarAdjuntos((prev) => !prev);
                        setMostrarEmojis(false);
                      }}
                    >
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>

                    {/* Botón Emojis */}
                    <button
                      type="button"
                      className={`chat-capsule-icon-btn ${mostrarEmojis ? "active" : ""}`}
                      title="Emojis"
                      onClick={() => {
                        setMostrarEmojis((prev) => !prev);
                        setMostrarAdjuntos(false);
                      }}
                    >
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                      </svg>
                    </button>

                    <input
                      type="text"
                      placeholder="Escribe un mensaje"
                      value={nuevoMensaje}
                      onChange={(e) =>
                        setNuevoMensaje(e.target.value)
                      }
                      maxLength={500}
                      disabled={loading}
                    />

                    {/* Panel completo de Emojis estilo WhatsApp Web */}
                    {mostrarEmojis && (
                      <ChatEmojiPickerTray
                        config={configChat}
                        onSelectEmoji={(emoji) => {
                          setNuevoMensaje((prev) => prev + emoji);
                        }}
                        onClose={() => setMostrarEmojis(false)}
                      />
                    )}
                  </div>

              {/* Barra de respuesta (Quote) cuando respondiendoA está activo */}
              {respondiendoA && (
                <div className="chat-reply-bar">
                  <div className="reply-bar-accent" />
                  <div className="reply-bar-content">
                    <span className="reply-bar-sender">
                      {respondiendoA.nombre_remitente || (respondiendoA.id_remitente === usuarioActual?.id_usuario ? "Tú" : "Usuario")}
                    </span>
                    <span className="reply-bar-text">
                      {respondiendoA.mensaje.startsWith("[AUDIO]") ? "🎤 Nota de voz" : respondiendoA.mensaje}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="reply-bar-close-btn"
                    onClick={() => setRespondiendoA(null)}
                    title="Cancelar respuesta"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Botón enviar o micrófono */}
                  {nuevoMensaje.trim() ? (
                    <button
                      type="submit"
                      className="chat-circle-action-btn send-btn"
                      disabled={loading}
                      title="Enviar mensaje"
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="chat-circle-action-btn mic-btn"
                      title="Grabar nota de voz"
                      onClick={iniciarGrabacionAudio}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="2.5" width="6" height="11.5" rx="3" strokeWidth="2" />
                        <path d="M5 10v1.5a7 7 0 0 0 14 0V10" strokeWidth="2" />
                        <line x1="12" y1="18.5" x2="12" y2="22" strokeWidth="2.4" />
                      </svg>
                    </button>
                  )}
                </form>
              )}

              {/* Menú contextual de mensaje y barra flotante de reacciones */}
              {msgMenu.visible && msgMenu.msg && (
                <div
                  className={`chat-msg-menu-container ${msgMenu.alignRight ? "align-right" : "align-left"}`}
                  style={{ top: msgMenu.y, left: msgMenu.x }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Barra superior de emojis rápidos (👍 ❤️ 😂 😮 😢 🙏 ➕) */}
                  <div className="chat-msg-reactions-pill">
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="reaction-quick-btn"
                        onClick={() => handleReaccionar(msgMenu.msg.id_mensaje, emoji)}
                      >
                        <RenderEmoji emoji={emoji} size={21} />
                      </button>
                    ))}
                    <button
                      type="button"
                      className="reaction-quick-btn reaction-plus-btn"
                      title="Más reacciones"
                      onClick={() => {
                        const targetId = msgMenu.msg.id_mensaje;
                        setMsgMenu((prev) => ({ ...prev, visible: false }));
                        setModalReacciones({
                          visible: true,
                          idMensaje: targetId,
                        });
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Menú de opciones (si no es soloReacciones) */}
                  {!msgMenu.soloReacciones && (
                    <div className="chat-msg-context-menu">
                      <button
                        type="button"
                        className="msg-menu-item"
                        onClick={() => handleResponderMensaje(msgMenu.msg)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 14 4 9 9 4" />
                          <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                        </svg>
                        <span>Responder</span>
                      </button>

                      <button
                        type="button"
                        className="msg-menu-item"
                        onClick={() => handleCopiarMensaje(msgMenu.msg)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copiar</span>
                      </button>

                      <button
                        type="button"
                        className="msg-menu-item"
                        onClick={() => handleReaccionar(msgMenu.msg.id_mensaje, '❤️')}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                          <line x1="9" y1="9" x2="9.01" y2="9" />
                          <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                        <span>Reaccionar</span>
                      </button>

                      <button
                        type="button"
                        className="msg-menu-item"
                        onClick={() => {
                          handleCopiarMensaje(msgMenu.msg);
                          notify("Mensaje listo para reenviar", "info");
                          setMsgMenu((prev) => ({ ...prev, visible: false }));
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 14 20 9 15 4" />
                          <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
                        </svg>
                        <span>Reenviar</span>
                      </button>

                      <button
                        type="button"
                        className="msg-menu-item"
                        onClick={() => handleFijarMensaje(msgMenu.msg.id_mensaje)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="17" x2="12" y2="22" />
                          <path d="M5 17h14v-2l-3-3V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v7l-3 3v2z" />
                        </svg>
                        <span>{mensajesFijados.includes(msgMenu.msg.id_mensaje) ? "Desfijar" : "Fijar"}</span>
                      </button>

                      <button
                        type="button"
                        className="msg-menu-item"
                        onClick={() => handleDestacarMensaje(msgMenu.msg.id_mensaje)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{mensajesDestacados.includes(msgMenu.msg.id_mensaje) ? "Quitar de destacados" : "Destacar"}</span>
                      </button>

                      <div className="msg-menu-divider" />

                      <button
                        type="button"
                        className="msg-menu-item item-danger"
                        onClick={() => handleEliminarMensajeLocal(msgMenu.msg.id_mensaje)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <p>Selecciona una conversación para empezar</p>
              <small>Elige un chat de la lista para ver los mensajes</small>
            </div>
          )}
        </div>

        {/* Panel lateral derecho: Información del contacto / tienda */}
        {mostrarInfoContacto && selectedSala && (
          <aside className="chat-contact-info-drawer">
            {/* Cabecera del panel */}
            <div className="drawer-header">
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMostrarInfoContacto(false)}
                title="Cerrar información"
              >
                ✕
              </button>
              <h3>Info. del contacto</h3>
              <button
                type="button"
                className="drawer-edit-btn"
                title="Configuración y apariencia del chat"
                onClick={() => setMostrarModalConfig(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <div className="drawer-scroll-content">
              {/* Tarjeta de perfil principal */}
              <div className="drawer-profile-card">
                <div className="drawer-avatar-lg">
                  {getIniciales(nombreSalaActiva)}
                </div>
                <h2 className="drawer-user-name">{nombreSalaActiva}</h2>
                <span className="drawer-user-handle">
                  {salaActiva?.correo_tienda || salaActiva?.correo_comprador || ""}
                </span>

                {/* Acciones rápidas (Llamar, Video, Buscar) */}
                <div className="drawer-actions-row">
                  <button
                    type="button"
                    className="drawer-action-btn"
                    onClick={() => setLlamadaActiva({ tipo: "audio", estado: "llamando" })}
                  >
                    <div className="drawer-action-icon">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <span>Llamar</span>
                  </button>

                  <button
                    type="button"
                    className="drawer-action-btn"
                    onClick={() => setLlamadaActiva({ tipo: "video", estado: "llamando" })}
                  >
                    <div className="drawer-action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="13" height="12" rx="3"/><path d="M15 10l5-3v10l-5-3v-4z"/></svg>
                    </div>
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    className="drawer-action-btn"
                    onClick={() => setMostrarBusquedaMensajes(true)}
                  >
                    <div className="drawer-action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="20.5" y2="20.5"/></svg>
                    </div>
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              {/* Teléfono & Correo */}
              {(salaActiva?.telefono_tienda || salaActiva?.correo_tienda || salaActiva?.telefono_comprador || salaActiva?.correo_comprador) && (
                <div className="drawer-section-card">
                  {salaActiva?.telefono_tienda && (
                    <div className="drawer-info-block">
                      <label>Número de teléfono</label>
                      <p>{salaActiva.telefono_tienda}</p>
                    </div>
                  )}
                  {salaActiva?.correo_tienda && (
                    <>
                      {salaActiva?.telefono_tienda && <div className="drawer-divider-line" />}
                      <div className="drawer-info-block">
                        <label>Correo electrónico</label>
                        <p>{salaActiva.correo_tienda}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Archivos, enlaces y documentos */}
              <div className="drawer-section-card">
                <div className="drawer-section-header">
                  <div className="dsh-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>Archivos, enlaces y docs.</span>
                  </div>
                  <span className="dsh-count">4 ▸</span>
                </div>
                <div className="drawer-media-grid">
                  <div className="drawer-media-thumb" style={{ background: '#541223', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFAEC0', fontSize: '12px', fontWeight: 'bold' }}>IMG_01</div>
                  <div className="drawer-media-thumb" style={{ background: '#7A1E3A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '12px', fontWeight: 'bold' }}>IMG_02</div>
                  <div className="drawer-media-thumb" style={{ background: '#3B0B1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFAEC0', fontSize: '12px', fontWeight: 'bold' }}>IMG_03</div>
                  <div className="drawer-media-thumb" style={{ background: '#FCE8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#541223', fontSize: '12px', fontWeight: 'bold' }}>DOC.pdf</div>
                </div>
              </div>

              {/* Mensajes destacados y Notificaciones */}
              <div className="drawer-section-card">
                <button
                  type="button"
                  className="drawer-row-item"
                  onClick={() => alert(`Tienes ${mensajesDestacados.length} mensajes destacados en esta conversación.`)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={mensajesDestacados.length > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span style={{ flex: 1 }}>Mensajes destacados</span>
                  <span className="dsh-count">{mensajesDestacados.length} ▸</span>
                </button>

                <div className="drawer-row-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  <span style={{ flex: 1 }}>Silenciar notificaciones</span>
                  <input
                    type="checkbox"
                    className="drawer-switch"
                    checked={chatsSilenciados.includes(selectedSala)}
                    onChange={() => toggleSilenciar(selectedSala)}
                  />
                </div>

                <button
                  type="button"
                  className="drawer-row-item"
                  onClick={() => alert("Mensajes temporales desactivados.")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <span>Mensajes temporales</span>
                    <small style={{ display: "block", color: "#8696A0", fontSize: "11px" }}>Desactivados</small>
                  </div>
                  <span className="dsh-count">▸</span>
                </button>
              </div>

              {/* Acciones de reporte y bloqueo */}
              <div className="drawer-section-card">
                <button
                  type="button"
                  className="drawer-row-item item-danger"
                  onClick={() => alert(`Se ha enviado el reporte de ${nombreSalaActiva}.`)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                  <span>Reportar a {nombreSalaActiva}</span>
                </button>

                <button
                  type="button"
                  className="drawer-row-item item-danger"
                  onClick={() => {
                    if (window.confirm(`¿Seguro que deseas bloquear a ${nombreSalaActiva}?`)) {
                      alert(`Has bloqueado a ${nombreSalaActiva}.`);
                    }
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  <span>Bloquear a {nombreSalaActiva}</span>
                </button>

                <button
                  type="button"
                  className="drawer-row-item item-danger"
                  onClick={() => eliminarChat(selectedSala)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  <span>Eliminar chat</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Modal flotante estilo WhatsApp de selección completa de reacciones */}
      {modalReacciones.visible && (
        <ReactionPickerModal
          idMensaje={modalReacciones.idMensaje}
          onClose={() => setModalReacciones({ visible: false, idMensaje: null })}
          onSelectEmoji={handleReaccionar}
        />
      )}

      {/* Modal interactivo de Llamada / Videollamada estilo WhatsApp */}
      {llamadaActiva && (
        <div className="whatsapp-call-modal-overlay" onClick={() => setLlamadaActiva(null)}>
          <div className="whatsapp-call-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="call-avatar-wrap">
              <div className="call-avatar-pulse"></div>
              <div className="call-avatar-img">
                {getIniciales(nombreSalaActiva)}
              </div>
            </div>
            <h3 className="call-user-name">{nombreSalaActiva}</h3>
            <p className="call-status-label">
              {llamadaActiva.tipo === "video" ? "Videollamada de BookyHome..." : "Llamada de voz de BookyHome..."}
            </p>
            <div className="call-controls-row">
              <button type="button" className="call-control-btn mute-btn" title="Silenciar micrófono">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </button>
              <button
                type="button"
                className="call-control-btn end-call-btn"
                title="Finalizar llamada"
                onClick={() => setLlamadaActiva(null)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" transform="rotate(135 12 12)" />
                </svg>
              </button>
              <button type="button" className="call-control-btn cam-btn" title="Cámara">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajustes, Aspecto y Personalización del Chat */}
      {mostrarModalConfig && (
        <ChatSettingsModal
          config={configChat}
          setConfig={setConfigChat}
          onClose={() => setMostrarModalConfig(false)}
        />
      )}
    </div>
  );
}