import { useState, useEffect, useCallback } from "react";
import { IconUser, IconStar, IconChartBar, IconBookOpen, IconBook } from "../Icons";
import { notify } from "../ToastProvider";
import api, { getEstadisticasUsuario, uploadProfilePhoto, uploadBannerPhoto, saveBannerColor } from "../../services/api";

const NIVELES_FIDELIZACION = [
  { nivel: 'Bronce', umbral: 0 },
  { nivel: 'Plata', umbral: 50000 },
  { nivel: 'Oro', umbral: 150000 },
  { nivel: 'Zafiro', umbral: 300000 },
  { nivel: 'Rubi', umbral: 500000 },
  { nivel: 'Esmeralda', umbral: 800000 },
  { nivel: 'Amatista', umbral: 1200000 },
  { nivel: 'Perla', umbral: 1700000 },
  { nivel: 'Obsidiana', umbral: 2300000 },
  { nivel: 'Diamante', umbral: 3200000 },
  { nivel: 'Onix', umbral: 4500000 },
  { nivel: 'Platino', umbral: 6500000 }
];

const getSiguienteNivel = (nivelActual) => {
  const index = NIVELES_FIDELIZACION.findIndex((item) => item.nivel === nivelActual);
  return index >= 0 && index < NIVELES_FIDELIZACION.length - 1 ? NIVELES_FIDELIZACION[index + 1].nivel : null;
};

const getUmbralNivel = (nivel) => {
  const nivelEncontrado = NIVELES_FIDELIZACION.find((item) => item.nivel === nivel);
  return nivelEncontrado ? nivelEncontrado.umbral : 0;
};

const getPuntosParaSiguiente = (nivelActual, puntosActuales) => {
  const siguiente = getSiguienteNivel(nivelActual);
  if (!siguiente) return 0;
  const siguienteUmbral = getUmbralNivel(siguiente);
  return Math.max(siguienteUmbral - puntosActuales, 0);
};

export default function SeccionMiPerfil({ userId }) {
  const [userName, setUserName] = useState("");
  const [userSurname, setUserSurname] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [bannerColor, setBannerColor] = useState('#7A1E3A');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [categoriasFavoritas, setCategoriasFavoritas] = useState([]);
  const [nivelFidelizacion, setNivelFidelizacion] = useState(null);
  const [mostrarDetallesFidelizacion, setMostrarDetallesFidelizacion] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener('darkModeChange', handler); window.removeEventListener('storage', handler); };
  }, []);

  // Paleta dinámica
  const t = {
    personalCardBg:   darkMode ? '#17191d' : '#ffffff',
    personalCardBorder: darkMode ? 'rgba(255,255,255,0.08)' : '#e0dbd4',
    labelColor:       darkMode ? '#f3f4f6' : '#2a2a2a',
    inputBg:          darkMode ? '#2b2d30' : '#ffffff',
    inputBorder:      darkMode ? 'rgba(255,255,255,0.08)' : '#e0dbd4',
    inputColor:       darkMode ? '#f5f5f5' : '#1a1a1a',
    inputColorDisabled: darkMode ? '#d1d5db' : '#666',
    divider:          darkMode ? 'rgba(255,255,255,0.08)' : '#e0dbd4',
    loyaltyBg:        darkMode ? '#0d0d0f' : '#f7f5f3',
    loyaltyBorder:    darkMode ? 'rgba(255,255,255,0.15)' : '#e0dbd4',
    statBg:           darkMode ? '#2a2a2a' : '#faf8f6',
    statBorder:       darkMode ? '#333' : '#e0dbd4',
    statLabel:        darkMode ? '#c8c8c8' : '#666',
    bannerEditorBg:   darkMode ? '#252525' : '#f9f7f4',
    bannerEditorBorder: darkMode ? '#3a3a3a' : '#e0dbd4',
    bannerEditorLabel: darkMode ? '#c8c8c8' : '#444',
    catItemBg:        darkMode ? '#2a2a2a' : '#faf8f6',
    catItemBorder:    darkMode ? '#333' : '#e0dbd4',
    catItemText:      darkMode ? '#c8c8c8' : '#666',
    headingColor:     darkMode ? '#f3f4f6' : '#1a1a1a',
  };

  const resolveImageUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    if (!path) return null;
    return `${baseUrl}/${path.replace(/^\//, '')}`;
  };

  const cargarDatosPerfil = useCallback(async () => {
    try {
      const resEstadisticas = await getEstadisticasUsuario();
      if (resEstadisticas.data) {
        setEstadisticas({
          total_gastado: resEstadisticas.data.total_gastado,
          num_compras: resEstadisticas.data.num_compras,
          ticket_promedio: resEstadisticas.data.ticket_promedio
        });
        setCategoriasFavoritas(resEstadisticas.data.categorias_favoritas || []);
        setNivelFidelizacion({
          nivel: resEstadisticas.data.nivel_fidelizacion,
          puntos: resEstadisticas.data.total_gastado,
          siguiente_nivel: getSiguienteNivel(resEstadisticas.data.nivel_fidelizacion),
          puntos_para_siguiente: getPuntosParaSiguiente(resEstadisticas.data.nivel_fidelizacion, resEstadisticas.data.total_gastado)
        });
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setEstadisticas({ total_gastado: 0, num_compras: 0, ticket_promedio: 0 });
      setCategoriasFavoritas([]);
      setNivelFidelizacion({ nivel: 'Bronce', puntos: 0, siguiente_nivel: 'Plata', puntos_para_siguiente: 50000 });
    }
  }, []);

  const cargarPerfil = useCallback(async () => {
    try {
      const res = await api.get('/perfil/mi-perfil');
      if (res.data?.foto_perfil) setProfilePhotoUrl(resolveImageUrl(res.data.foto_perfil));
      if (res.data?.banner_perfil) {
        setBannerUrl(resolveImageUrl(res.data.banner_perfil));
        setBannerColor(null);
      } else if (res.data?.banner_color) {
        setBannerColor(res.data.banner_color);
        setBannerUrl(null);
      }
      if (res.data?.nombre_usuario) {
        const parts = res.data.nombre_usuario.split(" ");
        setUserName(parts[0] || "");
        setUserSurname(parts.slice(1).join(" ") || "");
      }
      if (res.data?.correo_usuario) setUserEmail(res.data.correo_usuario);
      if (res.data?.telefono) setUserPhone(res.data.telefono);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      cargarDatosPerfil();
      cargarPerfil();
    }
  }, [userId, cargarDatosPerfil, cargarPerfil]);

  const onUserNameChange = (e) => setUserName(e.target.value);
  const onUserSurnameChange = (e) => setUserSurname(e.target.value);
  const onUserPhoneChange = (e) => setUserPhone(e.target.value);

  const onProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setPhotoUploading(true);
    try {
      const res = await uploadProfilePhoto(formData);
      if (res.data?.url) {
        const newUrl = resolveImageUrl(res.data.url);
        setProfilePhotoUrl(newUrl);
        // Notificar al sidebar para que actualice la foto
        window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { url: newUrl } }));
        notify('Foto de perfil actualizada', 'success');
      }
    } catch (error) {
      console.error('Error subiendo foto de perfil:', error);
      notify('No se pudo subir la foto', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const onBannerImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setBannerUploading(true);
    try {
      const res = await uploadBannerPhoto(formData);
      if (res.data?.url) {
        const newUrl = resolveImageUrl(res.data.url);
        setBannerUrl(newUrl);
        setBannerColor(null);
        window.dispatchEvent(new CustomEvent('profile-banner-updated', { detail: { bannerUrl: newUrl, bannerColor: null } }));
        notify('Banner actualizado', 'success');
        setShowBannerEditor(false);
      }
    } catch {
      notify('No se pudo subir el banner', 'error');
    } finally {
      setBannerUploading(false);
    }
  };

  const onBannerColorSelect = async (color) => {
    try {
      await saveBannerColor(color);
      setBannerColor(color);
      setBannerUrl(null);
      window.dispatchEvent(new CustomEvent('profile-banner-updated', { detail: { bannerUrl: null, bannerColor: color } }));
      notify('Color de banner guardado', 'success');
      setShowBannerEditor(false);
    } catch {
      notify('No se pudo guardar el color', 'error');
    }
  };

  const onActualizarPerfil = async () => {
    try {
      await api.put('/perfil/actualizar', {
        nombre_usuario: userName + " " + userSurname,
        telefono: userPhone
      });
      notify("Perfil actualizado", "success");
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      notify("Error al actualizar perfil", "error");
    }
  };

  const getNivelColor = (nivel) => {
    const colores = {
      'Bronce': { bg: '#3A2618', border: '#CD7F32', text: '#F0A35E', progress: '#CD7F32' },
      'Plata': { bg: '#34383D', border: '#C0C0C0', text: '#E5E7EB', progress: '#C0C0C0' },
      'Oro': { bg: '#493A0A', border: '#FFD700', text: '#FFE36E', progress: '#FFD700' },
      'Zafiro': { bg: '#102A4A', border: '#42A5F5', text: '#90CAF9', progress: '#42A5F5' },
      'Rubi': { bg: '#47151C', border: '#E53935', text: '#FF8A80', progress: '#E53935' },
      'Esmeralda': { bg: '#123B27', border: '#43A047', text: '#86EFAC', progress: '#43A047' },
      'Amatista': { bg: '#321842', border: '#AB47BC', text: '#D8B4FE', progress: '#AB47BC' },
      'Perla': { bg: '#E8EDF0', border: '#CFD8DC', text: '#455A64', progress: '#B0BEC5' },
      'Obsidiana': { bg: '#161A1D', border: '#607D8B', text: '#CFD8DC', progress: '#607D8B' },
      'Diamante': { bg: '#123B4A', border: '#29B6F6', text: '#81D4FA', progress: '#29B6F6' },
      'Onix': { bg: '#090909', border: '#8A8A8A', text: '#F5F5F5', progress: '#8A8A8A' },
      'Platino': { bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0', progress: '#90CAF9' }
    };
    return colores[nivel] || colores['Bronce'];
  };

  const getProgressGradient = (nivel) => {
    const color = getNivelColor(nivel);
    const base = color.progress || '#8A8A8A';
    return `linear-gradient(90deg, ${base} 0%, ${base} 60%, rgba(0,0,0,0.88) 100%)`;
  };

  const calcularProgresoNivel = (nivelInfo) => {
    if (!nivelInfo || !nivelInfo.siguiente_nivel) return 100;

    const nivelActual = nivelInfo.nivel;
    const puntosActuales = nivelInfo.puntos;
    const umbralActual = getUmbralNivel(nivelActual);
    const siguiente = getSiguienteNivel(nivelActual);
    const umbralSiguiente = siguiente ? getUmbralNivel(siguiente) : null;

    if (!umbralSiguiente || umbralSiguiente <= umbralActual) return 100;

    const progreso = ((puntosActuales - umbralActual) / (umbralSiguiente - umbralActual)) * 100;
    return Math.min(Math.max(progreso, 0), 100);
  };

  const progresoNivel = nivelFidelizacion ? Math.max(calcularProgresoNivel(nivelFidelizacion), 8) : 0;
  const nivelColorActual = getNivelColor(nivelFidelizacion?.nivel || 'Bronce');
  return (
    <div className="perfil-page">
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconUser width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0 }}>Mi Perfil</h2>
        </div>
      </div>
      {/* Información Personal y Nivel de Fidelización - Lado a lado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 20, alignItems: "stretch" }}>
        {/* Información Personal - Simplificada */}
        <div className="pl-card perfil-personal-card" style={{ padding: "1.6rem 1.4rem 1.2rem", background: t.personalCardBg, border: `1px solid ${t.personalCardBorder}`, borderRadius: "18px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: t.headingColor, fontSize: "1.2rem" }}>Información Personal</h3>
          {/* Foto de Perfil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `1px solid ${t.divider}` }}>
            <div style={{ flexShrink: 0 }}>
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Foto de perfil" style={{
                  width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #7A1E3A'
                }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#e0dbd4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#7A1E3A', fontWeight: 'bold', border: '3px solid #7A1E3A' }}>
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Foto de Perfil</h3>
              <p style={{ margin: '0 0 1rem 0', color: t.statLabel, fontSize: '0.9rem' }}>
                Sube una foto para personalizar tu perfil
              </p>
              <input 
                type="file" 
                id="foto-perfil-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onProfilePhotoChange}
              />
              <label 
                htmlFor="foto-perfil-input"
                style={{
                  background: 'var(--vinotinto)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-block'
                }}
              >
                {photoUploading ? 'Subiendo...' : 'Cambiar Foto'}
              </label>
            </div>
          </div>

          {/* Banner de Perfil */}
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `1px solid ${t.divider}` }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700, color: t.headingColor }}>Banner de Perfil</h3>
            {/* Preview del banner actual */}
            <div style={{
              width: '100%', height: '80px', borderRadius: '10px', marginBottom: '12px',
              background: bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : (bannerColor || '#7A1E3A'),
              border: '2px solid #e0dbd4', position: 'relative', overflow: 'hidden',
            }}>
              <button
                onClick={() => setShowBannerEditor(v => !v)}
                style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none',
                  borderRadius: '6px', padding: '4px 12px', fontSize: '0.8rem',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                ✏️ Editar
              </button>
            </div>

            {/* Editor de banner */}
            {showBannerEditor && (
              <div style={{ background: t.bannerEditorBg, borderRadius: '10px', padding: '1rem', border: `1px solid ${t.bannerEditorBorder}` }}>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: t.bannerEditorLabel }}>Subir imagen</p>
                  <input type="file" id="banner-img-input" accept="image/*" style={{ display: 'none' }} onChange={onBannerImageChange} />
                  <label htmlFor="banner-img-input" style={{
                    background: 'var(--vinotinto)', color: 'white', padding: '8px 16px',
                    borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-block',
                  }}>
                    {bannerUploading ? 'Subiendo...' : '📁 Elegir imagen'}
                  </label>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: t.bannerEditorLabel }}>Colores sólidos</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['#7A1E3A','#1E3A7A','#1E7A3A','#7A6A1E','#3A1E7A','#1E6A7A','#2A2A2A','#8B4513'].map(c => (
                      <button key={c} onClick={() => onBannerColorSelect(c)}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: bannerColor === c ? '3px solid #fff' : '2px solid #ccc', cursor: 'pointer', boxShadow: bannerColor === c ? `0 0 0 2px ${c}` : 'none' }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: t.bannerEditorLabel }}>Gradientes</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      'linear-gradient(135deg, #7A1E3A, #3A1E7A)',
                      'linear-gradient(135deg, #1E3A7A, #1E7A6A)',
                      'linear-gradient(135deg, #7A6A1E, #7A1E3A)',
                      'linear-gradient(135deg, #2A2A2A, #7A1E3A)',
                      'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
                      'linear-gradient(135deg, #373B44, #4286f4)',
                      'linear-gradient(135deg, #834d9b, #d04ed6)',
                      'linear-gradient(135deg, #f093fb, #f5576c)',
                    ].map((g, i) => (
                      <button key={i} onClick={() => onBannerColorSelect(g)}
                        style={{ width: 32, height: 32, borderRadius: '8px', background: g, border: bannerColor === g ? '3px solid #fff' : '2px solid #ccc', cursor: 'pointer', boxShadow: bannerColor === g ? '0 0 0 2px #7A1E3A' : 'none' }}
                        title={`Gradiente ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: t.bannerEditorLabel }}>Color personalizado</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" defaultValue="#7A1E3A"
                      onChange={e => setBannerColor(e.target.value)}
                      style={{ width: 40, height: 40, border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                    />
                    <button onClick={() => onBannerColorSelect(bannerColor || '#7A1E3A')}
                      style={{ background: 'var(--vinotinto)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información del usuario */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontWeight: 600, color: t.labelColor, display: "block", marginBottom: "6px" }}>Nombres</label>
                <input type="text" value={userName} onChange={onUserNameChange} style={{ width: "100%", height: "52px", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputColor, fontSize: "1rem", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontWeight: 600, color: t.labelColor, display: "block", marginBottom: "6px" }}>Apellidos</label>
                <input type="text" value={userSurname} onChange={onUserSurnameChange} style={{ width: "100%", height: "52px", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputColor, fontSize: "1rem", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: t.labelColor, display: "block", marginBottom: "6px" }}>Correo electrónico</label>
              <input type="email" value={userEmail} readOnly style={{ width: "100%", height: "52px", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputColorDisabled, fontSize: "1rem", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: t.labelColor, display: "block", marginBottom: "6px" }}>Celular</label>
              <input type="tel" value={userPhone} onChange={onUserPhoneChange} style={{ width: "100%", height: "52px", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputColor, fontSize: "1rem", boxSizing: "border-box" }} />
            </div>
            <button onClick={onActualizarPerfil} style={{ background: "#7A1E3A", color: "white", border: "none", padding: "14px 24px", borderRadius: "10px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "8px", width: "100%" }}>
              Guardar cambios
            </button>
          </div>
        </div>
        {/* Nivel de Fidelización */}
        <div className="pl-card perfil-loyalty-card" style={{ padding: "2rem 2rem 0.5rem", alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "flex-start", height: "100%" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconStar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Nivel de Fidelización
          </h3>
          <div className="perfil-loyalty-panel" style={{ 
            background: t.loyaltyBg,
            padding: "2.1rem 2rem 1.1rem",
            borderRadius: "16px",
            border: `1px solid ${t.loyaltyBorder}`,
            textAlign: "center",
            position: "relative",
            boxShadow: darkMode ? "0 18px 30px rgba(0,0,0,0.22)" : "0 10px 20px rgba(26,26,26,0.08)",
            minHeight: "calc(100% - 48px)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            width: "100%"
          }}>
            <div style={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: nivelFidelizacion?.nivel === 'Onix' ? '#121212' : (darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.04)"),
              border: nivelFidelizacion?.nivel === 'Onix' ? '2px solid rgba(255,255,255,0.26)' : 'none',
              marginBottom: "1.25rem",
              boxShadow: darkMode ? "inset 0 0 0 1px rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.30)" : "inset 0 0 0 1px rgba(0,0,0,0.04), 0 8px 18px rgba(0,0,0,0.08)",
              marginLeft: "auto",
              marginRight: "auto"
            }}>
              <IconStar width={50} height={50} strokeWidth={2} style={{ color: nivelFidelizacion?.nivel === 'Onix' ? '#ffffff' : nivelColorActual.border }} />
            </div>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: darkMode ? "#f5f5f5" : "#1a1a1a", marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1.1 }}>
              {nivelFidelizacion?.nivel || 'Bronce'}
            </div>
            <div style={{ color: darkMode ? "#d4d4d8" : "#3b3b3b", fontSize: "1.15rem", marginBottom: "1.6rem", fontWeight: 500 }}>
              ${Math.floor(nivelFidelizacion?.puntos || 0).toLocaleString('es-CO')} COP gastados
            </div>
            {!nivelFidelizacion?.siguiente_nivel && (
              <div className="perfil-max-level-message">
                ★ Has alcanzado el nivel máximo de fidelización
              </div>
            )}
            {nivelFidelizacion?.siguiente_nivel && (
              <div style={{ marginTop: "0.25rem", paddingTop: "1rem", borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : '#e0dbd4'}`, textAlign: "left", width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.95rem", color: darkMode ? "#e5e7eb" : "#111827", marginBottom: "0.7rem", width: "100%" }}>
                  <span>Próximo: <strong style={{ color: darkMode ? "#ffffff" : "#111827" }}>{nivelFidelizacion.siguiente_nivel}</strong></span>
                  <span style={{ color: darkMode ? "#f5f5f5" : "#111827" }}>${Math.floor(nivelFidelizacion.puntos_para_siguiente).toLocaleString('es-CO')} COP</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", fontSize: "0.82rem", fontWeight: 700, color: darkMode ? "#d4d4d8" : "#374151", width: "100%" }}>
                  <span>Progreso</span>
                  <span>{Math.min(Math.round(progresoNivel), 100)}%</span>
                </div>
                <div style={{ width: "100%", height: "12px", background: darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)", borderRadius: "999px", overflow: "hidden", border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#d8d2cc'}`, boxShadow: darkMode ? "inset 0 1px 3px rgba(0,0,0,0.18)" : "inset 0 1px 2px rgba(0,0,0,0.04)", marginTop: "0.2rem" }}>
                  <div style={{ width: `${progresoNivel}%`, height: "100%", background: getProgressGradient(nivelFidelizacion?.nivel), transition: "width 0.5s ease", borderRadius: "999px", boxShadow: "0 0 10px rgba(0,0,0,0.20)" }} />
                </div>
              </div>
            )}

            <div style={{ marginTop: "1.1rem", paddingTop: "6rem", borderTop: `0px solid ${darkMode ? 'rgba(255,255,255,0.12)' : '#e0dbd4'}`, textAlign: "left", width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
              <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem", color: darkMode ? "#d4d4d8" : "#3f3f46", lineHeight: 1.6, width: "100%" }}>
                La fidelización del comprador se calcula con el total gastado en compras válidas. Cada vez que alcanzas un umbral, subes de nivel y desbloqueas mejor reconocimiento dentro de BookyHome.
              </p>
              <div style={{ width: "100%", display: "flex", justifyContent: "flex-start" }}>
                <button
                  type="button"
                  onClick={() => setMostrarDetallesFidelizacion(true)}
                  style={{
                    background: "transparent",
                    color: darkMode ? "#7cc2ff" : "#7A1E3A",
                    border: "none",
                    borderRadius: "0",
                    padding: "0",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    width: "fit-content",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px"
                  }}
                >
                  Ver detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarDetallesFidelizacion && (
        <div
          onClick={() => setMostrarDetallesFidelizacion(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1.5rem"
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(760px, 100%)",
              maxHeight: "80vh",
              overflowY: "auto",
              background: darkMode ? '#17191d' : '#ffffff',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : '#e0dbd4'}`,
              borderRadius: "18px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.56)",
              color: darkMode ? '#f3f4f6' : '#1a1a1a'
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 1.4rem", borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e0dbd4'}` }}>
              <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: darkMode ? '#f5f5f5' : '#1a1a1a' }}>Escala de fidelización</h4>
              <button type="button" onClick={() => setMostrarDetallesFidelizacion(false)}
                style={{ background: "transparent", border: "none", color: darkMode ? '#d4d4d8' : '#666', fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}>
                ×
              </button>
            </div>
            <div style={{ padding: "1rem 1.1rem 1.2rem" }}>
              {NIVELES_FIDELIZACION.map(({ nivel, umbral }) => {
                const color = getNivelColor(nivel);
                return (
                  <div key={nivel} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                    padding: "0.9rem 1rem", borderRadius: "10px",
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e0dbd4'}`,
                    background: darkMode ? 'rgba(255,255,255,0.02)' : '#faf8f6',
                    marginBottom: "0.75rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: color.border, display: "inline-block", boxShadow: `0 0 0 2px ${color.border}55` }}
                      />
                      <span style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: darkMode ? "#f5f5f5" : "#1a1a1a" }}>{nivel}</span>
                    </div>
                    <span style={{ color: darkMode ? "#d4d4d8" : "#555", fontWeight: 600 }}>
                      {umbral === 0 ? "Desde 0" : `$${Number(umbral).toLocaleString('es-CO')} COP`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de Compras */}
      <div className="pl-card perfil-stats-card" style={{ padding: "2rem", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconChartBar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Estadísticas de Compras
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div className="perfil-stat-item" style={{ background: t.statBg, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${t.statBorder}` }}>
            <p style={{ margin: 0, color: t.statLabel, fontSize: "0.9rem" }}>Total Gastado</p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
              ${Math.floor(estadisticas?.total_gastado || 0).toLocaleString('es-CO')} COP
            </p>
          </div>
          <div className="perfil-stat-item" style={{ background: t.statBg, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${t.statBorder}` }}>
            <p style={{ margin: 0, color: t.statLabel, fontSize: "0.9rem" }}>Número de Compras</p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
              {estadisticas?.num_compras || 0}
            </p>
          </div>
          <div className="perfil-stat-item" style={{ background: t.statBg, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${t.statBorder}` }}>
            <p style={{ margin: 0, color: t.statLabel, fontSize: "0.9rem" }}>Ticket Promedio</p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
              ${Math.floor(estadisticas?.ticket_promedio || 0).toLocaleString('es-CO')} COP
            </p>
          </div>
        </div>
      </div>
      {/* Categorías Favoritas */}
      <div className="pl-card perfil-categories-card" style={{ padding: "2rem", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconBookOpen width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Categorías Favoritas
        </h3>
        <p style={{ color: t.statLabel, fontSize: "0.9rem", marginBottom: "1rem" }}>Basado en tu historial de compras</p>
        {categoriasFavoritas.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            {categoriasFavoritas.map((cat, index) => (
              <div key={index} className="perfil-category-item" style={{ background: t.catItemBg, padding: "1rem", borderRadius: "8px", border: `1px solid ${t.catItemBorder}`, textAlign: "center" }}>
                <span style={{ fontSize: "1.5rem", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                </span>
                <p style={{ margin: "0.5rem 0 0 0", fontWeight: 600, color: t.labelColor }}>{cat.nombre}</p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: t.catItemText }}>{cat.conteo} compra{cat.conteo > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: t.statLabel }}>
            {estadisticas?.num_compras > 0 ? (
              <div>
                <p>Tienes compras activas pero necesitamos más detalles de tus pedidos para calcular tus categorías favoritas.</p>
                <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>A medida que realices más compras con detalles completos, podrás ver tus preferencias aquí.</p>
              </div>
            ) : (
              <p>Aún no tienes categorías favoritas. Compra libros para ver tus preferencias aquí.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
