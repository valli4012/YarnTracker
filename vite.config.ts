import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// Если в certs/ лежит сертификат, выписанный локальным доверенным центром
// (mkcert), берём его: Chrome отказывается регистрировать service worker на
// origin с ошибкой сертификата, поэтому для полноценной PWA на телефоне нужен
// именно доверенный сертификат. Иначе откатываемся на самоподписанный от
// basic-ssl — приложение и микрофон работают, service worker не регистрируется.
const certDir = resolve(import.meta.dirname, 'certs')
const certFile = resolve(certDir, 'cert.pem')
const keyFile = resolve(certDir, 'key.pem')
const hasTrustedCert = existsSync(certFile) && existsSync(keyFile)

// `npm run dev:https` (mode=https) поднимает dev-сервер по https: с телефона
// приложение открывается по IP машины, а это не secure context, без которого
// недоступны микрофон и установка PWA.
// Обычный `npm run dev` остаётся на http: на localhost это уже secure context,
// и сертификат там только мешает.
export default defineConfig(({ command, mode }) => {
  const useHttps = command === 'serve' && mode === 'https'

  return {
    build: { target: ['es2020', 'safari14'] },
    server: {
      host: true,
      port: 5173,
      https: useHttps && hasTrustedCert
        ? { cert: readFileSync(certFile), key: readFileSync(keyFile) }
        : undefined,
    },
    preview: { host: true, port: 4173 },
    plugins: [
      react(),
      ...(useHttps && !hasTrustedCert ? [basicSsl({ name: 'yarntracker-dev' })] : []),
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
