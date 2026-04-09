import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com/v8/finance/chart',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, '')
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Don't rewrite the path, just forward it to the local proxy server
      }
    }
  }
});
