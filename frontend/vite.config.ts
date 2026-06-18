import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = '/diabetes-ai/' en production (GitHub Pages)
//      = '/'              en développement local
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/diabetes-ai/' : '/',
  server: {
    port: 5173,
  },
}))
