import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/tetris3/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['framer-motion'],
  },
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;",
        "style-src 'self' 'unsafe-inline' data:;",
        "connect-src 'self' ws: wss:;",
        "img-src 'self' data: blob:;",
        "font-src 'self' data:;"
      ].join(' ')
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  esbuild: {
    legalComments: 'none',
  },
});