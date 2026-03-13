import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor core (React + Router)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting library
          'vendor-charts': ['recharts'],
          // Animation library
          'vendor-motion': ['framer-motion'],
          // Export utilities (PDF + Excel)
          'vendor-export': ['jspdf', 'jspdf-autotable', 'xlsx'],
          // UI helpers
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'react-countup', 'date-fns', 'clsx'],
        },
      },
    },
  },
})
