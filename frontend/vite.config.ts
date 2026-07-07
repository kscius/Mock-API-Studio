import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isTauri = !!process.env.TAURI_ENV_PLATFORM

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: isTauri ? './' : '/',
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api-definitions': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mock': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mock-grpc': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mock-graphql': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/src-tauri/**', '**/desktop/**'],
    },
  },
  build: {
    target: process.env.TAURI_ENV_PLATFORM
      ? process.env.TAURI_ENV_PLATFORM === 'windows'
        ? 'chrome105'
        : 'safari13'
      : 'es2020',
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})

