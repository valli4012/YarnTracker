import { randomBytes } from 'node:crypto'
import { argon2id, hash, verify } from 'argon2'
import type { Sqlite } from './db.js'

export const SESSION_COOKIE = 'session'
export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000

const hashOptions = { type: argon2id } as const

let dummyHash: Promise<string> | undefined

function burnPasswordTime(password: string): Promise<void> {
  dummyHash ??= hash(randomBytes(32).toString('hex'), hashOptions)
  return dummyHash.then((digest) => verify(digest, password)).then(
    () => undefined,
    () => undefined,
  )
}

export function sessionCookieOptions(): {
  httpOnly: true
  secure: true
  sameSite: 'lax'
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  }
}

// Первый старт при пустой таблице users создаёт единственного пользователя.
// Повторный старт пароль из .env не перезаписывает.
export async function ensureUser(
  db: Sqlite,
  username: string,
  password: string,
): Promise<'created' | 'exists'> {
  const existing = db.prepare('select id from users limit 1').get()
  if (existing) return 'exists'

  const passwordHash = await hash(password, hashOptions)
  const createdAt = Date.now()
  const insert = db.transaction(() => {
    const info = db
      .prepare('insert into users (username, password_hash, created_at) values (?, ?, ?)')
      .run(username, passwordHash, createdAt)
    db.prepare('insert into state_revisions (user_id, revision) values (?, 0)').run(
      Number(info.lastInsertRowid),
    )
  })
  insert()
  return 'created'
}

export async function resetPassword(db: Sqlite, password: string): Promise<void> {
  const users = db.prepare('select id from users').all() as { id: number }[]
  if (users.length !== 1) {
    throw new Error(
      users.length === 0
        ? 'Пользователя ещё нет. Сначала запустите сервер: он создаст учётную запись из .env.'
        : 'В базе больше одного пользователя. Эта команда рассчитана на единственную учётную запись.',
    )
  }
  const passwordHash = await hash(password, hashOptions)
  const apply = db.transaction(() => {
    db.prepare('update users set password_hash = ? where id = ?').run(passwordHash, users[0].id)
    db.prepare('delete from sessions where user_id = ?').run(users[0].id)
  })
  apply()
}

export async function verifyLogin(
  db: Sqlite,
  username: string,
  password: string,
): Promise<{ id: number } | null> {
  const user = db
    .prepare('select id, password_hash from users where username = ?')
    .get(username) as { id: number; password_hash: string } | undefined
  if (!user) {
    await burnPasswordTime(password)
    return null
  }
  const ok = await verify(user.password_hash, password)
  return ok ? { id: user.id } : null
}

export function createSession(db: Sqlite, userId: number, now = Date.now()): string {
  const token = randomBytes(32).toString('base64url')
  db.prepare('insert into sessions (token, user_id, expires_at) values (?, ?, ?)').run(
    token,
    userId,
    now + SESSION_TTL_MS,
  )
  return token
}

export type SessionUser = { userId: number; username: string }

export function readSession(db: Sqlite, token: string | undefined, now = Date.now()): SessionUser | null {
  if (!token) return null
  const row = db
    .prepare(
      `select s.user_id as userId, s.expires_at as expiresAt, u.username as username
       from sessions s
       join users u on u.id = s.user_id
       where s.token = ?`,
    )
    .get(token) as { userId: number; expiresAt: number; username: string } | undefined
  if (!row) return null
  if (row.expiresAt <= now) {
    db.prepare('delete from sessions where token = ?').run(token)
    return null
  }
  return { userId: row.userId, username: row.username }
}

export function deleteSession(db: Sqlite, token: string | undefined): void {
  if (!token) return
  db.prepare('delete from sessions where token = ?').run(token)
}
