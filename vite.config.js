import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/364-sky-archive/',
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