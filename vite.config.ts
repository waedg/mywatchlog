import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }
const build = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7)

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(build),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // L'utilisateur choisit quand recharger (message « Nouvelle version disponible »).
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'MyWatchlog',
        short_name: 'MyWatchlog',
        description: 'Suivi personnel de films et séries.',
        lang: 'fr',
        start_url: '/library',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f0f0e',
        theme_color: '#0f0f0e',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Seules les polices latines sont préchargées ; les autres jeux sont chargés à la demande.
        globIgnores: ['**/inter-cyrillic*', '**/inter-greek*', '**/inter-vietnamese*'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        // /api et Supabase ne sont jamais servis depuis le cache : seules les affiches TMDB le sont.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
