import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose to local network (0.0.0.0)
    port: 5173, // Default Vite port
    strictPort: false, // Use next available port if 5173 is busy
    open: true, // Auto-open browser on server start
  },
})
