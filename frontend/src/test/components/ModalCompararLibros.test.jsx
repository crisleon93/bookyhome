import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModalCompararLibros from '../../components/ModalCompararLibros';
import { compararLibrosApi } from '../../services/api';
import { notify } from '../../components/ToastProvider';

vi.mock('../../services/api', () => ({
  compararLibrosApi: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}));

vi.mock('../../components/ToastProvider', () => ({
  notify: vi.fn(),
}));

const mockLibros = [
  {
    id_libro: 1,
    titulo: 'Libro A',
    autor_libro: 'Autor A',
    precio_libro: 50000,
    stock: 5,
    nombre_categoria: 'Ficción',
    nombre_tienda: 'Tienda Uno',
    tiempo_despacho_dias: 2,
    costo_envio_tienda: 8000,
    calificacion_promedio: 4.5,
    total_resenas: 10,
    condicion_libro: 'Nuevo',
    isbn: '9781234567890',
    imagen_url: '/img/libro1.jpg',
    oferta: {
      id_oferta: 101,
      precio_descuento: 40000,
      tipo_descuento: 'porcentaje',
      valor_descuento: 20,
      ahorro: 10000,
    },
  },
  {
    id_libro: 2,
    titulo: 'Libro B',
    autor_libro: 'Autor B',
    precio_libro: 60000,
    stock: 0,
    nombre_categoria: 'Ciencia',
    nombre_tienda: 'Tienda Dos',
    tiempo_despacho_dias: 1,
    costo_envio_tienda: 0,
    calificacion_promedio: 5,
    total_resenas: 2,
    condicion_libro: 'Usado',
    isbn: '9780987654321',
    imagen_url: 'https://example.com/libro2.jpg',
  },
];

describe('ModalCompararLibros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    compararLibrosApi.mockResolvedValue({
      data: { libros: mockLibros },
    });
  });

  it('renderiza la comparativa de libros lado a lado con encabezados y atributos', async () => {
    render(
      <ModalCompararLibros
        librosIniciales={mockLibros}
        onClose={vi.fn()}
        onQuitarLibro={vi.fn()}
        onAgregarAlCarrito={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Libro A')).toBeInTheDocument();
    });
    expect(screen.getByText('Comparativa de Libros Lado a Lado')).toBeInTheDocument();
    expect(screen.getByText('2 libros')).toBeInTheDocument();
    expect(screen.getByText('Libro B')).toBeInTheDocument();
    expect(screen.getByText('🏆 Mejor Precio')).toBeInTheDocument();
    expect(screen.getByText('Ficción')).toBeInTheDocument();
    expect(screen.getByText('Ciencia')).toBeInTheDocument();
  });

  it('llama a onAgregarAlCarrito cuando se pulsa el botón correspondiente', async () => {
    const handleAdd = vi.fn();
    render(
      <ModalCompararLibros
        librosIniciales={mockLibros}
        onClose={vi.fn()}
        onQuitarLibro={vi.fn()}
        onAgregarAlCarrito={handleAdd}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Libro A')).toBeInTheDocument();
    });
    const btnAgregar = screen.getAllByRole('button', { name: /añadir al carrito/i })[0];
    fireEvent.click(btnAgregar);
    expect(handleAdd).toHaveBeenCalledWith(expect.objectContaining({ id_libro: 1 }));
  });

  it('permite quitar un libro y cierra si quedan menos de 2', async () => {
    const handleQuitar = vi.fn();
    const handleClose = vi.fn();
    render(
      <ModalCompararLibros
        librosIniciales={mockLibros}
        onClose={handleClose}
        onQuitarLibro={handleQuitar}
        onAgregarAlCarrito={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Libro A')).toBeInTheDocument();
    });
    const quitarBtns = screen.getAllByTitle('Quitar de la comparación');
    fireEvent.click(quitarBtns[0]);
    expect(handleQuitar).toHaveBeenCalledWith(1);
    expect(notify).toHaveBeenCalledWith('Se necesitan al menos 2 libros para comparar', 'info');
    expect(handleClose).toHaveBeenCalled();
  });

  it('se cierra al hacer clic en el botón X o presionar la tecla Escape', () => {
    const handleClose = vi.fn();
    render(
      <ModalCompararLibros
        librosIniciales={mockLibros}
        onClose={handleClose}
        onQuitarLibro={vi.fn()}
        onAgregarAlCarrito={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Cerrar ventana'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('soporta modo oscuro y maneja fallo en la API de comparación', async () => {
    compararLibrosApi.mockRejectedValueOnce(new Error('Network error'));
    render(
      <ModalCompararLibros
        librosIniciales={mockLibros}
        onClose={vi.fn()}
        onQuitarLibro={vi.fn()}
        onAgregarAlCarrito={vi.fn()}
        darkMode={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Libro A')).toBeInTheDocument();
    });
  });

  it('muestra aviso si se inicia con menos de 2 libros', () => {
    render(
      <ModalCompararLibros
        librosIniciales={[mockLibros[0]]}
        onClose={vi.fn()}
        onQuitarLibro={vi.fn()}
        onAgregarAlCarrito={vi.fn()}
      />
    );

    expect(screen.getByText('Selecciona al menos dos libros para realizar una comparación.')).toBeInTheDocument();
  });

  it('permite cerrar haciendo clic en el backdrop', async () => {
    const handleClose = vi.fn();
    render(
      <ModalCompararLibros
        librosIniciales={mockLibros}
        onClose={handleClose}
        onQuitarLibro={vi.fn()}
        onAgregarAlCarrito={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Libro A')).toBeInTheDocument();
    });

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renderiza fallback de imagen y mantiene modal abierto si quedan 2 o más libros al quitar uno', async () => {
    const tresLibros = [
      ...mockLibros,
      {
        id_libro: 3,
        titulo: 'Libro C',
        autor_libro: 'Autor C',
        precio_libro: 70000,
        stock: 3,
        nombre_categoria: 'Terror',
        nombre_tienda: 'Tienda Tres',
        imagen_url: null,
      },
    ];
    compararLibrosApi.mockResolvedValueOnce({
      data: { libros: tresLibros },
    });

    const handleQuitar = vi.fn();
    const handleClose = vi.fn();

    render(
      <ModalCompararLibros
        librosIniciales={tresLibros}
        onClose={handleClose}
        onQuitarLibro={handleQuitar}
        onAgregarAlCarrito={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Libro C')).toBeInTheDocument();
    });

    // Fallback de imagen con emoji
    expect(screen.getByText('📖')).toBeInTheDocument();

    // Quitar el primer libro de los 3
    const quitarBtns = screen.getAllByTitle('Quitar de la comparación');
    fireEvent.click(quitarBtns[0]);
    expect(handleQuitar).toHaveBeenCalledWith(1);
    // Como quedan 2 libros, no debe cerrar
    expect(handleClose).not.toHaveBeenCalled();
  });
});
