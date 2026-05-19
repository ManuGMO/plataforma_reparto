import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    server: {
      strictPort: true,
      // Puerto de desarrollo fijo para que el frontend arranque en http://localhost:3000
      port: env.VITE_PORT,
      host: true,
      allowedHosts: [
        'mercadolocal.inf.uach.cl'
      ]
    }
  }
})
