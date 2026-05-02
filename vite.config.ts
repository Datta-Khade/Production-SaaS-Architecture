import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  
  root: path.resolve(__dirname, 'client'),
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'client', 'src', 'assets'),
    },
  },

  server: {
    port: 5173,
    fs: {
      allow: [
        path.resolve(__dirname),
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3009',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
