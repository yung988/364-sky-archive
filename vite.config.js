import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Určení, zda jsme na Vercelu
const isVercel = process.env.VERCEL === '1';

export default defineConfig({
  // Nastavení base podle prostředí
  base: isVercel ? '/' : '/364-sky-archive/',
  plugins: [react()],
  server: {
    open: true
  },
  preview: {
    host: true
  },
  // Configure static asset handling
  publicDir: 'public',
  // Ensure proper handling of Three.js
  resolve: {
    alias: {
      'three': 'three'
    }
  }
}); 