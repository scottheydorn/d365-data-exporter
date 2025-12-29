import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/d365-data-exporter/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          msal: ['@azure/msal-browser', '@azure/msal-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
