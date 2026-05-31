import React, { useEffect, useState } from "react";
import { getStoredLibros } from '../services/api'

const StoredProcedurePage = () => {
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredLibros()
      .then((res) => {
        setLibros(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📚 Listado usando Stored Procedure</h2>

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
          <thead style={{ backgroundColor: "#eee" }}>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Autor</th>
              <th>Categoría</th>
              <th>Tienda</th>
              <th>Precio</th>
              <th>Stock</th>
            </tr>
          </thead>

          <tbody>
            {libros.map((libro) => (
              <tr key={libro.id_libro}>
                <td>{libro.id_libro}</td>
                <td>{libro.titulo}</td>
                <td>{libro.autor_libro}</td>
                <td>{libro.nombre_categoria}</td>
                <td>{libro.nombre_tienda}</td>
                <td>${libro.precio_libro}</td>
                <td>{libro.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StoredProcedurePage;