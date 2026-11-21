import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Publicación de Libros por Vendedor (RF-017, RF-018)', () => {
  test('debe requerir autenticación o mostrar formulario de publicación', async ({ page }) => {
    await page.goto('/?seccion=Publicar libro');

    // Si no está autenticado, el sistema debe redirigir a login o mostrar alerta de sesión requerida
    const loginPrompt = page.locator('text=/iniciar sesión|debes iniciar sesión|login/i').first();
    const tituloInput = page.locator('input[name="titulo"], input[placeholder*="título" i]').first();

    const isLoginPromptVisible = await loginPrompt.isVisible();
    const isFormVisible = await tituloInput.isVisible();

    expect(isLoginPromptVisible || isFormVisible).toBeTruthy();
  });

  test('debe validar la estructura del formulario de publicación cuando está disponible', async ({ page }) => {
    await page.goto('/?seccion=Publicar libro');
    const tituloInput = page.locator('input[name="titulo"], input[placeholder*="título" i]').first();

    if (await tituloInput.isVisible()) {
      const precioInput = page.locator('input[name="precio"], input[placeholder*="precio" i]').first();
      const autorInput = page.locator('input[name="autor"], input[placeholder*="autor" i]').first();
      await expect(precioInput).toBeVisible();
      await expect(autorInput).toBeVisible();
    }
  });
});
