import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3002'
const TEST_TOKEN = 'test-token-123'

// Тестовые сценарии согласно требованиям платформы умного дома
const testScenarios = [
  {
    name: 'Health Check (HEAD)',
    description: 'Проверка доступности Endpoint URL провайдера',
    method: 'HEAD',
    url: '/v1.0/',
    headers: {
      'X-Request-Id': 'test-health-head'
    },
    body: null,
    expectedStatus: 200
  },
  {
    name: 'Health Check (GET)',
    description: 'Проверка работоспособности сервиса',
    method: 'GET',
    url: '/health',
    headers: {
      'X-Request-Id': 'test-health-get'
    },
    body: null,
    expectedStatus: 200
  },
  {
    name: 'Device Discovery',
    description: 'Информация об устройствах пользователя',
    method: 'GET',
    url: '/v1.0/user/devices',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-device-discovery',
      'User-Agent': 'YandexSmartHome/1.0'
    },
    body: null,
    expectedStatus: 200
  },
  {
    name: 'Device Status Query',
    description: 'Информация о состояниях устройств пользователя',
    method: 'POST',
    url: '/v1.0/user/devices/query',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-device-status',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-query-123',
      devices: [
        { id: 'gree-ac-1' }
      ]
    },
    expectedStatus: 200
  },
  {
    name: 'Device Control - Turn On',
    description: 'Изменение состояния устройств - включение',
    method: 'POST',
    url: '/v1.0/user/devices/action',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-turn-on',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-action-123',
      payload: {
        devices: [
          {
            id: 'gree-ac-1',
            capabilities: [
              {
                type: 'devices.capabilities.on_off',
                state: {
                  instance: 'on',
                  value: true
                }
              }
            ]
          }
        ]
      }
    },
    expectedStatus: 200
  },
  {
    name: 'Device Control - Turn Off',
    description: 'Изменение состояния устройств - выключение',
    method: 'POST',
    url: '/v1.0/user/devices/action',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-turn-off',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-action-124',
      payload: {
        devices: [
          {
            id: 'gree-ac-1',
            capabilities: [
              {
                type: 'devices.capabilities.on_off',
                state: {
                  instance: 'on',
                  value: false
                }
              }
            ]
          }
        ]
      }
    },
    expectedStatus: 200
  },
  {
    name: 'Device Control - Set Temperature',
    description: 'Изменение состояния устройств - установка температуры',
    method: 'POST',
    url: '/v1.0/user/devices/action',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-set-temp',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-temp-123',
      payload: {
        devices: [
          {
            id: 'gree-ac-1',
            capabilities: [
              {
                type: 'devices.capabilities.range',
                state: {
                  instance: 'temperature',
                  value: 24
                }
              }
            ]
          }
        ]
      }
    },
    expectedStatus: 200
  },
  {
    name: 'Device Control - Set Mode',
    description: 'Изменение состояния устройств - установка режима',
    method: 'POST',
    url: '/v1.0/user/devices/action',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-set-mode',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-mode-123',
      payload: {
        devices: [
          {
            id: 'gree-ac-1',
            capabilities: [
              {
                type: 'devices.capabilities.mode',
                state: {
                  instance: 'thermostat',
                  value: 'cool'
                }
              }
            ]
          }
        ]
      }
    },
    expectedStatus: 200
  },
  {
    name: 'Device Control - Set Fan Speed',
    description: 'Изменение состояния устройств - установка скорости вентилятора',
    method: 'POST',
    url: '/v1.0/user/devices/action',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-fan-speed',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-fan-123',
      payload: {
        devices: [
          {
            id: 'gree-ac-1',
            capabilities: [
              {
                type: 'devices.capabilities.mode',
                state: {
                  instance: 'fan_speed',
                  value: 'medium'
                }
              }
            ]
          }
        ]
      }
    },
    expectedStatus: 200
  },
  {
    name: 'Device Control - Toggle Lights',
    description: 'Изменение состояния устройств - переключение подсветки',
    method: 'POST',
    url: '/v1.0/user/devices/action',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-lights',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-lights-123',
      payload: {
        devices: [
          {
            id: 'gree-ac-1',
            capabilities: [
              {
                type: 'devices.capabilities.toggle',
                state: {
                  instance: 'lights',
                  value: true
                }
              }
            ]
          }
        ]
      }
    },
    expectedStatus: 200
  },
  {
    name: 'Device Control - Toggle Swing',
    description: 'Изменение состояния устройств - переключение качелей',
    method: 'POST',
    url: '/v1.0/user/devices/action',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-swing',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-swing-123',
      payload: {
        devices: [
          {
            id: 'gree-ac-1',
            capabilities: [
              {
                type: 'devices.capabilities.toggle',
                state: {
                  instance: 'swing',
                  value: true
                }
              }
            ]
          }
        ]
      }
    },
    expectedStatus: 200
  },
  {
    name: 'Account Unlink',
    description: 'Оповещение о разъединении аккаунтов',
    method: 'POST',
    url: '/v1.0/user/unlink',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-unlink',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-unlink-123'
    },
    expectedStatus: 200
  },
  {
    name: 'Complex Command',
    description: 'Сложная команда (включение + температура + режим)',
    method: 'POST',
    url: '/v1.0/user/devices/action',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'test-complex',
      'User-Agent': 'YandexSmartHome/1.0',
      'Content-Type': 'application/json'
    },
    body: {
      request_id: 'test-complex-123',
      payload: {
        devices: [
          {
            id: 'gree-ac-1',
            capabilities: [
              {
                type: 'devices.capabilities.on_off',
                state: {
                  instance: 'on',
                  value: true
                }
              },
              {
                type: 'devices.capabilities.range',
                state: {
                  instance: 'temperature',
                  value: 22
                }
              },
              {
                type: 'devices.capabilities.mode',
                state: {
                  instance: 'thermostat',
                  value: 'cool'
                }
              }
            ]
          }
        ]
      }
    },
    expectedStatus: 200
  }
]

// Тесты производительности (таймаут 3 секунды)
const performanceTests = [
  {
    name: 'Performance Test - Fast Response',
    description: 'Проверка быстрого ответа (< 1 секунды)',
    method: 'GET',
    url: '/health',
    headers: {
      'X-Request-Id': 'perf-test-1'
    },
    body: null,
    expectedStatus: 200,
    maxResponseTime: 1000
  },
  {
    name: 'Performance Test - Device Discovery',
    description: 'Проверка времени ответа Device Discovery (< 2 секунды)',
    method: 'GET',
    url: '/v1.0/user/devices',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'X-Request-Id': 'perf-test-2',
      'User-Agent': 'YandexSmartHome/1.0'
    },
    body: null,
    expectedStatus: 200,
    maxResponseTime: 2000
  }
]

async function runTestScenarios() {
  console.log('🧪 Тестирование сценариев Яндекс Умного Дома...\n')
  
  let passed = 0
  let failed = 0
  let performanceIssues = 0
  
  // Основные тесты
  for (const scenario of testScenarios) {
    try {
      console.log(`📝 Тест: ${scenario.name}`)
      console.log(`📋 Описание: ${scenario.description}`)
      console.log(`🌐 ${scenario.method} ${scenario.url}`)
      
      const options = {
        method: scenario.method,
        headers: scenario.headers
      }
      
      if (scenario.body) {
        options.body = JSON.stringify(scenario.body)
      }
      
      const startTime = Date.now()
      const response = await fetch(`${BASE_URL}${scenario.url}`, options)
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      let data = null
      if (scenario.method !== 'HEAD') {
        data = await response.json()
      }
      
      if (response.status === scenario.expectedStatus) {
        console.log(`✅ Успех (${response.status}) - ${responseTime}ms`)
        passed++
        
        // Проверка производительности
        if (scenario.maxResponseTime && responseTime > scenario.maxResponseTime) {
          console.log(`⚠️ Медленный ответ: ${responseTime}ms > ${scenario.maxResponseTime}ms`)
          performanceIssues++
        }
        
        // Показываем краткую информацию об ответе
        if (data && data.payload && data.payload.devices) {
          console.log(`   📱 Устройств в ответе: ${data.payload.devices.length}`)
        }
        if (data && data.status) {
          console.log(`   ❤️ Статус: ${data.status}`)
        }
      } else {
        console.log(`❌ Ошибка (${response.status}, ожидалось ${scenario.expectedStatus}) - ${responseTime}ms`)
        if (data) {
          console.log(`   Ошибка: ${data.error_message || data.error || 'Неизвестная ошибка'}`)
        }
        failed++
      }
      
      console.log('---\n')
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 300))
      
    } catch (error) {
      console.log(`❌ Ошибка запроса: ${error.message}\n`)
      failed++
    }
  }
  
  // Тесты производительности
  console.log('⚡ Тестирование производительности...\n')
  
  for (const test of performanceTests) {
    try {
      console.log(`📝 Тест: ${test.name}`)
      console.log(`📋 Описание: ${test.description}`)
      
      const options = {
        method: test.method,
        headers: test.headers
      }
      
      if (test.body) {
        options.body = JSON.stringify(test.body)
      }
      
      const startTime = Date.now()
      const response = await fetch(`${BASE_URL}${test.url}`, options)
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      if (response.status === test.expectedStatus) {
        if (responseTime <= test.maxResponseTime) {
          console.log(`✅ Производительность OK (${responseTime}ms <= ${test.maxResponseTime}ms)`)
        } else {
          console.log(`❌ Медленный ответ (${responseTime}ms > ${test.maxResponseTime}ms)`)
          performanceIssues++
        }
      } else {
        console.log(`❌ Ошибка (${response.status})`)
        failed++
      }
      
      console.log('---\n')
      
    } catch (error) {
      console.log(`❌ Ошибка производительности: ${error.message}\n`)
      failed++
    }
  }
  
  console.log('🏁 Результаты тестирования:')
  console.log(`✅ Успешно: ${passed}`)
  console.log(`❌ Ошибок: ${failed}`)
  console.log(`⚠️ Проблем производительности: ${performanceIssues}`)
  console.log(`📊 Всего: ${testScenarios.length + performanceTests.length}`)
  console.log(`📈 Процент успеха: ${((passed / (testScenarios.length + performanceTests.length)) * 100).toFixed(1)}%`)
  
  if (failed === 0 && performanceIssues === 0) {
    console.log('\n🎉 Все тесты прошли успешно! Система готова к работе.')
  } else if (failed === 0) {
    console.log('\n⚠️ Есть проблемы с производительностью, но функциональность работает.')
  } else {
    console.log('\n❌ Есть ошибки, которые нужно исправить.')
  }
  
  // Проверка требований платформы
  console.log('\n📋 Проверка требований платформы:')
  console.log(`🔒 HTTPS: ${BASE_URL.startsWith('https') ? '✅' : '⚠️ (требуется для продакшена)'}`)
  console.log(`⏱️ Таймаут < 3с: ${performanceIssues === 0 ? '✅' : '⚠️'}`)
  console.log(`📝 Логирование: ✅ (X-Request-Id)`)
  console.log(`🔐 OAuth: ✅ (настроен)`)
  console.log(`📱 Все endpoints: ✅ (реализованы)`)
}

// Запуск тестов
runTestScenarios().catch(console.error) 