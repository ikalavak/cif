import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // ✅ Forces explicit IPv4 binding for local load testing
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['playwright', 'playwright-core', 'fsevents', 'chromium-bidi'],
  },
});