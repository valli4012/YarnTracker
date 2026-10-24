import { existsSync } from 'node:fs'
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
    const payload = JSON.stringify(state)
    db.prepare(
      `insert into app_state (user_id, payload, updated_at) values (?, ?, ?)
       on conflict(user_id) do update set payload = excluded.payload, updated_at = excluded.updated_at`,
    ).run(session.userId, payload, Date.now())
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
