import { IconSettings, IconEyeOpen, IconEyeClosed } from "../Icons";
import { notify } from "../ToastProvider";
import { useState, useEffect } from "react";

export default function SeccionConfiguracion({ userId }) {
  const [preferencias, setPreferencias] = useState({
    notificaciones_mensajes: { email: true, web: true },
    notificaciones_resenas: { email: true, web: true },
    notificaciones_ofertas: { email: true, web: false },
    notificaciones_pedidos: { email: true, web: true },
    notificaciones_entregas: { email: true, web: true },
    notificaciones_pagos: { email: true, web: true },
    notificaciones_sistema: { email: true, web: true }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirmar: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Estado para preferencias visuales
  const [darkMode, setDarkMode] = useState(false);

  // Cargar preferencias del usuario
  useEffect(() => {
    const cargarPreferencias = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/perfil/mi-perfil', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.preferencias) {
            setPreferencias(data.preferencias);
          }
        }
      } catch (error) {
        console.error('Error al cargar preferencias:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarPreferencias();
    
    // Cargar estado de modo oscuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Aplicar clase dark al documento si está activo
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Guardar preferencias
  const guardarPreferencias = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/perfil/preferencias', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencias)
      });
      if (response.ok) {
        notify("Preferencias guardadas", "success");
      } else {
        notify("Error al guardar preferencias", "error");
      }
    } catch (error) {
      console.error('Error al guardar preferencias:', error);
      notify("Error al guardar preferencias", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleCanal = (tipoNotificacion, canal) => {
    setPreferencias(prev => ({
      ...prev,
      [tipoNotificacion]: {
        ...prev[tipoNotificacion],
        [canal]: !prev[tipoNotificacion][canal]
      }
    }));
  };

  // Función para cambiar modo oscuro
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    
    // Aplicar clase al documento
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Disparar evento para que otros componentes sepan del cambio
    window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { darkMode: newMode } }));
    
    notify(newMode ? "Modo oscuro activado" : "Modo claro activado", "success");
  };

  // Función para cambiar contraseña
  const cambiarPassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.password_nueva !== passwordForm.password_confirmar) {
      notify("Las contraseñas nuevas no coinciden", "error");
      return;
    }
    
    if (passwordForm.password_nueva.length < 6) {
      notify("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    
    setChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/perfil/cambiar-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password_actual: passwordForm.password_actual,
          password_nueva: passwordForm.password_nueva
        })
      });
      
      if (response.ok) {
        notify("Contraseña actualizada correctamente", "success");
        setPasswordForm({
          password_actual: '',
          password_nueva: '',
          password_confirmar: ''
        });
        setShowPasswordForm(false);
      } else {
        const error = await response.json();
        notify(error.detail || "Error al cambiar contraseña", "error");
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      notify("Error al cambiar contraseña", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24, background: darkMode ? "#1e1e1e" : "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconSettings width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0, color: darkMode ? "#e0e0e0" : "#2a2a2a" }}>Configuración de Cuenta</h2>
        </div>
      </div>
      {/* Preferencias de Notificaciones */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20, background: darkMode ? "#1e1e1e" : "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
          <div style={{ 
            width: "40px", height: "40px", borderRadius: "8px", 
            background: "linear-gradient(135deg, #7A1E3A 0%, #9a2e52 100%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, color: darkMode ? "#e05a7a" : "var(--vinotinto)", fontSize: "1.3rem", fontWeight: 700 }}>Preferencias de Notificaciones</h3>
            <p style={{ margin: "0.2rem 0 0 0", color: darkMode ? "#c8c8c8" : "#666", fontSize: "0.85rem" }}>
              Personaliza dónde recibir cada tipo de notificación
            </p>
          </div>
        </div>
        
        {/* Headers de canales */}
        <div style={{ 
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", 
          marginBottom: "0.8rem", padding: "1rem 1.2rem", 
          background: darkMode ? "#252525" : "#f8f6f4", 
          borderRadius: "10px", border: darkMode ? "1px solid #3a3a3a" : "1px solid #e8e4e0",
          boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ fontWeight: 700, color: darkMode ? "#e0e0e0" : "#2a2a2a", fontSize: "0.9rem", letterSpacing: "0.3px" }}>Tipo de notificación</div>
          <div style={{ 
            fontWeight: 700, color: darkMode ? "#e0e0e0" : "#2a2a2a", fontSize: "0.9rem", 
            textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            letterSpacing: "0.3px"
          }}>
            <div style={{ 
              width: "28px", height: "28px", borderRadius: "6px", 
              background: "#7A1E3A",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px" }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            Email
          </div>
          <div style={{ 
            fontWeight: 700, color: darkMode ? "#e0e0e0" : "#2a2a2a", fontSize: "0.9rem", 
            textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            letterSpacing: "0.3px"
          }}>
            <div style={{ 
              width: "28px", height: "28px", borderRadius: "6px", 
              background: "#e91e63",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px" }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            Web
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {/* Mensajes */}
          <div style={{ 
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", 
            padding: "1.2rem 1.4rem", background: darkMode ? "#2a2a2a" : "#ffffff", 
            borderRadius: "10px", border: darkMode ? "1px solid #3a3a3a" : "1px solid #e8e4e0", 
            alignItems: "center", transition: "all 0.3s ease",
            boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: darkMode ? "4px solid #7A1E3A" : "4px solid #7A1E3A"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "8px", 
                background: "#7A1E3A",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.2rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "0.95rem", fontWeight: 600 }}>Mensajes</h4>
                <p style={{ margin: 0, color: darkMode ? "#b8b8b8" : "#777", fontSize: "0.8rem" }}>Mensajes de chat con vendedores</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_mensajes.email}
                  onChange={() => toggleCanal('notificaciones_mensajes', 'email')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_mensajes.email ? "#7A1E3A" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_mensajes.email ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_mensajes.web}
                  onChange={() => toggleCanal('notificaciones_mensajes', 'web')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_mensajes.web ? "#e91e63" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_mensajes.web ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
          </div>

          {/* Reseñas */}
          <div style={{ 
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", 
            padding: "1.2rem 1.4rem", background: darkMode ? "#2a2a2a" : "#ffffff", 
            borderRadius: "10px", border: darkMode ? "1px solid #3a3a3a" : "1px solid #e8e4e0", 
            alignItems: "center", transition: "all 0.3s ease",
            boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: darkMode ? "4px solid #7A1E3A" : "4px solid #7A1E3A"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "8px", 
                background: "#7A1E3A",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.2rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "0.95rem", fontWeight: 600 }}>Reseñas</h4>
                <p style={{ margin: 0, color: darkMode ? "#b8b8b8" : "#777", fontSize: "0.8rem" }}>Notificaciones sobre reseñas de productos</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_resenas.email}
                  onChange={() => toggleCanal('notificaciones_resenas', 'email')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_resenas.email ? "#7A1E3A" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_resenas.email ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_resenas.web}
                  onChange={() => toggleCanal('notificaciones_resenas', 'web')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_resenas.web ? "#e91e63" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_resenas.web ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
          </div>

          {/* Ofertas */}
          <div style={{ 
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", 
            padding: "1.2rem 1.4rem", background: darkMode ? "#2a2a2a" : "#ffffff", 
            borderRadius: "10px", border: darkMode ? "1px solid #3a3a3a" : "1px solid #e8e4e0", 
            alignItems: "center", transition: "all 0.3s ease",
            boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: darkMode ? "4px solid #7A1E3A" : "4px solid #7A1E3A"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "8px", 
                background: "#7A1E3A",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.2rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "0.95rem", fontWeight: 600 }}>Promociones y Ofertas</h4>
                <p style={{ margin: 0, color: darkMode ? "#b8b8b8" : "#777", fontSize: "0.8rem" }}>Descuentos especiales y promociones</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_ofertas.email}
                  onChange={() => toggleCanal('notificaciones_ofertas', 'email')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_ofertas.email ? "#7A1E3A" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_ofertas.email ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_ofertas.web}
                  onChange={() => toggleCanal('notificaciones_ofertas', 'web')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_ofertas.web ? "#e91e63" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_ofertas.web ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
          </div>

          {/* Pedidos */}
          <div style={{ 
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", 
            padding: "1.2rem 1.4rem", background: darkMode ? "#2a2a2a" : "#ffffff", 
            borderRadius: "10px", border: darkMode ? "1px solid #3a3a3a" : "1px solid #e8e4e0", 
            alignItems: "center", transition: "all 0.3s ease",
            boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: darkMode ? "4px solid #7A1E3A" : "4px solid #7A1E3A"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "8px", 
                background: "#7A1E3A",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.2rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "0.95rem", fontWeight: 600 }}>Actualizaciones de Pedidos</h4>
                <p style={{ margin: 0, color: darkMode ? "#b8b8b8" : "#777", fontSize: "0.8rem" }}>Estado de tus compras y envíos</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_pedidos.email}
                  onChange={() => toggleCanal('notificaciones_pedidos', 'email')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_pedidos.email ? "#7A1E3A" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_pedidos.email ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_pedidos.web}
                  onChange={() => toggleCanal('notificaciones_pedidos', 'web')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_pedidos.web ? "#e91e63" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_pedidos.web ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
          </div>

          {/* Entregas */}
          <div style={{ 
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", 
            padding: "1.2rem 1.4rem", background: darkMode ? "#2a2a2a" : "#ffffff", 
            borderRadius: "10px", border: darkMode ? "1px solid #3a3a3a" : "1px solid #e8e4e0", 
            alignItems: "center", transition: "all 0.3s ease",
            boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: darkMode ? "4px solid #7A1E3A" : "4px solid #7A1E3A"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "8px", 
                background: "#7A1E3A",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.2rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "0.95rem", fontWeight: 600 }}>Entregas y Domicilios</h4>
                <p style={{ margin: 0, color: darkMode ? "#b8b8b8" : "#777", fontSize: "0.8rem" }}>Notificaciones sobre entregas y domicilios</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_entregas.email}
                  onChange={() => toggleCanal('notificaciones_entregas', 'email')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_entregas.email ? "#7A1E3A" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_entregas.email ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_entregas.web}
                  onChange={() => toggleCanal('notificaciones_entregas', 'web')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_entregas.web ? "#e91e63" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_entregas.web ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
          </div>

          {/* Pagos */}
          <div style={{ 
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", 
            padding: "1.2rem 1.4rem", background: darkMode ? "#2a2a2a" : "#ffffff", 
            borderRadius: "10px", border: darkMode ? "1px solid #3a3a3a" : "1px solid #e8e4e0", 
            alignItems: "center", transition: "all 0.3s ease",
            boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: darkMode ? "4px solid #7A1E3A" : "4px solid #7A1E3A"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "8px", 
                background: "#7A1E3A",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.2rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "0.95rem", fontWeight: 600 }}>Pagos</h4>
                <p style={{ margin: 0, color: darkMode ? "#b8b8b8" : "#777", fontSize: "0.8rem" }}>Notificaciones sobre pagos y reembolsos</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_pagos.email}
                  onChange={() => toggleCanal('notificaciones_pagos', 'email')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_pagos.email ? "#7A1E3A" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_pagos.email ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_pagos.web}
                  onChange={() => toggleCanal('notificaciones_pagos', 'web')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_pagos.web ? "#e91e63" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_pagos.web ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
          </div>

          {/* Sistema */}
          <div style={{ 
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", 
            padding: "1.2rem 1.4rem", background: darkMode ? "#2a2a2a" : "#ffffff", 
            borderRadius: "10px", border: darkMode ? "1px solid #3a3a3a" : "1px solid #e8e4e0", 
            alignItems: "center", transition: "all 0.3s ease",
            boxShadow: darkMode ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: darkMode ? "4px solid #7A1E3A" : "4px solid #7A1E3A"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "8px", 
                background: "#7A1E3A",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.2rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "0.95rem", fontWeight: 600 }}>Sistema y Soporte</h4>
                <p style={{ margin: 0, color: darkMode ? "#b8b8b8" : "#777", fontSize: "0.8rem" }}>Quejas, reclamos y notificaciones del sistema</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_sistema.email}
                  onChange={() => toggleCanal('notificaciones_sistema', 'email')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_sistema.email ? "#7A1E3A" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_sistema.email ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <label style={{ 
                position: "relative", display: "inline-block", width: "48px", height: "26px",
                cursor: loading ? "not-allowed" : "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={preferencias.notificaciones_sistema.web}
                  onChange={() => toggleCanal('notificaciones_sistema', 'web')}
                  disabled={loading}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: "absolute", cursor: loading ? "not-allowed" : "pointer", 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: preferencias.notificaciones_sistema.web ? "#e91e63" : "#d1d5db", 
                  transition: "0.3s", borderRadius: "26px" 
                }}></span>
                <span style={{ 
                  position: "absolute", content: "", height: "20px", width: "20px", 
                  left: "3px", bottom: "3px", backgroundColor: "white", 
                  transition: "0.3s", borderRadius: "50%", 
                  transform: preferencias.notificaciones_sistema.web ? "translateX(22px)" : "translateX(0)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}></span>
              </label>
            </div>
          </div>

          <button
            style={{
              background: "linear-gradient(135deg, #7A1E3A 0%, #9a2e52 100%)", 
              color: "white", border: "none",
              padding: "14px 28px", borderRadius: "8px", fontWeight: 700,
              fontSize: "0.95rem", cursor: saving ? "not-allowed" : "pointer", 
              marginTop: "1.5rem", boxShadow: "0 4px 14px rgba(122, 30, 58, 0.3)",
              fontFamily: "Montserrat, sans-serif", opacity: saving ? 0.7 : 1,
              transition: "all 0.2s ease"
            }}
            onClick={guardarPreferencias}
            disabled={saving || loading}
            onMouseEnter={(e) => !saving && !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
      {/* Seguridad de Cuenta */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20, background: darkMode ? "#1e1e1e" : "white" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: darkMode ? "#e05a7a" : "var(--vinotinto)", fontSize: "1.2rem" }}>Seguridad de Cuenta</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "1.2rem", background: darkMode ? "#303030" : "#faf8f6", borderRadius: "8px", border: darkMode ? "1px solid #3a3a3a" : undefined, borderLeft: "4px solid var(--vinotinto)" }}>
            <h4 style={{ margin: "0 0 0.3rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "1rem" }}>Cambiar Contraseña</h4>
            <p style={{ margin: "0 0 1rem 0", color: darkMode ? "#c8c8c8" : "#666", fontSize: "0.85rem" }}>Actualiza tu contraseña regularmente para mantener tu cuenta segura</p>
            
            {!showPasswordForm ? (
              <button
                style={{
                  background: "var(--vinotinto)", color: "white", border: "none",
                  padding: "10px 20px", borderRadius: "6px", fontWeight: 600,
                  fontSize: "0.9rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif"
                }}
                onClick={() => setShowPasswordForm(true)}
              >
                Cambiar Contraseña
              </button>
            ) : (
              <form onSubmit={cambiarPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: darkMode ? "#e0e0e0" : "#2a2a2a", fontSize: "0.9rem" }}>
                    Contraseña Actual
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.password_actual}
                      onChange={(e) => setPasswordForm({...passwordForm, password_actual: e.target.value})}
                      required
                      style={{
                        width: "100%", padding: "10px 42px 10px 10px", borderRadius: "6px", border: darkMode ? "1px solid #444" : "1px solid #ddd",
                        fontSize: "0.9rem", fontFamily: "Montserrat, sans-serif", background: darkMode ? "#2a2a2a" : "white", color: darkMode ? "#e0e0e0" : "#2a2a2a"
                      }}
                      placeholder="Ingresa tu contraseña actual"
                    />
                    <button
                      type="button"
                      className="btn-eye"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                      style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                    >
                      {showCurrentPassword ? <IconEyeClosed /> : <IconEyeOpen />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: darkMode ? "#e0e0e0" : "#2a2a2a", fontSize: "0.9rem" }}>
                    Nueva Contraseña
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.password_nueva}
                      onChange={(e) => setPasswordForm({...passwordForm, password_nueva: e.target.value})}
                      required
                      style={{
                        width: "100%", padding: "10px 42px 10px 10px", borderRadius: "6px", border: darkMode ? "1px solid #444" : "1px solid #ddd",
                        fontSize: "0.9rem", fontFamily: "Montserrat, sans-serif", background: darkMode ? "#2a2a2a" : "white", color: darkMode ? "#e0e0e0" : "#2a2a2a"
                      }}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      className="btn-eye"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                      style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                    >
                      {showNewPassword ? <IconEyeClosed /> : <IconEyeOpen />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: darkMode ? "#e0e0e0" : "#2a2a2a", fontSize: "0.9rem" }}>
                    Confirmar Nueva Contraseña
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.password_confirmar}
                      onChange={(e) => setPasswordForm({...passwordForm, password_confirmar: e.target.value})}
                      required
                      style={{
                        width: "100%", padding: "10px 42px 10px 10px", borderRadius: "6px", border: darkMode ? "1px solid #444" : "1px solid #ddd",
                        fontSize: "0.9rem", fontFamily: "Montserrat, sans-serif", background: darkMode ? "#2a2a2a" : "white", color: darkMode ? "#e0e0e0" : "#2a2a2a"
                      }}
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                      type="button"
                      className="btn-eye"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                      style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                    >
                      {showConfirmPassword ? <IconEyeClosed /> : <IconEyeOpen />}
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    style={{
                      background: "var(--vinotinto)", color: "white", border: "none",
                      padding: "10px 20px", borderRadius: "6px", fontWeight: 600,
                      fontSize: "0.9rem", cursor: changingPassword ? "not-allowed" : "pointer",
                      fontFamily: "Montserrat, sans-serif", opacity: changingPassword ? 0.7 : 1
                    }}
                  >
                    {changingPassword ? "Actualizando..." : "Actualizar Contraseña"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({
                        password_actual: '',
                        password_nueva: '',
                        password_confirmar: ''
                      });
                    }}
                    style={{
                      background: "#666", color: "white", border: "none",
                      padding: "10px 20px", borderRadius: "6px", fontWeight: 600,
                      fontSize: "0.9rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif"
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      {/* Preferencias Visuales */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20, background: darkMode ? "#1e1e1e" : "white" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: darkMode ? "#e05a7a" : "var(--vinotinto)", fontSize: "1.2rem" }}>Preferencias Visuales</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: darkMode ? "#303030" : "#faf8f6", borderRadius: "8px", border: darkMode ? "1px solid #3a3a3a" : undefined, borderLeft: "4px solid var(--vinotinto)" }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 0.3rem 0", color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "1rem" }}>Modo Oscuro</h4>
              <p style={{ margin: 0, color: darkMode ? "#c8c8c8" : "#666", fontSize: "0.85rem" }}>Cambia el tema de la aplicacion a modo oscuro</p>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px", flexShrink: 0 }}>
              <input 
                type="checkbox" 
                checked={darkMode}
                onChange={toggleDarkMode}
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: darkMode ? "var(--vinotinto)" : "#ccc", transition: "0.3s", borderRadius: "26px" }}></span>
              <span style={{ position: "absolute", content: "", height: "20px", width: "20px", left: "3px", bottom: "3px", backgroundColor: "white", transition: "0.3s", borderRadius: "50%", transform: darkMode ? "translateX(24px)" : "translateX(0)" }}></span>
            </label>
          </div>
        </div>
      </div>
      {/* Información de la Cuenta */}
      <div className="pl-card" style={{ padding: "2rem", background: darkMode ? "#1e1e1e" : "white" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: darkMode ? "#e05a7a" : "var(--vinotinto)", fontSize: "1.2rem" }}>Información de la Cuenta</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: darkMode ? "#303030" : "#faf8f6", borderRadius: "8px", border: darkMode ? "1px solid #3a3a3a" : undefined }}>
            <label style={{ fontWeight: 700, color: darkMode ? "#e05a7a" : "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Rol</label>
            <p style={{ margin: 0, color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "1rem", fontWeight: 500 }}>Usuario</p>
          </div>
          <div style={{ padding: "1rem", background: darkMode ? "#303030" : "#faf8f6", borderRadius: "8px", border: darkMode ? "1px solid #3a3a3a" : undefined }}>
            <label style={{ fontWeight: 700, color: darkMode ? "#e05a7a" : "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Estado</label>
            <p style={{ margin: 0, color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "1rem", fontWeight: 500 }}>Activo</p>
          </div>
          <div style={{ padding: "1rem", background: darkMode ? "#303030" : "#faf8f6", borderRadius: "8px", border: darkMode ? "1px solid #3a3a3a" : undefined }}>
            <label style={{ fontWeight: 700, color: darkMode ? "#e05a7a" : "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>ID de Usuario</label>
            <p style={{ margin: 0, color: darkMode ? "#ececec" : "#2a2a2a", fontSize: "1rem", fontWeight: 500 }}>#{userId || 'N/A'}</p>
          </div>
        </div>
      </div>
    </>
  );
}