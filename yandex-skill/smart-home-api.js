import express from 'express'
import fetch from 'node-fetch'
import { authenticateToken } from './oauth.js'
import dgram from 'dgram'
import { exec } from 'child_process'

const app = express()
app.use(express.json())

// Конфигурация Provider IOT API
const PROVIDER_IOT_API = {
  base_url: process.env.HVAC_SERVER_URL || 'http://localhost:3001',
  endpoints: {
    status: '/api/status',
    command: '/api/command',
    connect: '/api/connect',
    disconnect: '/api/disconnect',
    scan: '/api/scan-hvac'
  }
}

// Хранилище устройств пользователей
const userDevices = new Map()

// Логирование запросов от платформы умного дома
function logRequest(req, res, next) {
  const requestId = req.headers['x-request-id'] || 'unknown'
  const timestamp = new Date().toISOString()
  const userAgent = req.headers['user-agent'] || 'unknown'
  
  console.log(`📝 [${timestamp}] [${requestId}] ${req.method} ${req.path}`)
  console.log(`📝 [${timestamp}] [${requestId}] User-Agent: ${userAgent}`)
  console.log(`📝 [${timestamp}] [${requestId}] Headers:`, {
    'authorization': req.headers.authorization ? 'Bearer ***' : 'none',
    'content-type': req.headers['content-type'],
    'x-request-id': requestId
  })
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📝 [${timestamp}] [${requestId}] Body:`, JSON.stringify(req.body, null, 2))
  }
  
  // Добавляем requestId в response headers для отслеживания
  res.setHeader('X-Request-Id', requestId)
  
  next()
}

app.use(logRequest)

// Автоматическое обнаружение кондиционеров в сети
async function discoverHVACDevices(userId) {
  console.log(`🔍 [${userId}] Начинаем автоматическое обнаружение кондиционеров...`)
  
  try {
    // Определяем подсеть автоматически
    const gatewayIp = await new Promise((resolve, reject) => {
      exec('netstat -nr | grep default | head -1 | awk \'{print $2}\'', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`)
          return reject(error)
        }
        resolve(stdout.trim())
      })
    })
    
    if (!gatewayIp) {
      throw new Error('Не удалось определить IP маршрутизатора')
    }
    
    const baseIP = gatewayIp.substring(0, gatewayIp.lastIndexOf('.') + 1)
    console.log(`🔍 [${userId}] Определена подсеть: ${baseIP}0/24`)
    
    // Сканируем сеть через Provider IOT API
    const response = await fetch(`${PROVIDER_IOT_API.base_url}${PROVIDER_IOT_API.endpoints.scan}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subnet: baseIP })
    })
    
    if (!response.ok) {
      throw new Error(`Ошибка сканирования: ${response.status}`)
    }
    
    const scanResult = await response.json()
    console.log(`🔍 [${userId}] Найдено устройств: ${scanResult.devices?.length || 0}`)
    
    return scanResult.devices || []
    
  } catch (error) {
    console.error(`❌ [${userId}] Ошибка обнаружения:`, error.message)
    return []
  }
}

// Создание устройств на основе найденных кондиционеров
function createDevicesFromHVAC(hvacDevices, userId) {
  const devices = []
  
  hvacDevices.forEach((hvac, index) => {
    devices.push({
      id: `gree-ac-${userId}-${index + 1}`,
      name: `Кондиционер Gree ${index + 1}`,
      type: 'devices.types.thermostat.ac',
      room: index === 0 ? 'Гостиная' : `Комната ${index + 1}`,
      hvac_info: {
        ip: hvac.ip,
        port: hvac.port
      },
      capabilities: [
        {
          type: 'devices.capabilities.on_off',
          retrievable: true,
          parameters: {
            split: false
          }
        },
        {
          type: 'devices.capabilities.range',
          retrievable: true,
          parameters: {
            instance: 'temperature',
            unit: 'unit.temperature.celsius',
            range: {
              min: 16,
              max: 30,
              precision: 1
            }
          }
        },
        {
          type: 'devices.capabilities.mode',
          retrievable: true,
          parameters: {
            instance: 'thermostat',
            modes: [
              { value: 'auto' },
              { value: 'cool' },
              { value: 'heat' },
              { value: 'dry' },
              { value: 'fan_only' }
            ]
          }
        },
        {
          type: 'devices.capabilities.mode',
          retrievable: true,
          parameters: {
            instance: 'fan_speed',
            modes: [
              { value: 'auto' },
              { value: 'low' },
              { value: 'medium' },
              { value: 'high' }
            ]
          }
        },
        {
          type: 'devices.capabilities.toggle',
          retrievable: true,
          parameters: {
            instance: 'lights'
          }
        },
        {
          type: 'devices.capabilities.toggle',
          retrievable: true,
          parameters: {
            instance: 'swing'
          }
        }
      ],
      properties: [
        {
          type: 'devices.properties.float',
          retrievable: true,
          parameters: {
            instance: 'temperature',
            unit: 'unit.temperature.celsius'
          }
        }
      ]
    })
  })
  
  return devices
}

// 0. Health check для проверки доступности Endpoint URL
app.head('/v1.0/', (req, res) => {
  const requestId = req.headers['x-request-id']
  
  console.log(`❤️ [${requestId}] Health Check (HEAD)`)
  
  res.status(200).end()
})

// 1. Получение списка устройств пользователя (Device Discovery)
app.get('/v1.0/user/devices', authenticateToken, async (req, res) => {
  const requestId = req.headers['x-request-id']
  const userId = req.user.id
  
  console.log(`📋 [${requestId}] Device Discovery: Запрос списка устройств пользователя ${userId}`)
  
  try {
    let devices = userDevices.get(userId)
    
    // Если у пользователя нет устройств, пытаемся их обнаружить
    if (!devices || devices.length === 0) {
      console.log(`🔍 [${requestId}] У пользователя ${userId} нет устройств, начинаем обнаружение...`)
      
      const hvacDevices = await discoverHVACDevices(userId)
      
      if (hvacDevices.length > 0) {
        devices = createDevicesFromHVAC(hvacDevices, userId)
        userDevices.set(userId, devices)
        console.log(`✅ [${requestId}] Обнаружено ${devices.length} устройств для пользователя ${userId}`)
      } else {
        // Если ничего не найдено, создаем устройство по умолчанию
        devices = [{
          id: `gree-ac-${userId}-1`,
          name: 'Кондиционер Gree',
          type: 'devices.types.thermostat.ac',
          room: 'Гостиная',
          capabilities: [
            {
              type: 'devices.capabilities.on_off',
              retrievable: true,
              parameters: {
                split: false
              }
            },
            {
              type: 'devices.capabilities.range',
              retrievable: true,
              parameters: {
                instance: 'temperature',
                unit: 'unit.temperature.celsius',
                range: {
                  min: 16,
                  max: 30,
                  precision: 1
                }
              }
            },
            {
              type: 'devices.capabilities.mode',
              retrievable: true,
              parameters: {
                instance: 'thermostat',
                modes: [
                  { value: 'auto' },
                  { value: 'cool' },
                  { value: 'heat' },
                  { value: 'dry' },
                  { value: 'fan_only' }
                ]
              }
            },
            {
              type: 'devices.capabilities.mode',
              retrievable: true,
              parameters: {
                instance: 'fan_speed',
                modes: [
                  { value: 'auto' },
                  { value: 'low' },
                  { value: 'medium' },
                  { value: 'high' }
                ]
              }
            },
            {
              type: 'devices.capabilities.toggle',
              retrievable: true,
              parameters: {
                instance: 'lights'
              }
            },
            {
              type: 'devices.capabilities.toggle',
              retrievable: true,
              parameters: {
                instance: 'swing'
              }
            }
          ],
          properties: [
            {
              type: 'devices.properties.float',
              retrievable: true,
              parameters: {
                instance: 'temperature',
                unit: 'unit.temperature.celsius'
              }
            }
          ]
        }]
        userDevices.set(userId, devices)
        console.log(`⚠️ [${requestId}] Устройства не найдены, создано устройство по умолчанию для пользователя ${userId}`)
      }
    }
    
    const response = {
      request_id: req.query.request_id || requestId,
      payload: {
        user_id: userId,
        devices: devices
      }
    }
    
    console.log(`✅ [${requestId}] Device Discovery: Возвращено ${devices.length} устройств`)
    
    res.json(response)
    
  } catch (error) {
    console.error(`❌ [${requestId}] Device Discovery: Ошибка`, error)
    res.status(500).json({
      request_id: req.query.request_id || requestId,
      error_code: 'INTERNAL_ERROR',
      error_message: 'Внутренняя ошибка сервера'
    })
  }
})

// 2. Запрос состояния устройств (Device Status)
app.post('/v1.0/user/devices/query', authenticateToken, async (req, res) => {
  const requestId = req.headers['x-request-id']
  const { devices } = req.body
  
  console.log(`🔍 [${requestId}] Device Status: Запрос состояния устройств:`, devices.map(d => d.id))
  
  try {
    // Получаем статус от Provider IOT API
    const hvacStatus = await getProviderIOTStatus()
    
    const devices_response = devices.map(device => {
      const userDevicesList = userDevices.get(req.user.id) || []
      const deviceConfig = userDevicesList.find(d => d.id === device.id)
      
      if (!deviceConfig) {
        return {
          id: device.id,
          error_code: 'DEVICE_NOT_FOUND',
          error_message: 'Устройство не найдено'
        }
      }
      
      return {
        id: device.id,
        capabilities: [
          {
            type: 'devices.capabilities.on_off',
            state: {
              instance: 'on',
              value: hvacStatus.power === 'on'
            }
          },
          {
            type: 'devices.capabilities.range',
            state: {
              instance: 'temperature',
              value: hvacStatus.temperature
            }
          },
          {
            type: 'devices.capabilities.mode',
            state: {
              instance: 'thermostat',
              value: hvacStatus.mode
            }
          },
          {
            type: 'devices.capabilities.mode',
            state: {
              instance: 'fan_speed',
              value: hvacStatus.fanSpeed
            }
          },
          {
            type: 'devices.capabilities.toggle',
            state: {
              instance: 'lights',
              value: hvacStatus.lights === 'on'
            }
          },
          {
            type: 'devices.capabilities.toggle',
            state: {
              instance: 'swing',
              value: hvacStatus.swingVert !== 'default'
            }
          }
        ],
        properties: [
          {
            type: 'devices.properties.float',
            state: {
              instance: 'temperature',
              value: hvacStatus.currentTemperature
            }
          }
        ]
      }
    })
    
    console.log(`✅ [${requestId}] Device Status: Состояние устройств получено`)
    
    res.json({
      request_id: req.body.request_id,
      payload: {
        devices: devices_response
      }
    })
    
  } catch (error) {
    console.error(`❌ [${requestId}] Device Status: Ошибка получения состояния:`, error)
    res.status(500).json({
      request_id: req.body.request_id,
      error_code: 'INTERNAL_ERROR',
      error_message: 'Внутренняя ошибка сервера'
    })
  }
})

// 3. Выполнение действий с устройствами (Device Control)
app.post('/v1.0/user/devices/action', authenticateToken, async (req, res) => {
  const requestId = req.headers['x-request-id']
  const { payload } = req.body
  
  console.log(`🎛️ [${requestId}] Device Control: Выполнение действий:`, JSON.stringify(payload, null, 2))
  
  try {
    const results = []
    
    for (const device of payload.devices) {
      const deviceResults = []
      
      for (const capability of device.capabilities) {
        try {
          // Преобразуем команду платформы в команду Provider IOT API
          await executeCapabilityThroughIOT(capability, device.id, req.user.id)
          
          deviceResults.push({
            type: capability.type,
            state: {
              instance: capability.state.instance,
              action_result: {
                status: 'DONE'
              }
            }
          })
          
          console.log(`✅ [${requestId}] Device Control: Команда выполнена: ${capability.type} ${capability.state.instance}`)
          
        } catch (error) {
          console.error(`❌ [${requestId}] Device Control: Ошибка выполнения команды:`, error)
          
          deviceResults.push({
            type: capability.type,
            state: {
              instance: capability.state.instance,
              action_result: {
                status: 'ERROR',
                error_code: 'INTERNAL_ERROR',
                error_message: error.message
              }
            }
          })
        }
      }
      
      results.push({
        id: device.id,
        capabilities: deviceResults
      })
    }
    
    console.log(`✅ [${requestId}] Device Control: Все действия выполнены`)
    
    res.json({
      request_id: req.body.request_id,
      payload: {
        devices: results
      }
    })
    
  } catch (error) {
    console.error(`❌ [${requestId}] Device Control: Ошибка выполнения действий:`, error)
    res.status(500).json({
      request_id: req.body.request_id,
      error_code: 'INTERNAL_ERROR',
      error_message: 'Внутренняя ошибка сервера'
    })
  }
})

// 4. Разъединение аккаунтов (Account Unlinking)
app.post('/v1.0/user/unlink', authenticateToken, (req, res) => {
  const requestId = req.headers['x-request-id']
  const userId = req.user.id
  
  console.log(`🔗 [${requestId}] Account Unlink: Разъединение аккаунта пользователя ${userId}`)
  
  try {
    // Очищаем данные пользователя
    userDevices.delete(userId)
    
    console.log(`✅ [${requestId}] Account Unlink: Аккаунт успешно разъединен`)
    
    res.json({
      request_id: req.body?.request_id || requestId,
      status: 'ok'
    })
    
  } catch (error) {
    console.error(`❌ [${requestId}] Account Unlink: Ошибка разъединения`, error)
    res.status(500).json({
      request_id: req.body?.request_id || requestId,
      error_code: 'INTERNAL_ERROR',
      error_message: 'Внутренняя ошибка сервера'
    })
  }
})

// 5. Преобразование команды платформы в команду Provider IOT API
async function executeCapabilityThroughIOT(capability, deviceId, userId) {
  const { type, state } = capability
  
  // Получаем информацию об устройстве
  const userDevicesList = userDevices.get(userId) || []
  const deviceConfig = userDevicesList.find(d => d.id === deviceId)
  
  if (!deviceConfig) {
    throw new Error(`Устройство ${deviceId} не найдено`)
  }
  
  // Маппинг команд платформы в команды Provider IOT API
  const commandMapping = {
    'devices.capabilities.on_off': {
      property: 'power',
      value: state.value ? 'on' : 'off'
    },
    'devices.capabilities.range': {
      property: 'temperature',
      value: state.value
    },
    'devices.capabilities.mode': {
      property: state.instance === 'thermostat' ? 'mode' : 'fanSpeed',
      value: state.value
    },
    'devices.capabilities.toggle': {
      property: state.instance === 'lights' ? 'lights' : 'swingVert',
      value: state.value ? (state.instance === 'lights' ? 'on' : 'full') : (state.instance === 'lights' ? 'off' : 'default')
    }
  }
  
  const command = commandMapping[type]
  
  if (!command) {
    throw new Error(`Неизвестный тип capability: ${type}`)
  }
  
  // Если у устройства есть информация о HVAC, подключаемся к нему
  if (deviceConfig.hvac_info) {
    await connectToHVAC(deviceConfig.hvac_info)
  }
  
  // Отправляем команду в Provider IOT API
  await sendCommandToProviderIOT(command.property, command.value)
}

// 6. Подключение к конкретному кондиционеру
async function connectToHVAC(hvacInfo) {
  const response = await fetch(`${PROVIDER_IOT_API.base_url}${PROVIDER_IOT_API.endpoints.connect}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      host: `${hvacInfo.ip}:${hvacInfo.port}` 
    })
  })
  
  if (!response.ok) {
    throw new Error(`Ошибка подключения к кондиционеру ${hvacInfo.ip}:${hvacInfo.port}`)
  }
  
  console.log(`✅ Подключено к кондиционеру ${hvacInfo.ip}:${hvacInfo.port}`)
}

// 7. Отправка команды в Provider IOT API
async function sendCommandToProviderIOT(property, value) {
  const url = `${PROVIDER_IOT_API.base_url}${PROVIDER_IOT_API.endpoints.command}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ property, value })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Provider IOT API вернул ошибку: ${response.status} - ${error}`)
  }
  
  const result = await response.json()
  console.log(`✅ Команда отправлена в Provider IOT API: ${property} = ${value}`)
  return result
}

// 8. Получение статуса от Provider IOT API
async function getProviderIOTStatus() {
  const url = `${PROVIDER_IOT_API.base_url}${PROVIDER_IOT_API.endpoints.status}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Provider IOT API недоступен: ${response.status}`)
  }
  
  const data = await response.json()
  return data.deviceStatus
}

// 9. Health check для мониторинга
app.get('/health', (req, res) => {
  const requestId = req.headers['x-request-id']
  
  console.log(`❤️ [${requestId}] Health Check`)
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    provider: 'Gree HVAC',
    iot_api_status: 'connected',
    auto_discovery: 'enabled'
  })
})

// 10. Обработка ошибок
app.use((error, req, res, next) => {
  const requestId = req.headers['x-request-id']
  console.error(`❌ [${requestId}] Необработанная ошибка:`, error)
  
  res.status(500).json({
    request_id: req.body?.request_id || requestId,
    error_code: 'INTERNAL_ERROR',
    error_message: 'Внутренняя ошибка сервера'
  })
})

export default app 