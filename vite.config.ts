import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error Node ESM handler used only in Vite dev/preview server
import { handleApiRequest } from './server/apiHandler.js';

function phuonghihiBackendPlugin() {
  return {
    name: 'phuonghihi-backend-api',
    configureServer(server: { middlewares: { use: (fn: (req: unknown, res: unknown, next: () => void) => void) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res);
        if (!handled) {
          next();
        }
      });
    },
    configurePreviewServer(server: { middlewares: { use: (fn: (req: unknown, res: unknown, next: () => void) => void) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res);
        if (!handled) {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), phuonghihiBackendPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          xlsx: ['xlsx'],
          leaflet: ['leaflet', 'qrcode'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
