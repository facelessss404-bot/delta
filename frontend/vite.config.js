import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    // Keep chunk sizes reasonable for fast loading
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Content-hashed filenames for long-term caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router-dom')) return 'vendor';
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) return 'ui';
          if (id.includes('node_modules/axios')) return 'http';
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'i18n';
        },
      },
    },
    // Enable source maps for debugging production issues
    sourcemap: false,
    // Inline assets smaller than 4KB
    assetsInlineLimit: 4096,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
