import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword]     = useState('');
  const [confirmar, setConfirmar]   = useState('');
  const [cargando, setCargando]     = useState(false);
  const [exito, setExito]           = useState(false);
  const [errores, setErrores]       = useState({});
  const [errorGlobal, setErrorGlobal] = useState('');

  const validar = () => {
    const e = {};
    if (password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres';
    if (password !== confirmar) e.confirmar = 'Las contraseñas no coinciden';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGlobal('');
    if (!validar()) return;
    setCargando(true);
    try {
      await api.post('/reset-password', { token, password });
      setExito(true);
    } catch (err) {
      setErrorGlobal(err.response?.data?.detail || 'El enlace es inválido o ha expirado.');
    } finally {
      setCargando(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh', background: '#FAF8F5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    },
    card: {
      background: '#fff', borderRadius: 20, padding: '2.5rem 2rem',
      maxWidth: 440, width: '100%',
      boxShadow: '0 4px 24px rgba(122,30,58,0.10)',
      border: '1px solid #f0e8e8',
      textAlign: 'center',
    },
    icon:     { fontSize: '3rem', marginBottom: '1rem' },
    title:    { margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800, color: '#222' },
    subtitle: { margin: '0 0 2rem', color: '#666', fontSize: '0.95rem', lineHeight: 1.5 },
    label:    { display: 'block', textAlign: 'left', fontWeight: 700, color: '#444', marginBottom: 6, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
    input:    { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: 4 },
    inputErr: { borderColor: '#e74c3c' },
    errTxt:   { color: '#e74c3c', fontSize: '0.82rem', textAlign: 'left', marginBottom: 12 },
    field:    { marginBottom: '1rem', textAlign: 'left' },
    btn: {
      width: '100%', padding: '13px', borderRadius: 12, border: 'none',
      background: '#7A1E3A', color: '#fff', fontWeight: 800, fontSize: '1rem',
      cursor: 'pointer', marginTop: 8, transition: 'background 0.2s',
    },
    btnDisabled: { opacity: 0.65, cursor: 'not-allowed' },
    errGlobal: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontSize: '0.88rem', marginBottom: '1rem' },
    link: { color: '#7A1E3A', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', fontSize: '0.9rem' },
  };

  /* ── Sin token ───────────────────────────────────────────── */
  if (!token) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>⚠️</div>
        <h2 style={styles.title}>Enlace inválido</h2>
        <p style={styles.subtitle}>No se encontró un token de restablecimiento. Solicita un nuevo enlace desde la pantalla de inicio de sesión.</p>
        <button style={styles.btn} onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    </div>
  );

  /* ── Éxito ───────────────────────────────────────────────── */
  if (exito) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>✅</div>
        <h2 style={styles.title}>Contraseña actualizada</h2>
        <p style={styles.subtitle}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <button style={styles.btn} onClick={() => navigate('/')}>Ir al inicio de sesión</button>
      </div>
    </div>
  );

  /* ── Formulario ──────────────────────────────────────────── */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>🔐</div>
        <h2 style={styles.title}>Nueva contraseña</h2>
        <p style={styles.subtitle}>Ingresa y confirma tu nueva contraseña para continuar.</p>

        {errorGlobal && <div style={styles.errGlobal}>{errorGlobal}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label htmlFor="nueva-contrasena" style={styles.label}>Nueva contraseña</label>
            <input
              id="nueva-contrasena"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...styles.input, ...(errores.password ? styles.inputErr : {}) }}
              autoComplete="new-password"
            />
            {errores.password && <div style={styles.errTxt}>{errores.password}</div>}
          </div>

          <div style={styles.field}>
            <label htmlFor="confirmar-contrasena" style={styles.label}>Confirmar contraseña</label>
            <input
              id="confirmar-contrasena"
              type="password"
              placeholder="Repite la contraseña"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              style={{ ...styles.input, ...(errores.confirmar ? styles.inputErr : {}) }}
              autoComplete="new-password"
            />
            {errores.confirmar && <div style={styles.errTxt}>{errores.confirmar}</div>}
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{ ...styles.btn, ...(cargando ? styles.btnDisabled : {}) }}
          >
            {cargando ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', color: '#888', fontSize: '0.88rem' }}>
          ¿Recordaste tu contraseña?{' '}
          <button style={styles.link} onClick={() => navigate('/')}>Iniciar sesión</button>
        </p>
      </div>
    </div>
  );
}
