import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { otpApiPlugin } from './src/services/otpPlugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      tailwindcss(),
      react(),
      otpApiPlugin(env),
    ],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
  };
})
