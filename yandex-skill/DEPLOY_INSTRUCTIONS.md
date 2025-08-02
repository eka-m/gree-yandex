# 🚀 Инструкции по деплою

## ✅ Исправления внесены

### 1. Исправлены endpoints согласно документации Яндекс:
- ✅ `/v1.0/user/devices` - изменен с GET на POST
- ✅ `/v1.0/user/devices/unlink` - исправлен путь
- ✅ Все endpoints теперь соответствуют официальной документации

### 2. Обновлены OAuth настройки:
- ✅ Client ID: `1c2c42c5c0d34e25b4ed2b9e8393fa7f`
- ✅ Client Secret: `3a558ad9c9084bd99cca4114b3ee64e5`
- ✅ Redirect URI: `https://gree.thequark.dev/oauth/callback`

## 📋 Настройки для Яндекс Developer Console

### OAuth настройки (раздел "Связка аккаунтов"):
- **Идентификатор приложения:** `1c2c42c5c0d34e25b4ed2b9e8393fa7f`
- **Секрет приложения:** `3a558ad9c9084bd99cca4114b3ee64e5`
- **URL авторизации:** `https://gree.thequark.dev/oauth/authorize`
- **URL для получения токена:** `https://gree.thequark.dev/oauth/token`
- **URL для обновления токена:** `https://gree.thequark.dev/oauth/token`
- **Идентификатор группы действий:** `home:read home:write`

### Backend настройки:
- **Endpoint URL:** `https://gree.thequark.dev/v1.0`

## 🔧 Команды для деплоя

```bash
# 1. Подключиться к серверу
ssh root@46.202.155.247

# 2. Перейти в папку проекта
cd /gopanel/sites/gree/yandex-skill

# 3. Остановить текущий процесс
pm2 stop gree-smart-home
pm2 delete gree-smart-home

# 4. Создать .env файл
cat > .env << 'EOF'
NODE_ENV=production
PORT=3002
HVAC_SERVER_URL=http://localhost:3001
YANDEX_SKILL_ID=1c2c42c5c0d34e25b4ed2b9e8393fa7f
YANDEX_CLIENT_ID=1c2c42c5c0d34e25b4ed2b9e8393fa7f
YANDEX_CLIENT_SECRET=3a558ad9c9084bd99cca4114b3ee64e5
REDIRECT_URI=https://gree.thequark.dev/oauth/callback
EOF

# 5. Запустить сервер
pm2 start main.js --name "gree-smart-home" --watch

# 6. Сохранить конфигурацию
pm2 save

# 7. Проверить статус
pm2 status
```

## 🧪 Тестирование

После деплоя протестируйте endpoints:

```bash
# Health check
curl https://gree.thequark.dev/

# OAuth authorize
curl -I "https://gree.thequark.dev/oauth/authorize?state=test"

# Smart Home API (POST запрос)
curl -X POST https://gree.thequark.dev/v1.0/user/devices \
  -H "Authorization: Bearer test-token" \
  -H "X-Request-Id: test-123" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🎯 Ожидаемый результат

После деплоя:
- ✅ Все endpoints должны отвечать корректно
- ✅ OAuth авторизация должна работать
- ✅ Ошибка "неизвестное приложение" должна исчезнуть
- ✅ Привязка аккаунта в приложении "Дом с Алисой" должна работать 