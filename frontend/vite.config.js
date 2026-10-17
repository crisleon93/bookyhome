import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Permite acceder al dev server a través del reverse proxy local (Caddy)
    allowedHosts: ['bookyhome.local', 'localhost'],
  },
  test: {
    // Simula el DOM del navegador para poder renderizar componentes React
    environment: 'jsdom',
    // Carga los matchers de jest-dom en todos los tests automáticamente
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      // Solo medir cobertura de la lógica de negocio (pages + components)
      include: ['src/pages/**', 'src/components/**', 'src/context/**', 'src/services/**'],
      exclude: ['src/assets/**', 'src/styles/**'],
      reporter: ['text', 'html'],
      thresholds: {
        // Se activa en semana 7 cuando se alcance el 80%
        // lines: 80,
      },
    },
  },
})
