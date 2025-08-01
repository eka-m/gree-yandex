import Gree from 'gree-hvac-client'
import dgram from 'dgram'

console.log('🔍 Поиск кондиционеров Gree в сети...')
console.log('Это может занять несколько минут...\n')

const socket = dgram.createSocket('udp4')
const foundDevices = new Set()

socket.on('error', (err) => {
  console.error('❌ Ошибка UDP сокета:', err.message)
  socket.close()
})

socket.on('message', (msg, rinfo) => {
  try {
    // Пытаемся найти MAC адрес в сообщении
    const message = msg.toString()
    if (message.includes('mac') || message.includes('device')) {
      console.log(`✅ Найден кондиционер: ${rinfo.address}:${rinfo.port}`)
      foundDevices.add(rinfo.address)
    }
  } catch (error) {
    // Игнорируем ошибки парсинга
  }
})

// Сканируем диапазон IP адресов
function scanNetwork() {
  const baseIP = '192.168.31.'
  
  for (let i = 1; i <= 254; i++) {
    const ip = baseIP + i
    
    // Отправляем broadcast сообщение
    const message = Buffer.from('{"t": "scan"}')
    socket.send(message, 7000, ip, (err) => {
      if (err) {
        console.error(`❌ Ошибка отправки на ${ip}:`, err.message)
      }
    })
  }
}

// Запускаем сканирование
socket.bind(() => {
  console.log('🚀 Начинаем сканирование сети...')
  scanNetwork()
  
  // Останавливаем сканирование через 30 секунд
  setTimeout(() => {
    console.log('\n📊 Результаты сканирования:')
    if (foundDevices.size === 0) {
      console.log('❌ Кондиционеры не найдены')
      console.log('\n💡 Возможные причины:')
      console.log('   - Кондиционер не подключен к WiFi')
      console.log('   - Кондиционер находится в другой подсети')
      console.log('   - Файрвол блокирует UDP трафик')
      console.log('   - Кондиционер не поддерживает протокол Gree')
    } else {
      console.log('✅ Найденные кондиционеры:')
      foundDevices.forEach(ip => {
        console.log(`   - ${ip}:7000`)
      })
      console.log('\n💡 Для использования обновите IP адрес в server.js')
    }
    
    socket.close()
    process.exit(0)
  }, 30000)
})

// Обработка Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Сканирование остановлено пользователем')
  socket.close()
  process.exit(0)
}) 