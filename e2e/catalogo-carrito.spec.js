import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Catálogo, Búsqueda y Carrito de Compras (RF-008, RF-010, RF-034)', () => {
  test('debe cargar el catálogo principal y listar libros', async ({ page }) => {
    await page.goto('/');

    // Verificar presencia del catálogo
    const heading = page.locator('h1, h2, span').filter({ hasText: /catálogo/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Verificar que existan tarjetas o botones de libros
    const cards = page.locator('button:has-text("Ver detalles"), div[data-testid^="librocard"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('debe permitir abrir la vista detallada de un libro', async ({ page }) => {
    await page.goto('/');
    const btnDetalles = page.locator('button:has-text("Ver detalles")').first();
    await expect(btnDetalles).toBeVisible({ timeout: 10000 });
    await btnDetalles.click();

    // Comprobar elementos de detalle simétricos: Comprar ahora, Agregar al carrito, etc.
    const accionComprar = page.locator('button:has-text("Comprar ahora"), button:has-text("Agregar al carrito")').first();
    await expect(accionComprar).toBeVisible({ timeout: 8000 });
  });

  test('debe permitir navegar a la sección del carrito', async ({ page }) => {
    await page.goto('/');
    const btnCarrito = page.locator('button[title*="carrito" i], a[href*="carrito" i], button:has-text("Carrito")').first();

    if (await btnCarrito.isVisible()) {
      await btnCarrito.click();
      // Debe mostrar la vista o drawer del carrito
      await expect(page.locator('text=/carrito/i').first()).toBeVisible();
    }
  });
});
