import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { assertCertFiles, ConfigError, loadConfig } from './config.js'

test('конфиг требует имя и пароль и по умолчанию слушает 8443', () => {
  assert.throws(() => loadConfig({}), ConfigError)
  assert.throws(() => loadConfig({ AUTH_USERNAME: 'knitter' }), ConfigError)
  const config = loadConfig({ AUTH_USERNAME: ' knitter ', AUTH_PASSWORD: 'phrase' })
  assert.equal(config.username, 'knitter')
  assert.equal(config.password, 'phrase')
  assert.equal(config.port, 8443)
  assert.equal(config.host, '0.0.0.0')
  assert.equal(config.dataDir, 'data')
  assert.equal(config.certFile, 'certs/cert.pem')
  assert.equal(config.keyFile, 'certs/key.pem')
})

test('без файлов сертификата старт запрещён', () => {
  const dir = mkdtempSync(join(tmpdir(), 'yarntracker-cert-'))
  try {
    assert.throws(() => assertCertFiles(join(dir, 'cert.pem'), join(dir, 'key.pem')), ConfigError)
    mkdirSync(join(dir, 'cert.pem'))
    writeFileSync(join(dir, 'key.pem'), 'key')
    assert.throws(() => assertCertFiles(join(dir, 'cert.pem'), join(dir, 'key.pem')), /cert\.pem/)
    rmSync(join(dir, 'cert.pem'), { recursive: true })
    writeFileSync(join(dir, 'cert.pem'), 'cert')
    assert.doesNotThrow(() => assertCertFiles(join(dir, 'cert.pem'), join(dir, 'key.pem')))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
