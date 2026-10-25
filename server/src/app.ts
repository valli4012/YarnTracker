import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ServerOptions as HttpsOptions } from 'node:https'
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import cookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
import {
  SESSION_COOKIE,
  createSession,
  deleteSession,
  readSession,
  sessionCookieOptions,
  verifyLogin,
} from './auth.js'
import type { Sqlite } from './db.js'

export type BuildAppOptions = {
  db: Sqlite
  staticRoot?: string
  logger?: boolean
  dataDir?: string
  https?: HttpsOptions
}

type LoginBody = { username: string; password: string }
type AppState = { yarns: unknown[]; projects: unknown[] }

function stateBody(body: unknown): AppState | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const record = body as Record<string, unknown>
  if (!Array.isArray(record.yarns) || !Array.isArray(record.projects)) return null
  return { yarns: record.yarns, projects: record.projects }
}

function loginBody(body: unknown): LoginBody | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  if (typeof record.username !== 'string' || typeof record.password !== 'string') return null
  const username = record.username.trim()
  if (username === '' || record.password === '') return null
  return { username, password: record.password }
}

function sessionOf(db: Sqlite, request: FastifyRequest) {
  return readSession(db, request.cookies[SESSION_COOKIE])
}

function requireSession(db: Sqlite, request: FastifyRequest, reply: FastifyReply) {
  const session = sessionOf(db, request)
  if (!session) {
    reply.code(401).send({ error: 'unauthorized' })
    return null
  }
  return session
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const { db } = options
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 20 * 1024 * 1024,
    ...(options.https ? { https: options.https } : {}),
  })

  await app.register(cookie)

  app.addContentTypeParser(
    ['image/jpeg', 'image/png', 'image/webp'],
    { parseAs: 'buffer', bodyLimit: 10 * 1024 * 1024 },
    (_request, body, done) => done(null, body),
  )

  const filesDir = join(options.dataDir ?? join(process.cwd(), 'data'), 'files')
  mkdirSync(filesDir, { recursive: true })

  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0] ?? '/'
    if (path === '/api' || path.startsWith('/api/')) {
      reply.header('cache-control', 'no-store')
    }
  })

  // На этом этапе health закрыт сессией: так проверяется cookie.
  // В плане альфы тот же путь без логина — жив ли контейнер. Пока отдельной
  // проверки живости нет, Docker считает здоровым и 200, и 401.
  app.get('/api/health', async (request, reply) => {
    if (!requireSession(db, request, reply)) return
    return { ok: true }
  })

  app.post('/api/login', async (request, reply) => {
    const body = loginBody(request.body)
    if (!body) return reply.code(400).send({ error: 'bad_request' })
    const user = await verifyLogin(db, body.username, body.password)
    if (!user) return reply.code(401).send({ error: 'unauthorized' })
    const token = createSession(db, user.id)
    reply.setCookie(SESSION_COOKIE, token, sessionCookieOptions())
    return reply.code(204).send()
  })

  app.post('/api/logout', async (request, reply) => {
    deleteSession(db, request.cookies[SESSION_COOKIE])
    reply.clearCookie(SESSION_COOKIE, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    })
    return reply.code(204).send()
  })

  app.get('/api/me', async (request, reply) => {
    const session = requireSession(db, request, reply)
    if (!session) return
    return { username: session.username }
  })


  // Фотографии доступны только пользователю с действующей сессией.
  app.post('/api/files', async (request, reply) => {
    const session = requireSession(db, request, reply)
    if (!session) return

    const mime = request.headers['content-type']?.split(';')[0]?.trim()
    if (!mime || !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      return reply.code(415).send({ error: 'unsupported_image_type' })
    }

    const image = request.body
    if (!Buffer.isBuffer(image) || image.length === 0 || image.length > 10 * 1024 * 1024) {
      return reply.code(400).send({ error: 'bad_image_size' })
    }

    const validImage =
      (mime === 'image/jpeg' && image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff) ||
      (mime === 'image/png' && image.length >= 8 && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (mime === 'image/webp' && image.length >= 12 && image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP')
    if (!validImage) return reply.code(400).send({ error: 'invalid_image' })

    const result = db.prepare(
      `insert into files (user_id, kind, mime, byte_size, created_at)
       values (?, 'note', ?, ?, ?)`,
    ).run(session.userId, mime, image.length, Date.now())
    const id = Number(result.lastInsertRowid)

    try {
      writeFileSync(join(filesDir, String(id)), image, { flag: 'wx' })
    } catch (error) {
      db.prepare('delete from files where id = ? and user_id = ?').run(id, session.userId)
      throw error
    }

    return reply.code(201).send({ id, mime, byteSize: image.length })
  })

  app.get<{ Params: { id: string } }>('/api/files/:id', async (request, reply) => {
    const session = requireSession(db, request, reply)
    if (!session) return

    const id = Number(request.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return reply.code(400).send({ error: 'bad_file_id' })

    const file = db.prepare(
      "select mime from files where id = ? and user_id = ? and kind = 'note'",
    ).get(id, session.userId) as { mime: string } | undefined
    if (!file) return reply.code(404).send({ error: 'not_found' })

    try {
      const image = readFileSync(join(filesDir, String(id)))
      return reply.type(file.mime).header('X-Content-Type-Options', 'nosniff').send(image)
    } catch {
      return reply.code(404).send({ error: 'file_missing' })
    }
  })

  app.get('/api/state', async (request, reply) => {
    const session = requireSession(db, request, reply)
    if (!session) return
    const row = db.prepare('select payload from app_state where user_id = ?')
      .get(session.userId) as { payload: string } | undefined
    if (!row) return { yarns: [], projects: [] }
    try {
      return JSON.parse(row.payload) as AppState
    } catch {
      request.log.error('Invalid JSON in app_state; returning empty state')
      return { yarns: [], projects: [] }
    }
  })

  app.put('/api/state', async (request, reply) => {
    const session = requireSession(db, request, reply)
    if (!session) return
    const state = stateBody(request.body)
    if (!state) return reply.code(400).send({ error: 'bad_request' })
    const imageIds = [...new Set<number>(state.projects.flatMap((project): number[] => {
      if (!project || typeof project !== 'object' || !Array.isArray((project as { notes?: unknown }).notes)) return []
      return ((project as { notes: unknown[] }).notes).flatMap((note): number[] => {
        if (!note || typeof note !== 'object') return []
        const ids = (note as { imageIds?: unknown }).imageIds
        return Array.isArray(ids)
          ? ids.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
          : []
      })
    }))]
    const ownedIds = new Set((db.prepare("select id from files where user_id = ? and kind = 'note'").all(session.userId) as { id: number }[]).map((row) => row.id))
    if (imageIds.some((id) => !ownedIds.has(id))) return reply.code(400).send({ error: 'bad_image_reference' })

    const payload = JSON.stringify(state)
    db.prepare(
      `insert into app_state (user_id, payload, updated_at) values (?, ?, ?)
       on conflict(user_id) do update set payload = excluded.payload, updated_at = excluded.updated_at`,
    ).run(session.userId, payload, Date.now())

    const referenced = new Set(imageIds)
    const unused = (db.prepare("select id from files where user_id = ? and kind = 'note' and created_at < ?").all(session.userId, Date.now() - 5 * 60 * 1000) as { id: number }[])
      .filter((file) => !referenced.has(file.id))
    for (const file of unused) {
      try { unlinkSync(join(filesDir, String(file.id))) } catch { /* файл мог быть удалён вручную */ }
      db.prepare('delete from files where id = ? and user_id = ?').run(file.id, session.userId)
    }

    return reply.code(204).send()
  })

  const staticRoot = options.staticRoot
  const indexFile = staticRoot ? join(staticRoot, 'index.html') : ''
  if (staticRoot && existsSync(staticRoot)) {
    await app.register(fastifyStatic, { root: staticRoot })
  }

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split('?')[0] ?? '/'
    if (path === '/api' || path.startsWith('/api/')) {
      return reply.code(404).send({ error: 'not_found' })
    }
    if (!staticRoot || !existsSync(indexFile) || /\.[a-z0-9]+$/i.test(path)) {
      return reply.code(404).type('text/plain').send('Not found')
    }
    return reply.sendFile('index.html')
  })

  return app
}
