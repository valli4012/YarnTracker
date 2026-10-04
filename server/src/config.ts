import { existsSync, statSync } from 'node:fs'

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export type Config = {
  username: string
  password: string
  dataDir: string
  certFile: string
  keyFile: string
  staticDir: string
  host: string
  port: number
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const username = (env.AUTH_USERNAME ?? '').trim()
  const password = env.AUTH_PASSWORD ?? ''
  if (!username || password === '') {
    throw new ConfigError(
      'Задайте AUTH_USERNAME и AUTH_PASSWORD в файле .env. Образец и пояснения — в .env.example.',
    )
  }

  const port = Number(env.PORT ?? '8443')
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError('PORT должен быть целым числом от 1 до 65535.')
  }

  return {
    username,
    password,
    dataDir: env.DATA_DIR ?? 'data',
    certFile: env.CERT_FILE ?? 'certs/cert.pem',
    keyFile: env.KEY_FILE ?? 'certs/key.pem',
    staticDir: env.STATIC_DIR ?? 'dist',
    host: env.HOST ?? '0.0.0.0',
    port,
  }
}

// Сертификат выпускает mkcert на серверной машине. Без файлов https не поднять,
// и процесс должен остановиться с понятным логом, а не слушать голый http.
export function assertCertFiles(certFile: string, keyFile: string): void {
  const missing = [certFile, keyFile].filter((file) => {
    if (!existsSync(file)) return true
    return !statSync(file).isFile()
  })
  if (missing.length === 0) return

  throw new ConfigError(
    'Нет сертификата HTTPS, процесс не запущен.\n' +
      `Не найдены файлы: ${missing.join(', ')}.\n` +
      'Нужны certs/cert.pem и certs/key.pem — их выпускает mkcert на IP серверной машины. ' +
      'Как это сделать, написано в README, раздел «Домашний сервер». ' +
      'Корневой сертификат на компьютер разработчика ставить не нужно.',
  )
}
