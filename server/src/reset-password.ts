import { join } from 'node:path'
import { resetPassword } from './auth.js'
import { openDatabase } from './db.js'

// docker compose exec app node server/dist/reset-password.js 'новая-фраза'
// Пароль из .env при старте не перечитывается, поэтому смена — отдельная команда.
async function main(): Promise<void> {
  const password = process.argv[2] ?? ''
  if (password.length < 8) {
    console.error("Использование: node server/dist/reset-password.js 'новый-пароль'")
    console.error('Нужна фраза от 8 символов. Команда пишет хеш в базу и стирает сессии.')
    process.exit(1)
  }

  const dataDir = process.env.DATA_DIR ?? 'data'
  const db = openDatabase(join(dataDir, 'app.sqlite'))
  try {
    await resetPassword(db, password)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    db.close()
  }
  console.log('Пароль обновлён, старые сессии сброшены.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
