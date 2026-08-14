import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  base: './',

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,

    // GitHub Codespaces uses HTTPS for the browser,
    // so Vite's HMR WebSocket must use the forwarded HTTPS port.
    hmr: process.env.CODESPACES
      ? {
          clientPort: 443,
        }
      : true,
  },
})
