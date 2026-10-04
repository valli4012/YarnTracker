import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Connect, type Plugin } from 'vite'
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

// Vite отдаёт index.html на любой неизвестный путь, в том числе на `/foo.png`.
// Для иконок это худший вариант: телефон запрашивает картинку, получает HTML со
// статусом 200 и рисует пустой ярлык, а опечатка в пути не видна ни в логах, ни
// в DevTools. Отвечаем честным 404.
function imageNotFound(): Plugin {
  const imageRequest = /\.(png|ico|jpe?g|gif|webp|avif)$/i

  const middleware = (publicDir: string, root: string): Connect.NextHandleFunction => (req, res, next) => {
    const pathname = decodeURIComponent((req.url ?? '/').split('?')[0])
    if (!imageRequest.test(pathname)) return next()
    const relative = pathname.replace(/^\/+/, '')
    if (existsSync(resolve(publicDir, relative)) || existsSync(resolve(root, relative))) return next()
    res.statusCode = 404
    res.end('Not found')
  }

  return {
    name: 'yarntracker:image-not-found',
    configureServer: ({ middlewares, config }) => {
      middlewares.use(middleware(config.publicDir, config.root))
    },
    configurePreviewServer: ({ middlewares, config }) => {
      middlewares.use(middleware(resolve(config.root, config.build.outDir), config.root))
    },
  }
}

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
      imageNotFound(),
      ...(command === 'serve' && useHttps && !hasTrustedCert ? [basicSsl({ name: 'yarntracker-dev' })] : []),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true }, // манифест и иконки доступны и в npm run dev
        includeAssets: ['favicon.ico', 'favicon-96.png', 'apple-touch-icon.png'],
        // по умолчанию workbox не кладёт шрифты в офлайн-кеш, и без сети текст
        // уезжает на системный шрифт
        // API на том же origin, что и оболочка. Workbox не должен подменять
        // /api страницей index.html и не кладёт эти ответы в кеш оболочки.
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
        },
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
