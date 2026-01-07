import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ['love-roro-game.up.railway.app', '.railway.app', 'all']
  },
  preview: {
    port: process.env.PORT || 3000,
    allowedHosts: ['love-roro-game.up.railway.app', '.railway.app', 'all']
  }
})
