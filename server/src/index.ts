import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ensureUser } from './auth.js'
import { buildApp } from './app.js'
import { assertCertFiles, ConfigError, loadConfig } from './config.js'
import { openDatabase } from './db.js'

async function main(): Promise<void> {
  const config = loadConfig(process.env)
  assertCertFiles(config.certFile, config.keyFile)
  if (!existsSync(config.staticDir)) {
    throw new ConfigError(
      `Нет собранного фронтенда в ${config.staticDir}. Образ собирает его командой vite build.`,
    )
  }

  const db = openDatabase(join(config.dataDir, 'app.sqlite'))
  const created = await ensureUser(db, config.username, config.password)
  if (created === 'created') {
    console.log(`Создан пользователь «${config.username}». Пароль записан хешем.`)
  } else {
    console.log(
      `Пользователь уже есть, пароль из .env не меняю. ` +
        `Смена: node server/dist/reset-password.js 'новый-пароль'`,
    )
  }

  const app = await buildApp({
    db,
    dataDir: config.dataDir,
    staticRoot: config.staticDir,
    logger: true,
    https: {
      cert: readFileSync(config.certFile),
      key: readFileSync(config.keyFile),
    },
  })

  await app.listen({ host: config.host, port: config.port })
}

main().catch((error: unknown) => {
  if (error instanceof ConfigError) {
    console.error(error.message)
  } else {
    console.error(error)
  }
  process.exit(1)
})
