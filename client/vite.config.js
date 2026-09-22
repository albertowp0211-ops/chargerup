import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'ChargeUp',
        short_name: 'ChargeUp',
        description: 'Adaptador de corriente Apple 20W y cable USB-C de tela, originales. Envío desde España.',
        lang: 'es',
        display: 'standalone',
        start_url: '/',
        theme_color: '#080B14',
        background_color: '#080B14',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // El panel de admin y la API nunca deben servirse desde el shell precacheado
        navigateFallbackDenylist: [/^\/admin/, /^\/api/],
        runtimeCaching: [
          {
            urlPattern: /\/api\/products$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-products',
              expiration: { maxEntries: 1, maxAgeSeconds: 3600 },
            },
          },
        ],
      },
    }),
    // Solo al analizar el bundle: ANALYZE=1 npm run build
    process.env.ANALYZE === '1' &&
      visualizer({ filename: 'stats.html', gzipSize: true, open: false }),
  ].filter(Boolean),
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
