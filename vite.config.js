import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    open: true
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