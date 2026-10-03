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
// Приложение живёт в корне домена. Пути иконок в манифесте склеиваются с base,
// чтобы при переезде на подпуть (например GitHub Pages) ничего не отвалилось:
// относительные пути в манифесте считаются от самого манифеста, а не от base.
const base = '/'

// Иконки домашнего экрана отдаём только непрозрачными PNG: iOS заливает
// прозрачные области чёрным, Android показывает иконку purpose: any как есть.
const icons = [
  { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' as const },
  { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' as const },
  { src: `${base}icon-maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
  { src: `${base}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
]

export default defineConfig(({ command, mode }) => {
  const useHttps = mode === 'https'
  const https = useHttps && hasTrustedCert
    ? { cert: readFileSync(certFile), key: readFileSync(keyFile) }
    : undefined

  return {
    base,
    build: { target: ['es2020', 'safari14'] },
    server: { host: true, port: 5173, https: command === 'serve' ? https : undefined },
    preview: { host: true, port: 4173, https },
    plugins: [
      react(),
      ...(command === 'serve' && useHttps && !hasTrustedCert ? [basicSsl({ name: 'yarntracker-dev' })] : []),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true }, // манифест и иконки доступны и в npm run dev
        includeAssets: ['favicon.ico', 'favicon-96.png', 'apple-touch-icon.png'],
        // по умолчанию workbox не кладёт шрифты в офлайн-кеш, и без сети текст
        // уезжает на системный шрифт
        workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'] },
        manifest: {
          name: 'Учет Пряжи',
          short_name: 'Пряжа',
          description: 'Личный трекер вязальных проектов',
          theme_color: '#FFF8F7',
          background_color: '#FFF8F7',
          lang: 'ru',
          id: base,
          scope: base,
          start_url: base,
          display: 'standalone',
          orientation: 'portrait',
          icons,
        }
      })
    ],
  }
})
