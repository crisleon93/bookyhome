import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getCarrito, checkoutCarrito } from '../services/api';
import { useNavigate } from "react-router-dom";

function Carrito() {
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCarrito = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = jwtDecode(token);
    const userId = parseInt(decoded.sub);

    getCarrito(userId)
      .then(res => {
        setCarrito(res.data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchCarrito();
  }, []);

  const handleCheckout = () => {
    setLoading(true);
    checkoutCarrito()
      .then(res => {
        if (res.data && res.data.ok) {
          const orderId = res.data.order.id_orden;
          navigate(`/checkout/${orderId}`);
        } else {
          alert("Error al procesar el checkout");
        }
      })
      .catch(err => {
        console.error(err);
        alert(err.response?.data?.detail || "Error al realizar checkout");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const total = carrito.reduce(
    (acc, item) => acc + (Number(item.precio_libro || 0) * Number(item.cantidad || 1)),
    0
  );

  return (
    <div style={{ padding: "40px 8%", minHeight: "60vh", backgroundColor: "#fdfbfa" }}>
      <h1 style={{ fontWeight: 800, color: "var(--gris-carbon)", marginBottom: "30px" }}>🛒 Mi Carrito</h1>

      {carrito.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <p style={{ fontSize: "1.2rem", color: "#666" }}>No tienes productos en el carrito</p>
          <button className="btn btn-vinotinto" onClick={() => navigate("/")} style={{ display: "inline-block", width: "auto", marginTop: "20px" }}>
            Explorar libros
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          {carrito.map((item) => (
            <div
              key={item.id_libro}
              style={{
                background: "var(--blanco)",
                border: "1px solid #e0dbd4",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "var(--sombra-suave)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px"
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 5px 0", fontWeight: 700, color: "var(--vinotinto)" }}>{item.titulo}</h3>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "0.9rem" }}>Autor: {item.autor_libro}</p>
                <p style={{ margin: "0", fontWeight: 600, fontSize: "0.95rem" }}>Cantidad: {item.cantidad}</p>
              </div>

              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 5px 0", color: "#777", fontSize: "0.9rem" }}>
                  Unitario: {Number(item.precio_libro).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0
                  })}
                </p>
                <p style={{ margin: "0", fontWeight: 700, color: "var(--gris-carbon)", fontSize: "1.1rem" }}>
                  Total: {Number((item.precio_libro || 0) * (item.cantidad || 1)).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0
                  })}
                </p>
              </div>
            </div>
          ))}

          <div style={{
            marginTop: "30px",
            borderTop: "2px solid #e0dbd4",
            paddingTop: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end"
          }}>
            <h2 style={{ fontWeight: 800, margin: "0 0 15px 0" }}>
              Total a pagar:{" "}
              <span style={{ color: "var(--rojo-suave)" }}>
                {total.toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0
                })}
              </span>
            </h2>

            <button
              className="btn btn-vinotinto"
              onClick={handleCheckout}
              disabled={loading}
              style={{
                width: "auto",
                minWidth: "250px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Procesando..." : "Proceder al Pago"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Carrito;