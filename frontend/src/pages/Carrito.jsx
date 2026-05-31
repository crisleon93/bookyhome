import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getCarrito } from '../services/api'

function Carrito() {
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const decoded = jwtDecode(token);
    console.log("TOKEN:", decoded); 

    const userId = parseInt(decoded.sub);

    getCarrito(userId)
      .then(res => {
        console.log("CARRITO:", res.data);
        setCarrito(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const total = carrito.reduce(
    (acc, item) => acc + Number(item.total),
    0
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛒 Mi Carrito</h1>

      {carrito.length === 0 ? (
        <p>No tienes productos en el carrito</p>
      ) : (
        carrito.map((item) => (
          <div
            key={item.id_carrito}
            style={{
              border: "1px solid #ccc",
              marginBottom: "10px",
              padding: "10px"
            }}
          >
            <h3>Titulo Libro: {item.titulo}</h3>
            <p>Autor Libro: {item.autor_libro}</p>
            <p>Cantidad: {item.cantidad}</p>

            <p>
              Precio:{" "}
              {Number(item.precio_libro).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP"
              })}
            </p>

            <p>
              Total:{" "}
              {Number(item.total).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP"
              })}
            </p>
          </div>
        ))
      )}

      <h2>
        Total a pagar:{" "}
        {total.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP"
        })}
      </h2>
    </div>
  );
}

export default Carrito;