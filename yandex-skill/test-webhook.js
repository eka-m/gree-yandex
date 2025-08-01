import fetch from 'node-fetch'

const WEBHOOK_URL = 'http://localhost:3002/yandex-webhook'

// Тестовые команды
const testCommands = [
  {
    name: 'Включение кондиционера',
    request: {
      request: {
        command: 'включи кондиционер',
        type: 'SimpleUtterance'
      },
      session: {
        session_id: 'test-session-1'
      },
      version: '1.0'
    }
  },
  {
    name: 'Выключение кондиционера',
    request: {
      request: {
        command: 'выключи кондиционер',
        type: 'SimpleUtterance'
      },
      session: {
        session_id: 'test-session-2'
      },
      version: '1.0'
    }
  },
  {
    name: 'Установка температуры',
    request: {
      request: {
        command: 'установи температуру 24',
        type: 'SimpleUtterance'
      },
      session: {
        session_id: 'test-session-3'
      },
      version: '1.0'
    }
  },
  {
    name: 'Управление подсветкой',
    request: {
      request: {
        command: 'включи подсветку',
        type: 'SimpleUtterance'
      },
      session: {
        session_id: 'test-session-4'
      },
      version: '1.0'
    }
  },
  {
    name: 'Получение статуса',
    request: {
      request: {
        command: 'статус кондиционера',
        type: 'SimpleUtterance'
      },
      session: {
        session_id: 'test-session-5'
      },
      version: '1.0'
    }
  }
]

async function testWebhook() {
  console.log('🧪 Тестирование webhook...\n')
  
  for (const test of testCommands) {
    try {
      console.log(`📝 Тест: ${test.name}`)
      console.log(`🎤 Команда: "${test.request.request.command}"`)
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.request)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ Ответ: "${data.response.text}"`)
      } else {
        console.log(`❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`)
      }
      
      console.log('---\n')
      
      // Небольшая пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.log(`❌ Ошибка запроса: ${error.message}\n`)
    }
  }
  
  console.log('🏁 Тестирование завершено')
}

// Запуск тестов
testWebhook().catch(console.error) 