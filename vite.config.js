import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/shukran-portfolio/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
})