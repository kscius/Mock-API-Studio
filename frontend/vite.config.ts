import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api-definitions': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mock': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})

