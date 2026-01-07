import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Base path can be set via --base flag (e.g., for GitHub Pages)
  // For local dev and custom domains, defaults to '/'
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      watch: {
        usePolling: true,
        interval: 300,
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: './index.html',
          sw: './public/sw.js'
        }
      }
    },
    publicDir: 'public'
  };
});