import express from 'express'
import crypto from 'crypto'

const app = express()
app.use(express.json())

// Хранилище токенов (в продакшене используйте базу данных)
const tokens = new Map()
const users = new Map()

// Конфигурация OAuth
const OAUTH_CONFIG = {
  client_id: process.env.YANDEX_CLIENT_ID || 'your-client-id',
  client_secret: process.env.YANDEX_CLIENT_SECRET || 'your-client-secret',
  redirect_uri: process.env.REDIRECT_URI || 'https://your-domain.com/oauth/callback',
  scope: 'home:read home:write'
}

// Генерация случайного токена
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// OAuth endpoints

// 1. Авторизация - перенаправление на Яндекс
app.get('/oauth/authorize', (req, res) => {
  const { state } = req.query
  
  const authUrl = `https://oauth.yandex.ru/authorize?` +
    `response_type=code&` +
    `client_id=${OAUTH_CONFIG.client_id}&` +
    `redirect_uri=${encodeURIComponent(OAUTH_CONFIG.redirect_uri)}&` +
    `scope=${encodeURIComponent(OAUTH_CONFIG.scope)}&` +
    `state=${state || 'default'}`
  
  console.log('🔐 Перенаправление на авторизацию:', authUrl)
  res.redirect(authUrl)
})

// 2. Callback - получение кода авторизации
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query
  
  if (!code) {
    return res.status(400).json({ error: 'Код авторизации не получен' })
  }
  
  try {
    // Обмен кода на токен
    const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: OAUTH_CONFIG.client_id,
        client_secret: OAUTH_CONFIG.client_secret,
        redirect_uri: OAUTH_CONFIG.redirect_uri
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('❌ Ошибка получения токена:', tokenData)
      return res.status(400).json({ error: 'Ошибка получения токена' })
    }
    
    // Получение информации о пользователе
    const userResponse = await fetch('https://login.yandex.ru/info', {
      headers: {
        'Authorization': `OAuth ${tokenData.access_token}`
      }
    })
    
    const userData = await userResponse.json()
    
    // Сохранение токена
    const accessToken = generateToken()
    tokens.set(accessToken, {
      yandex_token: tokenData.access_token,
      user_id: userData.id,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    })
    
    users.set(userData.id, {
      id: userData.id,
      name: userData.real_name || userData.display_name,
      email: userData.default_email
    })
    
    console.log('✅ Пользователь авторизован:', userData.id)
    
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: tokenData.expires_in,
      user: {
        id: userData.id,
        name: userData.real_name || userData.display_name
      }
    })
    
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error)
    res.status(500).json({ error: 'Ошибка авторизации' })
  }
})

// 3. Проверка токена (middleware)
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' })
  }
  
  const tokenData = tokens.get(token)
  
  if (!tokenData) {
    return res.status(401).json({ error: 'Недействительный токен' })
  }
  
  if (Date.now() > tokenData.expires_at) {
    tokens.delete(token)
    return res.status(401).json({ error: 'Токен истек' })
  }
  
  req.user = users.get(tokenData.user_id)
  req.token = tokenData
  next()
}

// 4. Обновление токена
app.post('/oauth/refresh', async (req, res) => {
  const { refresh_token } = req.body
  
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token не предоставлен' })
  }
  
  try {
    const response = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: OAUTH_CONFIG.client_id,
        client_secret: OAUTH_CONFIG.client_secret
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return res.status(400).json({ error: 'Ошибка обновления токена' })
    }
    
    res.json({
      access_token: data.access_token,
      token_type: 'Bearer',
      expires_in: data.expires_in
    })
    
  } catch (error) {
    console.error('❌ Ошибка обновления токена:', error)
    res.status(500).json({ error: 'Ошибка обновления токена' })
  }
})

// 5. Отзыв токена
app.post('/oauth/revoke', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (token) {
    tokens.delete(token)
  }
  
  res.json({ message: 'Токен отозван' })
})

export default app 