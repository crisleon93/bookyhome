import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import SellerSidebar from "../components/SellerSidebarFlowbite";
import '../styles/publicar.css';


const ESTADOS = [
  { value: "nuevo", label: "Nuevo", desc: "Sin uso, en perfectas condiciones" },
  { value: "usado_buen_estado", label: "Usado — buen estado", desc: "Usado pero bien conservado" },
  { value: "usado_regular", label: "Usado — estado regular", desc: "Visible desgaste, funcional" },
];

export default function PublicarLibro() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categorias, setCategorias] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [activeSide, setActiveSide] = useState("Publicar Libro");

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
    descripcion_libro: "",
    precio_libro: "",
    stock: "",
    estado_libro: "",
  });

  // Cargar categorías al montar
  useEffect(() => {
    axios.get("/libros/categorias")
      .then((res) => setCategorias(res.data))
      .catch(() => setError("No se pudieron cargar las categorías"));
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

      await axios.post("/libros/publicar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
          userName="Vendedor"
          activeSide={activeSide}
          setActiveSide={setActiveSide}
          handleLogout={() => {
            localStorage.removeItem("token");
            navigate("/login");
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
        userName="Vendedor"
        activeSide={activeSide}
        setActiveSide={handleSidebarSelect}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
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
