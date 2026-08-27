import { useState, useEffect, useCallback } from "react";
import api, { uploadProfilePhoto, uploadBannerPhoto, saveBannerColor } from "../../services/api";
import { notify } from "../ToastProvider";
import {
  IconUser, IconUsers, IconBook, IconPackage, IconStore,
  IconAlertTriangle, IconTool, IconCheck, IconSettings
} from "../Icons";

export default function SeccionPerfilAdmin({ stats }) {
  const [userName, setUserName] = useState("");
  const [userSurname, setUserSurname] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [fechaRegistro, setFechaRegistro] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [bannerColor, setBannerColor] = useState('#7A1E3A');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [gestion, setGestion] = useState({ reclamos: 0, soporte: 0, resueltos: 0, pendientes: 0 });

  const resolveImageUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    if (!path) return null;
    return `${baseUrl}/${path.replace(/^\//, '')}`;
  };

  const cargarGestion = useCallback(async () => {
    try {
      const res = await api.get('/quejas/admin/todas');
      const lista = Array.isArray(res.data) ? res.data : [];
      setGestion({
        reclamos: lista.filter(s => s.tipo_solicitud === 'Reclamo').length,
        soporte: lista.filter(s => s.tipo_solicitud !== 'Reclamo').length,
        resueltos: lista.filter(s => s.estado === 'Resuelto').length,
        pendientes: lista.filter(s => ['Abierto', 'En revisión', 'En revision'].includes(s.estado)).length,
      });
    } catch (error) {
      console.error('Error cargando gestión:', error);
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
      if (res.data?.fecha_registro) setFechaRegistro(res.data.fecha_registro);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
    cargarGestion();
  }, [cargarPerfil, cargarGestion]);

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

  const formatearFecha = (f) => {
    if (!f) return null;
    try {
      return new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const plataformasStats = [
    { label: 'Usuarios registrados', valor: stats?.usuarios ?? 0, Icon: IconUsers },
    { label: 'Libros publicados', valor: stats?.libros ?? 0, Icon: IconBook },
    { label: 'Órdenes totales', valor: stats?.ordenes ?? 0, Icon: IconPackage },
    { label: 'Tiendas activas', valor: stats?.tiendas ?? 0, Icon: IconStore },
  ];

  const gestionStats = [
    { label: 'Reclamos recibidos', valor: gestion.reclamos, Icon: IconAlertTriangle, color: '#ea580c' },
    { label: 'Tickets de soporte', valor: gestion.soporte, Icon: IconTool, color: '#3b82f6' },
    { label: 'Resueltos', valor: gestion.resueltos, Icon: IconCheck, color: '#16a34a' },
    { label: 'Pendientes', valor: gestion.pendientes, Icon: IconSettings, color: '#7A1E3A' },
  ];

  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconUser width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0 }}>Mi Perfil</h2>
        </div>
      </div>
      {/* Información Personal y Cuenta Administrador - Lado a lado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 20 }}>
        {/* Información Personal */}
        <div className="pl-card" style={{ padding: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>Información Personal</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0dbd4' }}>
            <div style={{ flexShrink: 0 }}>
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Foto de perfil" style={{
                  width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #7A1E3A'
                }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#e0dbd4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#7A1E3A', fontWeight: 'bold', border: '3px solid #7A1E3A' }}>
                  {userName?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Foto de Perfil</h3>
              <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
                Sube una foto para personalizar tu perfil
              </p>
              <input type="file" id="foto-perfil-admin-input" accept="image/*" style={{ display: 'none' }} onChange={onProfilePhotoChange} />
              <label htmlFor="foto-perfil-admin-input" style={{
                background: 'var(--vinotinto)', color: 'white', padding: '0.5rem 1rem',
                borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', display: 'inline-block'
              }}>
                {photoUploading ? 'Subiendo...' : 'Cambiar Foto'}
              </label>
            </div>
          </div>

          {/* Banner de Perfil */}
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0dbd4' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700 }}>Banner de Perfil</h3>
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
                Editar
              </button>
            </div>

            {showBannerEditor && (
              <div style={{ background: '#f9f7f4', borderRadius: '10px', padding: '1rem', border: '1px solid #e0dbd4' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: '#444' }}>Subir imagen</p>
                  <input type="file" id="banner-img-admin-input" accept="image/*" style={{ display: 'none' }} onChange={onBannerImageChange} />
                  <label htmlFor="banner-img-admin-input" style={{
                    background: 'var(--vinotinto)', color: 'white', padding: '8px 16px',
                    borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-block',
                  }}>
                    {bannerUploading ? 'Subiendo...' : 'Elegir imagen'}
                  </label>
                </div>

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
        {/* Cuenta de Administrador */}
        <div className="pl-card" style={{ padding: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconSettings width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Cuenta de Administrador
          </h3>
          <div style={{
            background: 'linear-gradient(135deg, #fdf2f6 0%, #fbe8ef 100%)',
            padding: "2rem",
            borderRadius: "16px",
            border: "3px solid #7A1E3A",
            textAlign: "center",
            position: "relative",
            boxShadow: "0 8px 24px rgba(122,30,58,0.12)"
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: profilePhotoUrl ? `url(${profilePhotoUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)',
              marginBottom: "1.5rem",
              boxShadow: "0 4px 12px rgba(122,30,58,0.25)",
              border: '3px solid #fff'
            }}>
              {!profilePhotoUrl && (
                <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "white" }}>
                  {userName?.charAt(0).toUpperCase() || 'A'}
                </span>
              )}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: '#7A1E3A', marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "2px" }}>
              Administrador
            </div>
            <div style={{ color: "#666", fontSize: "1rem", marginBottom: "0.75rem" }}>
              {userName} {userSurname}
            </div>
            {fechaRegistro && (
              <div style={{ color: "#888", fontSize: "0.88rem" }}>
                Miembro desde {formatearFecha(fechaRegistro)}
              </div>
            )}
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fff', border: '1px solid #ecdce3', borderRadius: 999,
                padding: '6px 16px', fontSize: '0.85rem', fontWeight: 700, color: '#7A1E3A',
              }}>
                Acceso total a la plataforma
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Estadísticas de la Plataforma */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>
          Estadísticas de la Plataforma
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {plataformasStats.map(({ label, valor, Icon }) => (
            <div key={label} style={{ background: "#faf8f6", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e0dbd4", display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fdf2f6', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon width={22} height={22} strokeWidth={2} style={{ color: '#7A1E3A' }} />
              </div>
              <div>
                <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>{label}</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
                  {(valor || 0).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestión de Solicitudes */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>
          Gestión de Solicitudes
        </h3>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Resumen de quejas, reclamos y tickets de soporte de la comunidad
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {gestionStats.map(({ label, valor, Icon, color }) => (
            <div key={label} style={{ background: "#faf8f6", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e0dbd4", display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}14`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon width={22} height={22} strokeWidth={2} style={{ color }} />
              </div>
              <div>
                <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>{label}</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "1.5rem", fontWeight: 700, color }}>
                  {(valor || 0).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
