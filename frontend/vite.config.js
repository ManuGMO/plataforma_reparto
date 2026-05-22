import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    server: {
      strictPort: true,
      port: env.VITE_PORT || 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'mercadolocal.inf.uach.cl'
      ],
      hmr: {
        host: 'mercadolocal.inf.uach.cl',
        protocol: 'wss', // wss significa WebSocket Secure (HTTPS)
        clientPort: 443 // El puerto por defecto de HTTPS
      }
    }
  }
})