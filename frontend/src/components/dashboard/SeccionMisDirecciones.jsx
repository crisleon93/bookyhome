import { useState, useEffect, useCallback } from "react";
import { IconLocation } from "../Icons";
import LeafletAddressPickerModal from "../LeafletAddressPickerModal";
import api from "../../services/api";
import { notify } from "../ToastProvider";

export default function SeccionMisDirecciones() {
  const [direcciones, setDirecciones] = useState([]);
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [mostrarModalDireccion, setMostrarModalDireccion] = useState(false);
  const [direccionEditingId, setDireccionEditingId] = useState(null);
  const [direccionLoading, setDireccionLoading] = useState(false);
  const [direccionError, setDireccionError] = useState("");
  const [direccionForm, setDireccionForm] = useState({
    alias_direccion: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    es_principal: false
  });

  const cargarDirecciones = useCallback(async () => {
    try {
      const res = await api.get('/perfil/direcciones');
      setDirecciones(res.data || []);
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      setDirecciones([]);
    }
  }, []);

  useEffect(() => {
    cargarDirecciones();
  }, [cargarDirecciones]);

  const onResetDireccionForm = () => {
    setMostrarFormDireccion(false);
    setDireccionEditingId(null);
    setDireccionError('');
    setDireccionForm({ alias_direccion: '', direccion: '', ciudad: '', departamento: '', codigo_postal: '', es_principal: false });
  };

  const onOpenNewDireccionForm = () => {
    onResetDireccionForm();
    setMostrarFormDireccion(true);
  };

  const onOpenEditDireccionForm = (direccion) => {
    setDireccionEditingId(direccion.id_direccion);
    setDireccionForm({
      alias_direccion: direccion.alias_direccion || '',
      direccion: direccion.direccion || '',
      ciudad: direccion.ciudad || '',
      departamento: direccion.departamento || '',
      codigo_postal: direccion.codigo_postal || '',
      es_principal: Boolean(direccion.es_principal)
    });
    setDireccionError('');
    setMostrarFormDireccion(true);
  };

  const onDireccionFormChange = (data) => {
    setDireccionForm((prev) => ({ ...prev, ...data }));
  };

  const onSetMostrarModalDireccion = (value) => {
    setMostrarModalDireccion(value);
  };

  const onSaveDireccion = async () => {
    if (!direccionForm.direccion?.trim()) {
      setDireccionError('La dirección es obligatoria');
      return;
    }
    setDireccionLoading(true);
    setDireccionError('');
    try {
      const payload = {
        alias_direccion: direccionForm.alias_direccion?.trim() || 'Dirección',
        direccion: direccionForm.direccion.trim(),
        ciudad: direccionForm.ciudad?.trim() || '',
        codigo_postal: direccionForm.codigo_postal?.trim() || '',
        departamento: direccionForm.departamento?.trim() || '',
        es_principal: direccionForm.es_principal
      };
      if (direccionEditingId) {
        await api.put(`/perfil/direcciones/${direccionEditingId}`, payload);
        notify('Dirección actualizada', 'success');
      } else {
        await api.post('/perfil/direcciones', payload);
        notify('Dirección guardada', 'success');
      }
      await cargarDirecciones();
      onResetDireccionForm();
    } catch (error) {
      setDireccionError(error.response?.data?.detail || 'No se pudo guardar la dirección');
    } finally {
      setDireccionLoading(false);
    }
  };

  const onSetPrincipalDireccion = async (id) => {
    try {
      await api.put(`/perfil/direcciones/${id}`, { es_principal: true });
      await cargarDirecciones();
      notify('Dirección marcada como principal', 'success');
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudo actualizar la dirección', 'error');
    }
  };

  const onDeleteDireccion = async (id) => {
    try {
      await api.delete(`/perfil/direcciones/${id}`);
      await cargarDirecciones();
      notify('Dirección eliminada', 'success');
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudo eliminar la dirección', 'error');
    }
  };
  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconLocation width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0 }}>Mis Direcciones de Envío</h2>
        </div>
      </div>

      <div className="pl-card" style={{ padding: "2rem" }}>
        {mostrarModalDireccion && (
          <LeafletAddressPickerModal
            isOpen={mostrarModalDireccion}
            onClose={() => onSetMostrarModalDireccion(false)}
            onSelect={(data) => onDireccionFormChange(data)}
          />
        )}

        {mostrarFormDireccion ? (
          <div style={{ marginTop: "8px" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#444", fontSize: "1rem" }}>
              {direccionEditingId ? 'Editar dirección' : 'Agregar nueva dirección'}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Alias</label>
                <input
                  type="text"
                  value={direccionForm.alias_direccion}
                  onChange={(e) => onDireccionFormChange({ alias_direccion: e.target.value })}
                  placeholder="Ej. Casa, Oficina"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Dirección</label>
                <input
                  type="text"
                  value={direccionForm.direccion}
                  onChange={(e) => onDireccionFormChange({ direccion: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Ciudad</label>
                <input
                  type="text"
                  value={direccionForm.ciudad}
                  onChange={(e) => onDireccionFormChange({ ciudad: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Departamento</label>
                <input
                  type="text"
                  value={direccionForm.departamento}
                  onChange={(e) => onDireccionFormChange({ departamento: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Código postal</label>
                <input
                  type="text"
                  value={direccionForm.codigo_postal}
                  onChange={(e) => onDireccionFormChange({ codigo_postal: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={direccionForm.es_principal}
                  onChange={(e) => onDireccionFormChange({ es_principal: e.target.checked })}
                />
                <label style={{ fontWeight: 600, color: "#444", margin: 0 }}>Marcar como dirección principal</label>
              </div>
              {direccionError && <p style={{ color: '#b42318', margin: 0 }}>{direccionError}</p>}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  style={{ background: "var(--vinotinto)", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: direccionLoading ? 'not-allowed' : 'pointer', opacity: direccionLoading ? 0.7 : 1, fontFamily: "Montserrat, sans-serif" }}
                  onClick={onSaveDireccion}
                  disabled={direccionLoading}
                >
                  {direccionLoading ? 'Guardando...' : direccionEditingId ? 'Actualizar dirección' : 'Guardar dirección'}
                </button>
                <button
                  style={{ background: "none", border: "1.5px solid var(--vinotinto)", color: "var(--vinotinto)", borderRadius: "8px", padding: "12px 24px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                  onClick={() => onSetMostrarModalDireccion(true)}
                >
                  Elegir en mapa
                </button>
                <button
                  style={{ background: "none", border: "1.5px solid #999", color: "#666", borderRadius: "8px", padding: "12px 24px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                  onClick={onResetDireccionForm}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <button
              style={{ background: "var(--vinotinto)", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", marginBottom: 20, fontFamily: "Montserrat, sans-serif" }}
              onClick={onOpenNewDireccionForm}
            >
              + Agregar dirección
            </button>

            {direcciones.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", background: "#faf8f6", borderRadius: "8px", border: "1px solid #e0dbd4" }}>
                <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>No tienes direcciones guardadas</p>
                <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>Agrega una dirección para envíos más rápidos</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {direcciones.map((dir) => (
                  <div key={dir.id_direccion} className="pl-card" style={{ padding: "1.5rem", border: dir.es_principal ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div>
                        {dir.es_principal && (
                          <span style={{ background: "var(--vinotinto)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, display: "inline-block", marginBottom: "8px" }}>
                            Principal
                          </span>
                        )}
                        {dir.alias_direccion && <p style={{ margin: "4px 0", fontWeight: 700 }}>{dir.alias_direccion}</p>}
                        <p style={{ margin: "4px 0", fontWeight: 600 }}>{dir.direccion}</p>
                        <p style={{ margin: "2px 0", color: "#666" }}>
                          {[dir.ciudad, dir.departamento].filter(Boolean).join(', ')}
                        </p>
                        {dir.codigo_postal && <p style={{ margin: "2px 0", color: "#888", fontSize: "0.85rem" }}>CP: {dir.codigo_postal}</p>}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {!dir.es_principal && (
                          <button
                            style={{ background: "var(--vinotinto)", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                            onClick={() => onSetPrincipalDireccion(dir.id_direccion)}
                          >
                            Hacer principal
                          </button>
                        )}
                        <button
                          style={{ background: "#8b5a2b", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                          onClick={() => onOpenEditDireccionForm(dir)}
                        >
                          Editar
                        </button>
                        <button
                          style={{ background: "#dc2626", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                          onClick={() => onDeleteDireccion(dir.id_direccion)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
