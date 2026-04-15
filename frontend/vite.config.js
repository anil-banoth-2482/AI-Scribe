import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/start': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        // Disable buffering so SSE events stream properly through the proxy
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['cache-control'] = 'no-cache'
            proxyRes.headers['x-accel-buffering'] = 'no'
          })
        },
      },
      '/bot': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/summaries': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/translate': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/languages': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
