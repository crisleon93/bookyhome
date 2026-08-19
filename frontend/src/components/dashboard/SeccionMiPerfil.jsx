import { useState, useEffect, useCallback } from "react";
import { IconUser, IconStar, IconChartBar, IconBookOpen, IconBook } from "../Icons";
import { notify } from "../ToastProvider";
import api, { getEstadisticasUsuario, uploadProfilePhoto, uploadBannerPhoto, saveBannerColor } from "../../services/api";

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

  const resolveImageUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    if (!path) return null;
    return `${baseUrl}/${path.replace(/^\//, '')}`;
  };

  const getSiguienteNivel = (nivelActual) => {
    const niveles = ['Bronce', 'Plata', 'Oro', 'Platino'];
    const index = niveles.indexOf(nivelActual);
    return index < niveles.length - 1 ? niveles[index + 1] : null;
  };

  const getPuntosParaSiguiente = (nivelActual, puntosActuales) => {
    const umbrales = { 'Bronce': 50000, 'Plata': 150000, 'Oro': 300000 };
    const siguiente = getSiguienteNivel(nivelActual);
    if (siguiente && umbrales[nivelActual]) {
      return umbrales[nivelActual] - puntosActuales;
    }
    return 0;
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
    } catch (error) {
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
    } catch (error) {
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
      'Bronce': { bg: '#FFF8E1', border: '#CD7F32', text: '#CD7F32', progress: '#CD7F32' },
      'Plata': { bg: '#F5F5F5', border: '#C0C0C0', text: '#757575', progress: '#C0C0C0' },
      'Oro': { bg: '#FFFDE7', border: '#FFD700', text: '#FF8F00', progress: '#FFD700' },
      'Platino': { bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0', progress: '#42A5F5' }
    };
    return colores[nivel] || colores['Bronce'];
  };

  const calcularProgresoNivel = (nivelInfo) => {
    if (!nivelInfo || !nivelInfo.siguiente_nivel) return 100;
    const umbrales = { 'Bronce': 50000, 'Plata': 150000, 'Oro': 300000 };
    const nivelActual = nivelInfo.nivel;
    const puntosActuales = nivelInfo.puntos;
    if (umbrales[nivelActual]) {
      const progreso = (puntosActuales / umbrales[nivelActual]) * 100;
      return Math.min(Math.max(progreso, 0), 100);
    }
    return 0;
  };
  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconUser width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0 }}>Mi Perfil</h2>
        </div>
      </div>
      {/* Información Personal y Nivel de Fidelización - Lado a lado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 20 }}>
        {/* Información Personal - Simplificada */}
        <div className="pl-card" style={{ padding: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>Información Personal</h3>
          {/* Foto de Perfil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0dbd4' }}>
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
              <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
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
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0dbd4' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700 }}>Banner de Perfil</h3>
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
              <div style={{ background: '#f9f7f4', borderRadius: '10px', padding: '1rem', border: '1px solid #e0dbd4' }}>
                {/* Subir imagen */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: '#444' }}>Subir imagen</p>
                  <input type="file" id="banner-img-input" accept="image/*" style={{ display: 'none' }} onChange={onBannerImageChange} />
                  <label htmlFor="banner-img-input" style={{
                    background: 'var(--vinotinto)', color: 'white', padding: '8px 16px',
                    borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-block',
                  }}>
                    {bannerUploading ? 'Subiendo...' : '📁 Elegir imagen'}
                  </label>
                </div>

                {/* Colores predefinidos */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: '#444' }}>Colores sólidos</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['#7A1E3A','#1E3A7A','#1E7A3A','#7A6A1E','#3A1E7A','#1E6A7A','#2A2A2A','#8B4513'].map(c => (
                      <button key={c} onClick={() => onBannerColorSelect(c)}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: bannerColor === c ? '3px solid #fff' : '2px solid #ccc', cursor: 'pointer', boxShadow: bannerColor === c ? `0 0 0 2px ${c}` : 'none' }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Gradientes predefinidos */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: '#444' }}>Gradientes</p>
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

                {/* Color personalizado */}
                <div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: '#444' }}>Color personalizado</p>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Nombres</label>
                <input type="text" value={userName} onChange={onUserNameChange} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }} />
              </div>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Apellidos</label>
                <input type="text" value={userSurname} onChange={onUserSurnameChange} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }} />
              </div>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Correo electrónico</label>
              <input type="email" value={userEmail} readOnly style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#f5f5f5", color: "#888" }} />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Celular</label>
              <input type="tel" value={userPhone} onChange={onUserPhoneChange} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }} />
            </div>
            <button onClick={onActualizarPerfil} style={{ background: "var(--vinotinto)", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", marginTop: "8px" }}>
              Guardar cambios
            </button>
          </div>
        </div>
        {/* Nivel de Fidelización */}
        <div className="pl-card" style={{ padding: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconStar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Nivel de Fidelización
          </h3>
          <div style={{ 
            background: getNivelColor(nivelFidelizacion?.nivel).bg, 
            padding: "2rem", 
            borderRadius: "16px", 
            border: `3px solid ${getNivelColor(nivelFidelizacion?.nivel).border}`,
            textAlign: "center",
            position: "relative",
            boxShadow: `0 8px 24px ${getNivelColor(nivelFidelizacion?.nivel).border}20`
          }}>
            <div style={{ 
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: getNivelColor(nivelFidelizacion?.nivel).border,
              marginBottom: "1.5rem",
              boxShadow: `0 4px 12px ${getNivelColor(nivelFidelizacion?.nivel).border}40`
            }}>
              <IconStar width={50} height={50} strokeWidth={2} style={{ color: "white" }} />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: getNivelColor(nivelFidelizacion?.nivel).text, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "2px" }}>
              {nivelFidelizacion?.nivel || 'Bronce'}
            </div>
            <div style={{ color: "#666", fontSize: "1rem", marginBottom: "1.5rem" }}>
              ${Math.floor(nivelFidelizacion?.puntos || 0).toLocaleString('es-CO')} COP gastados
            </div>
            {nivelFidelizacion?.siguiente_nivel && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                  <span>Próximo: <strong>{nivelFidelizacion.siguiente_nivel}</strong></span>
                  <span>${Math.floor(nivelFidelizacion.puntos_para_siguiente).toLocaleString('es-CO')} COP</span>
                </div>
                <div style={{ width: "100%", height: "10px", background: "rgba(0,0,0,0.1)", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ width: `${calcularProgresoNivel(nivelFidelizacion)}%`, height: "100%", background: getNivelColor(nivelFidelizacion?.nivel).progress, transition: "width 0.5s ease", borderRadius: "5px" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Estadísticas de Compras */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconChartBar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Estadísticas de Compras
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#faf8f6", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e0dbd4" }}>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>Total Gastado</p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
              ${Math.floor(estadisticas?.total_gastado || 0).toLocaleString('es-CO')} COP
            </p>
          </div>
          <div style={{ background: "#faf8f6", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e0dbd4" }}>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>Número de Compras</p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
              {estadisticas?.num_compras || 0}
            </p>
          </div>
          <div style={{ background: "#faf8f6", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e0dbd4" }}>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>Ticket Promedio</p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
              ${Math.floor(estadisticas?.ticket_promedio || 0).toLocaleString('es-CO')} COP
            </p>
          </div>
        </div>
      </div>
      {/* Categorías Favoritas */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconBookOpen width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Categorías Favoritas
        </h3>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>Basado en tu historial de compras</p>
        {categoriasFavoritas.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            {categoriasFavoritas.map((cat, index) => (
              <div key={index} style={{ background: "#faf8f6", padding: "1rem", borderRadius: "8px", border: "1px solid #e0dbd4", textAlign: "center" }}>
                <span style={{ fontSize: "1.5rem", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                </span>
                <p style={{ margin: "0.5rem 0 0 0", fontWeight: 600 }}>{cat.nombre}</p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>{cat.conteo} compra{cat.conteo > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
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
    </>
  );
}
