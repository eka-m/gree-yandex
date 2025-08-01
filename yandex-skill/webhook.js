import express from 'express'
import fetch from 'node-fetch'

const app = express()
app.use(express.json())

// Конфигурация
const HVAC_SERVER_URL = 'http://localhost:3001'
const YANDEX_SKILL_ID = 'your-skill-id'

// Обработка webhook от Яндекс Диалогов
app.post('/yandex-webhook', async (req, res) => {
  try {
    const { request, session, version } = req.body
    
    console.log('📱 Получена команда от Яндекса:', request.command)
    
    let response = {
      version,
      session,
      response: {
        text: 'Команда выполнена',
        end_session: false
      }
    }
    
    // Обработка различных интентов
    switch (request.type) {
      case 'SimpleUtterance':
        response = await handleSimpleUtterance(request, session, version)
        break
      case 'ButtonPressed':
        response = await handleButtonPressed(request, session, version)
        break
      default:
        response.response.text = 'Неизвестная команда'
    }
    
    res.json(response)
    
  } catch (error) {
    console.error('❌ Ошибка обработки webhook:', error)
    res.status(500).json({
      version: req.body.version,
      session: req.body.session,
      response: {
        text: 'Произошла ошибка при выполнении команды',
        end_session: false
      }
    })
  }
})

// Обработка голосовых команд
async function handleSimpleUtterance(request, session, version) {
  const command = request.command.toLowerCase()
  
  // Включение кондиционера
  if (command.includes('включи кондиционер') || command.includes('запусти кондиционер')) {
    await sendHVACCommand('power', 'on')
    return {
      version,
      session,
      response: {
        text: 'Кондиционер включен',
        end_session: false
      }
    }
  }
  
  // Выключение кондиционера
  if (command.includes('выключи кондиционер') || command.includes('останови кондиционер')) {
    await sendHVACCommand('power', 'off')
    return {
      version,
      session,
      response: {
        text: 'Кондиционер выключен',
        end_session: false
      }
    }
  }
  
  // Установка температуры
  const tempMatch = command.match(/температура\s+(\d+)/)
  if (tempMatch) {
    const temperature = parseInt(tempMatch[1])
    if (temperature >= 16 && temperature <= 30) {
      await sendHVACCommand('temperature', temperature)
      return {
        version,
        session,
        response: {
          text: `Температура установлена на ${temperature} градусов`,
          end_session: false
        }
      }
    } else {
      return {
        version,
        session,
        response: {
          text: 'Температура должна быть от 16 до 30 градусов',
          end_session: false
        }
      }
    }
  }
  
  // Управление подсветкой
  if (command.includes('подсветка')) {
    const status = await getHVACStatus()
    const newLightState = status.lights === 'on' ? 'off' : 'on'
    await sendHVACCommand('lights', newLightState)
    
    return {
      version,
      session,
      response: {
        text: newLightState === 'on' ? 'Подсветка включена' : 'Подсветка выключена',
        end_session: false
      }
    }
  }
  
  // Получение статуса
  if (command.includes('статус') || command.includes('температура в комнате')) {
    const status = await getHVACStatus()
    const powerText = status.power === 'on' ? 'включен' : 'выключен'
    const tempText = status.currentTemperature ? `Текущая температура ${status.currentTemperature} градусов` : ''
    
    return {
      version,
      session,
      response: {
        text: `Кондиционер ${powerText}. ${tempText}`.trim(),
        end_session: false
      }
    }
  }
  
  // Неизвестная команда
  return {
    version,
    session,
    response: {
      text: 'Не понимаю команду. Попробуйте сказать "включи кондиционер" или "статус кондиционера"',
      end_session: false
    }
  }
}

// Обработка нажатий кнопок
async function handleButtonPressed(request, session, version) {
  const payload = request.payload
  
  switch (payload.action) {
    case 'turn_on':
      await sendHVACCommand('power', 'on')
      return {
        version,
        session,
        response: {
          text: 'Кондиционер включен',
          end_session: false
        }
      }
      
    case 'turn_off':
      await sendHVACCommand('power', 'off')
      return {
        version,
        session,
        response: {
          text: 'Кондиционер выключен',
          end_session: false
        }
      }
      
    default:
      return {
        version,
        session,
        response: {
          text: 'Неизвестное действие',
          end_session: false
        }
      }
  }
}

// Отправка команды на HVAC сервер
async function sendHVACCommand(property, value) {
  try {
    const response = await fetch(`${HVAC_SERVER_URL}/api/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ property, value })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    console.log(`✅ Команда отправлена: ${property} = ${value}`)
    return await response.json()
    
  } catch (error) {
    console.error(`❌ Ошибка отправки команды:`, error)
    throw error
  }
}

// Получение статуса HVAC
async function getHVACStatus() {
  try {
    const response = await fetch(`${HVAC_SERVER_URL}/api/status`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    return data.deviceStatus
    
  } catch (error) {
    console.error(`❌ Ошибка получения статуса:`, error)
    return {
      power: 'off',
      currentTemperature: null,
      lights: 'off'
    }
  }
}

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`🎤 Яндекс webhook сервер запущен на порту ${PORT}`)
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/yandex-webhook`)
})

export default app 