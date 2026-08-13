import { IconSettings } from "../Icons";
import { notify } from "../ToastProvider";

export default function SeccionConfiguracion({ userId }) {
  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconSettings width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0 }}>Configuración de Cuenta</h2>
        </div>
      </div>
      {/* Preferencias de Notificaciones */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>Preferencias de Notificaciones</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: "#faf8f6", borderRadius: "8px", borderLeft: "4px solid var(--vinotinto)" }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 0.3rem 0", color: "#2a2a2a", fontSize: "1rem" }}>Promociones y Ofertas</h4>
              <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>Recibe notificaciones sobre descuentos especiales y promociones</p>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px", flexShrink: 0 }}>
              <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--vinotinto)", transition: "0.3s", borderRadius: "26px" }}></span>
              <span style={{ position: "absolute", content: "", height: "20px", width: "20px", left: "3px", bottom: "3px", backgroundColor: "white", transition: "0.3s", borderRadius: "50%", transform: "translateX(24px)" }}></span>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: "#faf8f6", borderRadius: "8px", borderLeft: "4px solid var(--vinotinto)" }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 0.3rem 0", color: "#2a2a2a", fontSize: "1rem" }}>Actualizaciones de Pedidos</h4>
              <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>Notificaciones sobre el estado de tus compras y envíos</p>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px", flexShrink: 0 }}>
              <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--vinotinto)", transition: "0.3s", borderRadius: "26px" }}></span>
              <span style={{ position: "absolute", content: "", height: "20px", width: "20px", left: "3px", bottom: "3px", backgroundColor: "white", transition: "0.3s", borderRadius: "50%", transform: "translateX(24px)" }}></span>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: "#faf8f6", borderRadius: "8px", borderLeft: "4px solid var(--vinotinto)" }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 0.3rem 0", color: "#2a2a2a", fontSize: "1rem" }}>Novedades y Libros</h4>
              <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>Recibe recomendaciones basadas en tus intereses</p>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px", flexShrink: 0 }}>
              <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#ccc", transition: "0.3s", borderRadius: "26px" }}></span>
              <span style={{ position: "absolute", content: "", height: "20px", width: "20px", left: "3px", bottom: "3px", backgroundColor: "white", transition: "0.3s", borderRadius: "50%" }}></span>
            </label>
          </div>
          <button
            style={{
              background: "var(--vinotinto)", color: "white", border: "none",
              padding: "12px 24px", borderRadius: "8px", fontWeight: 700,
              fontSize: "0.95rem", cursor: "pointer", marginTop: "8px",
              fontFamily: "Montserrat, sans-serif"
            }}
            onClick={() => notify("Preferencias guardadas", "success")}
          >
            Guardar cambios
          </button>
        </div>
      </div>
      {/* Información de la Cuenta */}
      <div className="pl-card" style={{ padding: "2rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>Información de la Cuenta</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "#faf8f6", borderRadius: "8px" }}>
            <label style={{ fontWeight: 600, color: "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rol</label>
            <p style={{ margin: 0, color: "#2a2a2a", fontSize: "1rem" }}>Usuario</p>
          </div>
          <div style={{ padding: "1rem", background: "#faf8f6", borderRadius: "8px" }}>
            <label style={{ fontWeight: 600, color: "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Estado</label>
            <p style={{ margin: 0, color: "#2a2a2a", fontSize: "1rem" }}>Activo</p>
          </div>
          <div style={{ padding: "1rem", background: "#faf8f6", borderRadius: "8px" }}>
            <label style={{ fontWeight: 600, color: "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>ID de Usuario</label>
            <p style={{ margin: 0, color: "#2a2a2a", fontSize: "1rem" }}>#{userId || 'N/A'}</p>
          </div>
        </div>
      </div>
    </>
  );
}
