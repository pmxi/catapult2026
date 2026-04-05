import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://vie.namikas.dev',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://vie.namikas.dev',
        changeOrigin: true,
      },
    },
  },
})
