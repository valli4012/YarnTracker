import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// С телефона приложение открывается по IP машины, а не по localhost, поэтому
// service worker, установка PWA и микрофон требуют https. `npm run dev:http`
// (mode=http) оставляет обычный http, если самоподписанный сертификат мешает.
export default defineConfig(({ command, mode }) => {
  const useHttps = command === 'serve' && mode !== 'http'

  return {
    build: { target: ['es2020', 'safari14'] },
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
    plugins: [
      react(),
      ...(useHttps ? [basicSsl({ name: 'yarntracker-dev' })] : []),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true }, // манифест и иконки доступны и в npm run dev
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Учет Пряжи',
          short_name: 'Пряжа',
          description: 'Личный трекер вязальных проектов',
          theme_color: '#FEF7FF',
          background_color: '#FEF7FF',
          lang: 'ru',
          id: '/',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        }
      })
    ],
  }
})
