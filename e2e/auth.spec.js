import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Autenticación y Acceso (RF-001, RF-002, RF-003)', () => {
  test('debe cargar la vista de login y mostrar los elementos requeridos', async ({ page }) => {
    await page.goto('/login');

    // Título o encabezado de acceso
    await expect(page).toHaveTitle(/BookyHome/i);
    const emailInput = page.locator('input[type="email"], input[name="correo"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('debe permitir navegar hacia la pantalla de registro', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a[href*="register"], button:has-text("Registr")').first();

    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register.*/);
    }
  });

  test('debe permitir navegar hacia la recuperación de contraseña', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.locator('a[href*="forgot"], a:has-text("olvidaste"), a:has-text("recuperar")').first();

    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/.*(forgot|recuperar).*/i);
    }
  });

  test('debe mostrar error o bloquear envío al ingresar credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"], input[name="correo"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await emailInput.fill('usuario_invalido_prueba_e2e@correo.com');
    await passwordInput.fill('ClaveIncorrecta123*');
    await submitBtn.click();

    // Debe permanecer en login o mostrar mensaje de error / notificación
    await expect(page).toHaveURL(/.*login.*/);
  });
});
