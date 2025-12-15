import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite conexiones desde la red local
    port: 5173,
    proxy: {
      // Proxy para OAuth callback y otras rutas de autenticación
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy para API endpoints
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
