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
})
