import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ensureUser, SESSION_TTL_MS } from './auth.js'
import { buildApp } from './app.js'
import { openDatabase } from './db.js'

const PASSWORD = 'correct horse battery'

test('пароль хранится хешем и повторный старт его не затирает', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yarntracker-user-'))
  const db = openDatabase(join(dir, 'app.sqlite'))
  try {
    assert.equal(await ensureUser(db, 'knitter', PASSWORD), 'created')
    const row = db.prepare('select username, password_hash from users').get() as {
      username: string
      password_hash: string
    }
    assert.equal(row.username, 'knitter')
    assert.equal(row.password_hash.startsWith('$argon2id$'), true)
    assert.equal(row.password_hash.includes(PASSWORD), false)
    const revision = db.prepare('select revision from state_revisions').get() as { revision: number }
    assert.equal(revision.revision, 0)

    assert.equal(await ensureUser(db, 'knitter', 'another password phrase'), 'exists')
    const again = db.prepare('select password_hash from users').get() as { password_hash: string }
    assert.equal(again.password_hash, row.password_hash)
  } finally {
    db.close()
    rmSync(dir, { recursive: true, force: true })
  }
})

function cookiePair(setCookie: string | string[] | undefined): string {
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie
  assert.ok(raw)
  return raw.split(';')[0] ?? ''
}

test('вход, сессия, health и выход', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yarntracker-http-'))
  const staticRoot = join(dir, 'static')
  mkdirSync(staticRoot)
  writeFileSync(join(staticRoot, 'index.html'), '<!doctype html><title>Пряжник</title>')
  writeFileSync(join(staticRoot, 'app.js'), 'console.log(1)')
  const db = openDatabase(join(dir, 'app.sqlite'))
  await ensureUser(db, 'knitter', PASSWORD)
  const app = await buildApp({ db, staticRoot })
  try {
    const anon = await app.inject({ method: 'GET', url: '/api/health' })
    assert.equal(anon.statusCode, 401)
    assert.deepEqual(anon.json(), { error: 'unauthorized' })
    assert.equal(anon.headers['cache-control'], 'no-store')

    const meAnon = await app.inject({ method: 'GET', url: '/api/me' })
    assert.equal(meAnon.statusCode, 401)

    const bad = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'content-type': 'application/json' },
      payload: { username: 'knitter', password: 'wrong-password' },
    })
    assert.equal(bad.statusCode, 401)
    assert.equal(bad.headers['set-cookie'], undefined)

    const unknown = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'content-type': 'application/json' },
      payload: { username: 'other', password: PASSWORD },
    })
    assert.equal(unknown.statusCode, 401)

    const empty = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'content-type': 'application/json' },
      payload: { username: '  ', password: PASSWORD },
    })
    assert.equal(empty.statusCode, 400)

    const login = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'content-type': 'application/json' },
      payload: { username: ' knitter ', password: PASSWORD },
    })
    assert.equal(login.statusCode, 204)
    const setCookie = login.headers['set-cookie']
    const raw = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie)
    const folded = raw.toLowerCase()
    assert.match(folded, /httponly/)
    assert.match(folded, /secure/)
    assert.match(folded, /samesite=lax/)
    assert.match(raw, /Max-Age=7776000/)
    const pair = cookiePair(setCookie)

    const health = await app.inject({ method: 'GET', url: '/api/health', headers: { cookie: pair } })
    assert.equal(health.statusCode, 200)
    assert.deepEqual(health.json(), { ok: true })

    const me = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie: pair } })
    assert.equal(me.statusCode, 200)
    assert.deepEqual(me.json(), { username: 'knitter' })

    const stored = db.prepare('select expires_at as expiresAt from sessions').get() as
      | { expiresAt: number }
      | undefined
    assert.ok(stored)
    assert.ok(Math.abs(stored.expiresAt - (Date.now() + SESSION_TTL_MS)) < 10_000)

    const page = await app.inject({ method: 'GET', url: '/projects/1' })
    assert.equal(page.statusCode, 200)
    assert.match(page.body, /Пряжник/)

    const asset = await app.inject({ method: 'GET', url: '/app.js' })
    assert.equal(asset.statusCode, 200)
    assert.equal(asset.body, 'console.log(1)')

    const missingAsset = await app.inject({ method: 'GET', url: '/missing.js' })
    assert.equal(missingAsset.statusCode, 404)
    assert.equal(missingAsset.body, 'Not found')

    const missingApi = await app.inject({ method: 'GET', url: '/api/state' })
    assert.equal(missingApi.statusCode, 404)
    assert.deepEqual(missingApi.json(), { error: 'not_found' })

    const logout = await app.inject({ method: 'POST', url: '/api/logout', headers: { cookie: pair } })
    assert.equal(logout.statusCode, 204)
    const after = await app.inject({ method: 'GET', url: '/api/health', headers: { cookie: pair } })
    assert.equal(after.statusCode, 401)

    db.prepare('insert into sessions (token, user_id, expires_at) values (?, 1, ?)').run(
      'expired-token',
      Date.now() - 1000,
    )
    const expired = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: { cookie: 'session=expired-token' },
    })
    assert.equal(expired.statusCode, 401)
    assert.equal(db.prepare('select token from sessions where token = ?').get('expired-token'), undefined)
  } finally {
    await app.close()
    db.close()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('команда смены пароля пишет новый хеш и гасит сессию', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yarntracker-reset-'))
  const db = openDatabase(join(dir, 'app.sqlite'))
  await ensureUser(db, 'knitter', PASSWORD)
  const app = await buildApp({ db })
  try {
    const login = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'content-type': 'application/json' },
      payload: { username: 'knitter', password: PASSWORD },
    })
    const pair = cookiePair(login.headers['set-cookie'])

    const script = fileURLToPath(new URL('./reset-password.js', import.meta.url))
    const short = spawnSync(process.execPath, [script, 'short'], {
      env: { ...process.env, DATA_DIR: dir },
      encoding: 'utf8',
    })
    assert.equal(short.status, 1)

    const next = 'brand new passphrase'
    const reset = spawnSync(process.execPath, [script, next], {
      env: { ...process.env, DATA_DIR: dir },
      encoding: 'utf8',
    })
    assert.equal(reset.status, 0, reset.stderr)

    const oldLogin = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'content-type': 'application/json' },
      payload: { username: 'knitter', password: PASSWORD },
    })
    assert.equal(oldLogin.statusCode, 401)

    const still = await app.inject({ method: 'GET', url: '/api/health', headers: { cookie: pair } })
    assert.equal(still.statusCode, 401)

    const fresh = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'content-type': 'application/json' },
      payload: { username: 'knitter', password: next },
    })
    assert.equal(fresh.statusCode, 204)
  } finally {
    await app.close()
    db.close()
    rmSync(dir, { recursive: true, force: true })
  }
})
