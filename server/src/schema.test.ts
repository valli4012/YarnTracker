import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { openDatabase, migrate, type Sqlite } from './db.js'

function isSqliteError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error
}

function withDb(run: (db: Sqlite, dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'yarntracker-'))
  const db = openDatabase(join(dir, 'app.sqlite'))
  try {
    run(db, dir)
  } finally {
    db.close()
    rmSync(dir, { recursive: true, force: true })
  }
}

test('схема применяется один раз, WAL включён, каталог files создан', () => {
  withDb((db, dir) => {
    const version = db.prepare("select value from meta where key = 'schema_version'").get() as {
      value: string
    }
    assert.equal(version.value, '1')
    assert.equal(db.pragma('journal_mode', { simple: true }), 'wal')
    assert.equal(db.pragma('foreign_keys', { simple: true }), 1)

    const names = (
      db.prepare("select name from sqlite_master where type = 'table' order by name").all() as {
        name: string
      }[]
    ).map((row) => row.name)
    for (const name of [
      'meta',
      'users',
      'sessions',
      'files',
      'yarns',
      'yarn_materials',
      'projects',
      'project_materials',
      'project_stages',
      'project_notes',
      'note_files',
      'state_revisions',
    ]) {
      assert.ok(names.includes(name), name)
    }

    assert.equal(statSync(join(dir, 'files')).isDirectory(), true)

    const sqlDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'sql')
    migrate(db, sqlDir)
    const again = db.prepare("select value from meta where key = 'schema_version'").get() as {
      value: string
    }
    assert.equal(again.value, '1')
  })
})

test('повторный запуск не выполняет уже применённый файл', () => {
  const dir = mkdtempSync(join(tmpdir(), 'yarntracker-sql-'))
  const sqlDir = join(dir, 'sql')
  mkdirSync(sqlDir)
  writeFileSync(
    join(sqlDir, '001_init.sql'),
    `create table meta (key text primary key, value text not null);
     create table sample (id integer primary key);`,
  )
  writeFileSync(join(sqlDir, '002_more.sql'), 'alter table sample add column name text not null default \'\';')

  const db = openDatabase(join(dir, 'app.sqlite'), sqlDir)
  try {
    const version = db.prepare("select value from meta where key = 'schema_version'").get() as {
      value: string
    }
    assert.equal(version.value, '2')
    db.prepare('insert into sample (name) values (?)').run('ok')
    migrate(db, sqlDir)
    assert.equal(
      (db.prepare("select value from meta where key = 'schema_version'").get() as { value: string }).value,
      '2',
    )
  } finally {
    db.close()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('иконка, цвет и пустое фото изделия имеют заложенные значения', () => {
  withDb((db) => {
    db.prepare(
      'insert into users (username, password_hash, created_at) values (?, ?, ?)',
    ).run('knitter', 'hash', 1)
    db.prepare(
      `insert into projects (user_id, id, title, status, created_at, updated_at)
       values (1, 10, 'Шапка', 'planned', 10, 10)`,
    ).run()
    const project = db
      .prepare('select icon, accent, photo_file_id as photoFileId from projects where id = 10')
      .get() as { icon: string; accent: string; photoFileId: number | null }
    assert.deepEqual(project, { icon: 'garment', accent: 'neutral', photoFileId: null })

    db.prepare(
      `insert into files (user_id, kind, mime, byte_size, created_at)
       values (1, 'project', 'image/jpeg', 10, 1)`,
    ).run()
    const fileId = Number(
      (db.prepare('select id from files').get() as { id: number }).id,
    )
    db.prepare('update projects set photo_file_id = ? where id = 10').run(fileId)
    db.prepare('delete from files where id = ?').run(fileId)
    const cleared = db.prepare('select photo_file_id as photoFileId from projects where id = 10').get() as {
      photoFileId: number | null
    }
    assert.equal(cleared.photoFileId, null)
  })
})

test('моток, указанный в изделии, удалить нельзя; чужой статус и пустой kind отбрасываются', () => {
  withDb((db) => {
    db.prepare(
      'insert into users (username, password_hash, created_at) values (?, ?, ?)',
    ).run('knitter', 'hash', 1)
    db.prepare(
      `insert into yarns
        (user_id, id, brand, color_name, weight, length, stock, created_at, updated_at)
       values (1, 5, 'Alize', 'Red', 50, 175, 4, 1, 1)`,
    ).run()
    db.prepare(
      `insert into yarn_materials (user_id, yarn_id, position, name, percentage)
       values (1, 5, 0, 'Acrylic', 100)`,
    ).run()
    db.prepare(
      `insert into projects (user_id, id, title, status, created_at, updated_at, icon, accent)
       values (1, 9, 'Шарф', 'in_progress', 9, 9, 'scarf', 'teal')`,
    ).run()
    db.prepare(
      `insert into project_materials (user_id, project_id, position, yarn_id, quantity)
       values (1, 9, 0, 5, 2)`,
    ).run()
    db.prepare(
      `insert into project_stages (user_id, project_id, id, position, title, target_rows, current_rows, done)
       values (1, 9, 11, 0, 'Резинка', 12, 4, 0)`,
    ).run()
    db.prepare(
      `insert into project_notes (user_id, project_id, id, created_at, title, text)
       values (1, 9, 12, 12, 'Схема', 'https://example.com/pattern')`,
    ).run()

    assert.throws(
      () => db.prepare('delete from yarns where user_id = 1 and id = 5').run(),
      (error: unknown) => isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY',
    )
    assert.throws(
      () =>
        db.prepare(
          `insert into projects (user_id, id, title, status, created_at, updated_at)
           values (1, 8, 'Нет', 'nope', 1, 1)`,
        ).run(),
      (error: unknown) => isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_CHECK',
    )
    assert.throws(
      () =>
        db.prepare(
          `insert into files (user_id, kind, mime, byte_size, created_at)
           values (1, 'other', 'image/jpeg', 1, 1)`,
        ).run(),
      (error: unknown) => isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_CHECK',
    )
    assert.throws(
      () =>
        db.prepare(
          `insert into project_stages (user_id, project_id, id, position, title, done)
           values (1, 9, 13, 1, 'Ещё', 2)`,
        ).run(),
      (error: unknown) => isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_CHECK',
    )

    db.prepare('delete from projects where user_id = 1 and id = 9').run()
    db.prepare('delete from yarns where user_id = 1 and id = 5').run()
    assert.equal(
      (db.prepare('select count(*) as n from project_notes').get() as { n: number }).n,
      0,
    )
  })
})
