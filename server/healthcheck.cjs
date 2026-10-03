// Жив ли процесс: любой ответ /api/health, включая 401 без сессии.
const https = require('node:https')

const req = https.get(
  'https://127.0.0.1:8443/api/health',
  { rejectUnauthorized: false },
  (res) => {
    res.resume()
    const code = res.statusCode ?? 0
    process.exit(code === 200 || code === 401 ? 0 : 1)
  },
)

req.on('error', () => process.exit(1))
