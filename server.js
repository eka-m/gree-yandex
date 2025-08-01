import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import Gree from 'gree-hvac-client'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// Конфигурация кондиционера (можно изменить IP адрес)
const HVAC_CONFIG = {
  host: process.env.HVAC_HOST || '192.168.31.8', // IP первого кондиционера
  port: 7000,
  autoConnect: false, // Отключаем автоматическое подключение
  poll: true,
  pollingInterval: 3000
}

let hvacClient = null
let deviceStatus = {
  power: 'off',
  mode: 'cool',
  temperature: 25,
  currentTemperature: 0,
  fanSpeed: 'auto',
  swingHor: 'default',
  swingVert: 'default',
  lights: 'off',
  health: 'off',
  sleep: 'off',
  turbo: 'off',
  quiet: 'off',
  blow: 'off',
  air: 'off',
  powerSave: 'off'
}

// Функция для создания клиента кондиционера
function createHVACClient() {
  try {
    console.log('Создание клиента для кондиционера...')
    
    // Сначала отключаем существующий клиент
    if (hvacClient) {
      try {
        hvacClient.disconnect()
      } catch (error) {
        console.log('Ошибка при отключении старого клиента:', error.message)
      }
    }
    
    // Убираем порт из host если он там есть
    if (HVAC_CONFIG.host.includes(':')) {
      const [host, port] = HVAC_CONFIG.host.split(':')
      HVAC_CONFIG.host = host
      HVAC_CONFIG.port = parseInt(port) || 7000
    }
    
    console.log(`🔗 Подключение к кондиционеру: ${HVAC_CONFIG.host}:${HVAC_CONFIG.port}`)
    
    hvacClient = new Gree.Client(HVAC_CONFIG)
    
    // Подключаемся к кондиционеру
    hvacClient.connect().then(() => {
      console.log('✅ Подключено к кондиционеру')
      io.emit('connection_status', 'connected')
    }).catch((error) => {
      console.error('❌ Ошибка подключения:', error.message)
      io.emit('connection_status', 'error')
    })
    
    hvacClient.on('connect', () => {
      console.log('✅ Подключено к кондиционеру')
      io.emit('connection_status', 'connected')
    })

    hvacClient.on('disconnect', () => {
      console.log('❌ Отключено от кондиционера')
      io.emit('connection_status', 'disconnected')
    })

    hvacClient.on('update', (updatedProperties, properties) => {
      console.log('📊 Обновление статуса:', updatedProperties)
      
      // Обновляем локальный статус
      Object.assign(deviceStatus, properties)
      
      // Отправляем обновления всем клиентам
      io.emit('device_update', properties)
    })

    hvacClient.on('error', (error) => {
      console.error('❌ Ошибка кондиционера:', error.message)
      io.emit('connection_status', 'error')
    })

    hvacClient.on('no_response', () => {
      console.log('⚠️ Нет ответа от кондиционера')
      io.emit('connection_status', 'error')
    })

  } catch (error) {
    console.error('❌ Ошибка создания клиента:', error.message)
    io.emit('connection_status', 'error')
  }
}

// Socket.IO обработчики
io.on('connection', (socket) => {
  console.log('🔌 Новый клиент подключен:', socket.id)
  
  // Отправляем текущий статус новому клиенту
  socket.emit('device_update', deviceStatus)
  
  // Отправляем статус подключения
  if (hvacClient && hvacClient.getDeviceId()) {
    socket.emit('connection_status', 'connected')
  } else {
    socket.emit('connection_status', 'disconnected')
  }

  // Обработка команд от клиента
  socket.on('set_property', async (data) => {
    const { property, value } = data
    console.log(`🎛️ Установка ${property} = ${value}`)
    
    if (!hvacClient) {
      console.log('❌ Клиент кондиционера не создан, создаем новый...')
      createHVACClient()
      
      // Ждем подключения
      setTimeout(async () => {
        try {
          if (hvacClient && hvacClient.getDeviceId()) {
            await hvacClient.setProperty(property, value)
            console.log(`✅ ${property} установлен в ${value}`)
          } else {
            console.log('❌ Клиент не подключен')
            socket.emit('error', { message: 'Не удалось подключиться к кондиционеру' })
          }
        } catch (error) {
          console.error(`❌ Ошибка установки ${property}:`, error.message)
          socket.emit('error', { message: `Ошибка установки ${property}` })
        }
      }, 3000)
      return
    }

    try {
      // Проверяем подключение через deviceId
      if (!hvacClient.getDeviceId()) {
        console.log('🔄 Клиент не подключен, подключаемся...')
        await hvacClient.connect()
      }
      
      await hvacClient.setProperty(property, value)
      console.log(`✅ ${property} установлен в ${value}`)
    } catch (error) {
      console.error(`❌ Ошибка установки ${property}:`, error.message)
      socket.emit('error', { message: `Ошибка установки ${property}` })
    }
  })

  // Переподключение к кондиционеру
  socket.on('reconnect_hvac', () => {
    console.log('🔄 Переподключение к кондиционеру...')
    if (hvacClient) {
      try {
        hvacClient.disconnect()
      } catch (error) {
        console.log('Ошибка при отключении:', error.message)
      }
    }
    setTimeout(() => {
      createHVACClient()
    }, 1000)
  })

  socket.on('disconnect', () => {
    console.log('🔌 Клиент отключен:', socket.id)
  })
})

// API маршруты
app.get('/api/status', (req, res) => {
  res.json({
    deviceStatus,
    hvacConnected: hvacClient && hvacClient.getDeviceId() ? true : false,
    deviceId: hvacClient ? hvacClient.getDeviceId() : null
  })
})

// Поиск кондиционеров в сети
app.post('/api/scan-hvac', async (req, res) => {
  try {
    console.log('🔍 Начинаем поиск кондиционеров...')
    
    const foundDevices = []
    const dgram = await import('dgram')
    const socket = dgram.default.createSocket('udp4')
    
    // Автоматически определяем подсеть
    const { exec } = await import('child_process')
    const util = await import('util')
    const execAsync = util.promisify(exec)
    
    let baseIP = '192.168.31.' // По умолчанию
    
    try {
      const { stdout } = await execAsync('netstat -nr | grep default | head -1 | awk \'{print $2}\'')
      const gatewayIP = stdout.trim()
      if (gatewayIP && gatewayIP !== '') {
        // Извлекаем подсеть из IP шлюза
        const parts = gatewayIP.split('.')
        if (parts.length === 4) {
          baseIP = `${parts[0]}.${parts[1]}.${parts[2]}.`
          console.log(`🔍 Определена подсеть: ${baseIP}0/24`)
        }
      }
    } catch (error) {
      console.log('⚠️ Не удалось определить подсеть автоматически, используем по умолчанию')
    }
    
    socket.on('error', (err) => {
      console.error('❌ Ошибка UDP сокета:', err.message)
      socket.close()
    })
    
    socket.on('message', (msg, rinfo) => {
      try {
        const message = msg.toString()
        console.log(`📨 Получено сообщение от ${rinfo.address}: ${message}`)
        
        // Расширенная проверка для различных типов кондиционеров
        if (message.includes('mac') || 
            message.includes('device') || 
            message.includes('gree') ||
            message.includes('xiaomi') ||
            message.includes('mi') ||
            message.includes('ac') ||
            message.includes('hvac') ||
            message.includes('temperature') ||
            message.includes('power')) {
          console.log(`✅ Найден кондиционер: ${rinfo.address}:${rinfo.port}`)
          foundDevices.push({
            ip: rinfo.address,
            port: rinfo.port,
            timestamp: Date.now(),
            message: message.substring(0, 100) // Сохраняем часть сообщения для анализа
          })
        }
      } catch (error) {
        // Игнорируем ошибки парсинга
      }
    })
    
    socket.bind(() => {
      console.log('🚀 Сканирование сети...')
      
      // Сканируем диапазон IP адресов (используем определенную подсеть)
      for (let i = 1; i <= 254; i++) {
        const ip = baseIP + i
        
        // Отправляем различные типы сообщений для поиска
        const messages = [
          Buffer.from('{"t": "scan"}'),
          Buffer.from('{"t": "pack"}'),
          Buffer.from('{"t": "bind"}'),
          Buffer.from('{"t": "control"}'),
          Buffer.from('{"pack": "scan"}'),
          Buffer.from('{"cmd": "scan"}'),
          Buffer.from('{"action": "discover"}')
        ]
        
        messages.forEach((message, index) => {
          setTimeout(() => {
            // Отправляем на разные порты
            const ports = [7000, 7001, 7002, 54321, 54322, 54323]
            ports.forEach(port => {
              socket.send(message, port, ip, (err) => {
                if (err) {
                  console.error(`❌ Ошибка отправки на ${ip}:${port}:`, err.message)
                }
              })
            })
          }, index * 100) // Небольшая задержка между сообщениями
        })
      }
      
      // Останавливаем сканирование через 20 секунд
      setTimeout(() => {
        socket.close()
        console.log(`📊 Найдено кондиционеров: ${foundDevices.length}`)
        res.json({ 
          success: true, 
          devices: foundDevices,
          message: foundDevices.length > 0 ? 'Кондиционеры найдены' : 'Кондиционеры не найдены'
        })
      }, 20000)
    })
    
  } catch (error) {
    console.error('❌ Ошибка поиска:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

app.post('/api/connect', (req, res) => {
  const { host } = req.body
  if (host) {
    // Разбираем host и port
    if (host.includes(':')) {
      const [hostPart, portPart] = host.split(':')
      HVAC_CONFIG.host = hostPart
      HVAC_CONFIG.port = parseInt(portPart) || 7000
    } else {
      HVAC_CONFIG.host = host
      HVAC_CONFIG.port = 7000
    }
    console.log(`🔗 Подключение к кондиционеру: ${HVAC_CONFIG.host}:${HVAC_CONFIG.port}`)
  }
  
  // Создаем новый клиент
  createHVACClient()
  
  // Ждем немного для инициализации
  setTimeout(() => {
    res.json({ 
      message: 'Подключение инициировано',
      host: `${HVAC_CONFIG.host}:${HVAC_CONFIG.port}`
    })
  }, 1000)
})

app.post('/api/disconnect', (req, res) => {
  if (hvacClient) {
    try {
      hvacClient.disconnect()
    } catch (error) {
      console.log('Ошибка при отключении:', error.message)
    }
  }
  res.json({ message: 'Отключено' })
})

// API endpoint для команд от Яндекс Диалогов
app.post('/api/command', async (req, res) => {
  const { property, value } = req.body
  
  if (!property || value === undefined) {
    return res.status(400).json({ error: 'Не указаны property или value' })
  }
  
  console.log(`🎤 Команда от Яндекса: ${property} = ${value}`)
  
  try {
    if (!hvacClient || !hvacClient.getDeviceId()) {
      console.log('🔄 Клиент не подключен, подключаемся...')
      createHVACClient()
      
      // Ждем подключения
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    
    if (hvacClient && hvacClient.getDeviceId()) {
      await hvacClient.setProperty(property, value)
      console.log(`✅ Команда выполнена: ${property} = ${value}`)
      res.json({ success: true, message: `Команда ${property} = ${value} выполнена` })
    } else {
      console.log('❌ Не удалось подключиться к кондиционеру')
      res.status(500).json({ error: 'Не удалось подключиться к кондиционеру' })
    }
    
  } catch (error) {
    console.error(`❌ Ошибка выполнения команды:`, error.message)
    res.status(500).json({ error: `Ошибка выполнения команды: ${error.message}` })
  }
})

// Статические файлы для продакшена
app.use(express.static('dist'))

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`)
  console.log(`📱 Веб-интерфейс: http://localhost:3000`)
  console.log(`🔧 API: http://localhost:${PORT}/api`)
  console.log(`🏠 Кондиционер: ${HVAC_CONFIG.host}:${HVAC_CONFIG.port}`)
  
  // Не создаем клиент автоматически - только по запросу
  console.log('✅ Сервер готов к работе')
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Завершение работы...')
  if (hvacClient) {
    hvacClient.disconnect()
  }
  server.close(() => {
    console.log('✅ Сервер остановлен')
    process.exit(0)
  })
}) 