import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

export type Sqlite = Database.Database

// И из server/src (ts), и из server/dist (собранный js) это каталог server/sql.
export function defaultSqlDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'sql')
}

function schemaVersion(db: Sqlite): number {
  const table = db
    .prepare("select 1 as ok from sqlite_master where type = 'table' and name = 'meta'")
    .get()
  if (!table) return 0
  const row = db.prepare("select value from meta where key = 'schema_version'").get() as
    | { value: string }
    | undefined
  if (!row) return 0
  const version = Number(row.value)
  return Number.isInteger(version) && version >= 0 ? version : 0
}

// Файлы 001_….sql, 002_….sql по порядку. Уже применённые пропускаются.
// Каждый файл сам создаёт meta, если таблицы ещё нет; номер версии пишет раннер.
export function migrate(db: Sqlite, directory: string): void {
  const files = readdirSync(directory)
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort((a, b) => Number(a.split('_')[0]) - Number(b.split('_')[0]))

  for (const name of files) {
    const version = Number(name.split('_')[0])
    if (!Number.isInteger(version)) continue
    if (version <= schemaVersion(db)) continue

    const sql = readFileSync(join(directory, name), 'utf8')
    const apply = db.transaction(() => {
      db.exec(sql)
      db.prepare(
        `insert into meta (key, value) values ('schema_version', ?)
         on conflict(key) do update set value = excluded.value`,
      ).run(String(version))
    })
    apply()
  }
}

export function openDatabase(file: string, directory = defaultSqlDir()): Sqlite {
  const dataDir = dirname(file)
  mkdirSync(dataDir, { recursive: true })
  mkdirSync(join(dataDir, 'files'), { recursive: true })

  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  migrate(db, directory)
  const sessions = db
    .prepare("select 1 from sqlite_master where type = 'table' and name = 'sessions'")
    .get()
  if (sessions) db.prepare('delete from sessions where expires_at <= ?').run(Date.now())
  return db
}
