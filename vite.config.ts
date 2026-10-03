import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: { target: ['es2020', 'safari14'] },
  plugins: [
    react(),
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
})