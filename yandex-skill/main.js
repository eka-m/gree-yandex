import express from 'express'
import cors from 'cors'
import oauthApp from './oauth.js'
import smartHomeApi from './smart-home-api.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Логирование всех запросов
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || 'unknown'
  const timestamp = new Date().toISOString()
  
  console.log(`🌐 [${timestamp}] [${requestId}] ${req.method} ${req.path}`)
  next()
})

// Маршруты OAuth
app.use('/oauth', oauthApp)

// Маршруты Smart Home API
app.use('/', smartHomeApi)

// Корневой endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Gree HVAC Smart Home Service',
    version: '1.0.0',
    description: 'Сервис для управления кондиционерами Gree через Яндекс Умный Дом',
    endpoints: {
      oauth: {
        authorize: '/oauth/authorize',
        callback: '/oauth/callback',
        refresh: '/oauth/refresh',
        revoke: '/oauth/revoke'
      },
      smart_home: {
        devices: '/v1.0/user/devices',
        query: '/v1.0/user/devices/query',
        action: '/v1.0/user/devices/action'
      },
      health: '/health'
    }
  })
})

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  })
})

// Обработка ошибок
app.use((error, req, res, next) => {
  const requestId = req.headers['x-request-id']
  console.error(`❌ [${requestId}] Ошибка:`, error)
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  })
})

const PORT = process.env.PORT || 3002

app.listen(PORT, () => {
  console.log('🏠 Gree HVAC Smart Home Service запущен!')
  console.log(`🔗 Сервер: http://localhost:${PORT}`)
  console.log(`🔐 OAuth: http://localhost:${PORT}/oauth/authorize`)
  console.log(`📱 Smart Home API: http://localhost:${PORT}/v1.0/user/devices`)
  console.log(`❤️ Health Check: http://localhost:${PORT}/health`)
  console.log('')
  console.log('📋 Для настройки в Яндекс Developer Console:')
  console.log(`   OAuth Redirect URI: http://localhost:${PORT}/oauth/callback`)
  console.log(`   Smart Home API URL: http://localhost:${PORT}/v1.0`)
})

export default app 