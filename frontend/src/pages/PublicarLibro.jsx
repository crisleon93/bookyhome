import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios, { getApiBaseUrl } from "../services/api";
import SellerSidebar from "../components/VendedorSidebar";
import '../styles/publicar.css';


const ESTADOS = [
  { value: "nuevo", label: "Nuevo", desc: "Sin uso, en perfectas condiciones" },
  { value: "usado_buen_estado", label: "Usado — buen estado", desc: "Usado pero bien conservado" },
  { value: "usado_regular", label: "Usado — estado regular", desc: "Visible desgaste, funcional" },
];

const TIPOS_TAPA = ['Tapa Blanda', 'Tapa Dura', 'Digital'];
const IDIOMAS = ['Español', 'Inglés', 'Portugués', 'Francés', 'Otro'];

export default function PublicarLibro() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [userName, setUserName] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = jwtDecode(token);
        return payload.nombre || "Vendedor";
      } catch {
        return "Vendedor";
      }
    }
    return "Vendedor";
  });
  const [userPhotoUrl, setUserPhotoUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);

  const [categorias, setCategorias] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [activeSide, setActiveSide] = useState("Publicar Libro");

  // Variantes
  const [variantes, setVariantes] = useState([]);
  const [varianteForm, setVarianteForm] = useState({
    tipo_tapa: 'Tapa Blanda',
    idioma: 'Español',
    edicion: '1ra Edición',
    precio_variante: '',
    stock_variante: '',
    archivo_digital: null,
  });
  const [idLibroCreaddo, setIdLibroCreado] = useState(null);

  const handleSidebarSelect = (name) => {
    // Si el usuario está en la página de publicar, mantener el highlight.
    // Para cualquier otra selección, navegamos de regreso al dashboard principal.
    if (name === "Publicar Libro") {
      setActiveSide(name);
      return;
    }
    // Navegar indicando la subsección deseada para que MiTienda la abra.
    navigate(`/mi-tienda?seccion=${encodeURIComponent(name)}`);
  };

  const [form, setForm] = useState({
    id_categoria: "",
    titulo: "",
    autor_libro: "",
    isbn: "",
    descripcion_libro: "",
    precio_libro: "",
    stock: "",
    estado_libro: "",
  });

  // Cargar logo y banner de la tienda para el sidebar
  useEffect(() => {
    axios.get("/configuracion")
      .then((r) => {
        const base = getApiBaseUrl();
        const resolve = (url) => {
          if (!url) return null;
          if (url.startsWith('http')) return url;
          return `${base}${url}`;
        };
        if (r.data?.logo_url) setUserPhotoUrl(resolve(r.data.logo_url));
        if (r.data?.banner_url) setBannerUrl(resolve(r.data.banner_url));
      })
      .catch(() => {});
  }, []);

  // Cargar categorías al montar
  useEffect(() => {
    axios.get("/libros/categorias")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategorias(res.data);
        } else {
          console.error("Respuesta inesperada de categorías:", res.data);
          setError("No se pudieron cargar las categorías");
          setCategorias([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando categorías:", err);
        setError("No se pudieron cargar las categorías. Recarga la página.");
        setCategorias([]);
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleImagenes = (e) => {
    const files = Array.from(e.target.files);
    if (archivos.length + files.length > 5) {
      setError("Máximo 5 imágenes por libro");
      return;
    }
    const nuevos = files.filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    setArchivos((prev) => [...prev, ...nuevos]);
    nuevos.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const eliminarImagen = (index) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarVariante = () => {
    if (!varianteForm.precio_variante || Number(varianteForm.precio_variante) <= 0)
      return setError("El precio de la variante debe ser mayor a $0");
    if (!varianteForm.stock_variante || Number(varianteForm.stock_variante) < 0)
      return setError("El stock de la variante no puede ser negativo");
    if (varianteForm.tipo_tapa === 'Digital' && !varianteForm.archivo_digital)
      return setError("Para la variante Digital debes subir un archivo PDF o EPUB");

    setVariantes(prev => [...prev, { ...varianteForm, id_temp: Date.now() }]);
    setVarianteForm({ tipo_tapa: 'Tapa Blanda', idioma: 'Español', edicion: '1ra Edición', precio_variante: '', stock_variante: '', archivo_digital: null });
    setError("");
  };

  const eliminarVariante = (id_temp) => {
    setVariantes(prev => prev.filter(v => v.id_temp !== id_temp));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!form.id_categoria) return setError("Selecciona una categoría");
    if (!form.titulo.trim()) return setError("El título es obligatorio");
    if (!form.autor_libro.trim()) return setError("El autor es obligatorio");
    if (!form.descripcion_libro.trim()) return setError("La descripción es obligatoria");
    if (!form.precio_libro || Number(form.precio_libro) <= 0)
      return setError("El precio debe ser mayor a $0");
    if (!form.stock || Number(form.stock) < 1)
      return setError("El stock debe ser al menos 1");
    if (!form.estado_libro) return setError("Selecciona el estado del libro");

    setCargando(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      archivos.forEach((file) => data.append("imagenes", file));

      const res = await axios.post("/libros/publicar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const id_libro = res.data?.id_libro;

      // Subir variantes si las hay
      if (id_libro && variantes.length > 0) {
        for (const v of variantes) {
          try {
            // 1. Crear la variante
            const resVariante = await axios.post(`/libros/${id_libro}/variantes`, {
              tipo_tapa: v.tipo_tapa,
              idioma: v.idioma,
              edicion: v.edicion,
              precio_variante: Number(v.precio_variante),
              stock_variante: Number(v.stock_variante),
            });
            // 2. Si es digital y hay archivo, subirlo
            if (v.tipo_tapa === 'Digital' && v.archivo_digital && resVariante.data?.id_variante) {
              const fd = new FormData();
              fd.append('file', v.archivo_digital);
              await axios.post(`/libros/${id_libro}/variantes/${resVariante.data.id_variante}/archivo`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            }
          } catch (err) {
            console.warn('Error subiendo variante:', err);
          }
        }
      }

      setExito(true);
      setTimeout(() => navigate("/mi-tienda"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Ocurrió un error al publicar el libro"
      );
    } finally {
      setCargando(false);
    }
  };

  if (exito) {
    return (
      <div className="dashboard-container">
        <SellerSidebar
          userName={userName}
          userPhotoUrl={userPhotoUrl}
          bannerUrl={bannerUrl}
          activeSide={activeSide}
          setActiveSide={setActiveSide}
          handleLogout={() => {
            localStorage.removeItem("token");
            window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } }));
            navigate("/");
          }}
        />
        <main className="dashboard-main">
          <div className="publicar-exito">
            <div className="exito-icon">✓</div>
            <h2>¡Libro publicado!</h2>
            <p>Redirigiendo a tus libros…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <SellerSidebar
        userName={userName}
        userPhotoUrl={userPhotoUrl}
        bannerUrl={bannerUrl}
        activeSide={activeSide}
        setActiveSide={handleSidebarSelect}
        handleLogout={() => {
          localStorage.removeItem("token");
          window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } }));
          navigate("/");
        }}
      />
      <main className="dashboard-main">
        <div className="publicar-wrapper">
          {/* Encabezado */}
          <div className="publicar-header">
            <div>
              <h1 className="publicar-title">Publicar libro</h1>
              <p className="publicar-subtitle">
                Completa la información para poner tu libro a la venta
              </p>
            </div>
          </div>

      <form onSubmit={handleSubmit} className="publicar-form">
        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="publicar-col">

          {/* Imágenes */}
          <div className="form-card">
            <h3 className="card-title">
              <span className="card-step">1</span>Fotos del libro
            </h3>
            <p className="card-hint">Agrega hasta 5 fotos. La primera será la portada.</p>

            <div className="imagenes-grid">
              {previews.map((src, i) => (
                <div key={i} className="img-preview">
                  <img src={src} alt={`preview ${i + 1}`} />
                  <button
                    type="button"
                    className="img-delete"
                    onClick={() => eliminarImagen(i)}
                    aria-label="Eliminar imagen"
                  >
                    ×
                  </button>
                  {i === 0 && <span className="img-portada">Portada</span>}
                </div>
              ))}

              {previews.length < 5 && (
                <button
                  type="button"
                  className="img-add"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="img-add-icon">＋</span>
                  <span>Añadir foto</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleImagenes}
            />
          </div>

          {/* Información básica */}
          <div className="form-card">
            <h3 className="card-title">
              <span className="card-step">2</span>Información básica
            </h3>

            <div className="form-group">
              <label htmlFor="titulo">Título del libro *</label>
              <input
                id="titulo"
                name="titulo"
                type="text"
                maxLength={100}
                placeholder="Ej: Cien años de soledad"
                value={form.titulo}
                onChange={handleChange}
              />
              <p className="input-hint">Usa el título exacto del libro para que los compradores te encuentren fácil.</p>
            </div>

            <div className="form-group">
              <label htmlFor="autor_libro">Autor *</label>
              <input
                id="autor_libro"
                name="autor_libro"
                type="text"
                maxLength={50}
                placeholder="Ej: Gabriel García Márquez"
                value={form.autor_libro}
                onChange={handleChange}
              />
              <p className="input-hint">Si es autor colectivo o editorial, escríbelo igual al título.</p>
            </div>

            <div className="form-group">
              <label htmlFor="isbn">ISBN (opcional)</label>
              <input
                id="isbn"
                name="isbn"
                type="text"
                maxLength={20}
                placeholder="Ej: 978-3-16-148410-0"
                value={form.isbn}
                onChange={handleChange}
              />
              <p className="input-hint">El código ISBN permite que los compradores encuentren tu libro escaneando el código de barras. Puedes encontrarlo en la contraportada del libro.</p>
            </div>

            <div className="form-group">
              <label htmlFor="id_categoria">Categoría *</label>
              <select
                id="id_categoria"
                name="id_categoria"
                value={form.id_categoria}
                onChange={handleChange}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre_categoria}
                  </option>
                ))}
              </select>
              <p className="input-hint">Elige la categoría que más describe el contenido del libro.</p>
            </div>

            <div className="form-group">
              <label htmlFor="descripcion_libro">
                Descripción *
                <span className="char-count">
                  {form.descripcion_libro.length}/300
                </span>
              </label>
              <textarea
                id="descripcion_libro"
                name="descripcion_libro"
                maxLength={300}
                rows={4}
                placeholder="Describe brevemente el libro: de qué trata, en qué condición está, edición, etc."
                value={form.descripcion_libro}
                onChange={handleChange}
              />
              <p className="input-hint">Incluye condición, edición y cualquier detalle importante para el comprador.</p>
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="publicar-col">

          {/* Estado del libro */}
          <div className="form-card">
            <h3 className="card-title">
              <span className="card-step">3</span>Estado del libro
            </h3>

            <div className="estados-group">
              {ESTADOS.map((est) => (
                <label
                  key={est.value}
                  className={`estado-option ${
                    form.estado_libro === est.value ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="estado_libro"
                    value={est.value}
                    checked={form.estado_libro === est.value}
                    onChange={handleChange}
                  />
                  <div className="estado-info">
                    <span className="estado-label">{est.label}</span>
                    <span className="estado-desc">{est.desc}</span>
                  </div>
                  {form.estado_libro === est.value && (
                    <span className="estado-check">✓</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Precio y stock */}
          <div className="form-card">
            <h3 className="card-title">
              <span className="card-step">4</span>Precio y disponibilidad
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="precio_libro">Precio (COP) *</label>
                <div className="input-prefix-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    id="precio_libro"
                    name="precio_libro"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="25000"
                    value={form.precio_libro}
                    onChange={handleChange}
                    className="input-with-prefix"
                  />
                </div>
                <p className="input-hint">Precio en pesos. Si quieres, entra el valor que verá el comprador.</p>
              </div>

              <div className="form-group">
                <label htmlFor="stock">Unidades disponibles *</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={form.stock}
                  onChange={handleChange}
                />
                <p className="input-hint">Cantidad que tienes lista para vender hoy.</p>
              </div>
            </div>

            {form.precio_libro && Number(form.precio_libro) > 0 && (
              <div className="precio-preview">
                <span>El comprador verá:</span>
                <strong>
                  $ {String(parseInt(form.precio_libro)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} COP
                </strong>
              </div>
            )}
          </div>

          {/* ── VARIANTES ── */}
          <div className="form-card">
            <h3 className="card-title">
              <span className="card-step">5</span>Formatos y variantes <span style={{fontSize:'12px',fontWeight:'400',color:'#888'}}>(opcional)</span>
            </h3>
            <p className="card-hint">Agrega Tapa Blanda, Tapa Dura o Digital con precios distintos. Para Digital, sube el archivo PDF o EPUB que recibirá el comprador.</p>

            {/* Lista variantes ya agregadas */}
            {variantes.length > 0 && (
              <div style={{marginBottom:'16px'}}>
                {variantes.map(v => (
                  <div key={v.id_temp} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:'8px',background:'#f3f4f6',marginBottom:'8px'}}>
                    <div>
                      <strong>{v.tipo_tapa}</strong> · {v.idioma} · {v.edicion}
                      <br/><span style={{color:'#7A1E3A',fontWeight:'600'}}>${Number(v.precio_variante).toLocaleString('es-CO')}</span> · Stock: {v.stock_variante}
                      {v.tipo_tapa === 'Digital' && v.archivo_digital && <span style={{marginLeft:'8px',color:'#2e7d32',fontSize:'12px'}}>📄 {v.archivo_digital.name}</span>}
                    </div>
                    <button type="button" onClick={() => eliminarVariante(v.id_temp)} style={{background:'none',border:'none',cursor:'pointer',color:'#c62828',fontSize:'18px'}}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Form nueva variante */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
              <div className="form-group">
                <label>Tipo</label>
                <select value={varianteForm.tipo_tapa} onChange={e => setVarianteForm(p => ({...p, tipo_tapa: e.target.value}))}>
                  {TIPOS_TAPA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Idioma</label>
                <select value={varianteForm.idioma} onChange={e => setVarianteForm(p => ({...p, idioma: e.target.value}))}>
                  {IDIOMAS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Edición</label>
                <input type="text" placeholder="1ra Edición" value={varianteForm.edicion} onChange={e => setVarianteForm(p => ({...p, edicion: e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Precio (COP)</label>
                <input type="number" min="0" placeholder="25000" value={varianteForm.precio_variante} onChange={e => setVarianteForm(p => ({...p, precio_variante: e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" min="0" placeholder={varianteForm.tipo_tapa === 'Digital' ? '999' : '5'} value={varianteForm.stock_variante} onChange={e => setVarianteForm(p => ({...p, stock_variante: e.target.value}))} />
              </div>
              {varianteForm.tipo_tapa === 'Digital' && (
                <div className="form-group">
                  <label>Archivo PDF / EPUB</label>
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={e => setVarianteForm(p => ({...p, archivo_digital: e.target.files[0] || null}))}
                    style={{padding:'6px 0'}}
                  />
                </div>
              )}
            </div>
            <button type="button" onClick={agregarVariante} style={{width:'100%',padding:'10px',borderRadius:'8px',background:'#7A1E3A',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'14px'}}>
              + Agregar variante
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="form-error" role="alert">
              ⚠ {error}
            </div>
          )}

          {/* Acciones */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-vinotinto btn-publicar"
              disabled={cargando}
            >
              {cargando ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Publicando…
                </span>
              ) : (
                "Publicar libro"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  </main>
</div>
  );
}
