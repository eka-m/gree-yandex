# 🏠 Полная настройка навыка "Кондиционер Gree" для Яндекс Умного Дома

## 📋 Содержание

1. [Подготовка сервера](#подготовка-сервера)
2. [Развертывание приложения](#развертывание-приложения)
3. [Настройка OAuth в Яндекс Developer Console](#настройка-oauth)
4. [Создание навыка Умного Дома](#создание-навыка)
5. [Тестирование](#тестирование)
6. [Публикация](#публикация)

## 🖥️ Подготовка сервера

### Требования:
- VPS с Ubuntu 20.04+
- Node.js 16+
- Домен с SSL сертификатом
- Минимум 512MB RAM, 1GB диска

### Установка зависимостей:

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Установка Nginx
sudo apt install nginx -y

# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y
```

## 🚀 Развертывание приложения

### 1. Клонирование и настройка:

```bash
# Создание директории
mkdir -p /opt/gree-smart-home
cd /opt/gree-smart-home

# Копирование файлов проекта
# (скопируйте все файлы из папки yandex-skill)

# Установка зависимостей
npm install

# Создание переменных окружения
cat > .env << EOF
NODE_ENV=production
PORT=3002
HVAC_SERVER_URL=http://localhost:3001
YANDEX_CLIENT_ID=your-client-id
YANDEX_CLIENT_SECRET=your-client-secret
REDIRECT_URI=https://your-domain.com/oauth/callback
EOF
```

### 2. Настройка Nginx:

```bash
sudo nano /etc/nginx/sites-available/gree-smart-home
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Логирование
    access_log /var/log/nginx/gree-smart-home.access.log;
    error_log /var/log/nginx/gree-smart-home.error.log;

    # Проксирование запросов
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 3. Активация конфигурации:

```bash
sudo ln -s /etc/nginx/sites-available/gree-smart-home /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Получение SSL сертификата:

```bash
sudo certbot --nginx -d your-domain.com
```

### 5. Запуск приложения:

```bash
# Запуск с PM2
pm2 start main.js --name "gree-smart-home"
pm2 save
pm2 startup

# Проверка статуса
pm2 status
pm2 logs gree-smart-home
```

## 🔐 Настройка OAuth в Яндекс Developer Console

### 1. Создание приложения:

1. Перейдите на [Yandex Developer Console](https://developer.tech.yandex.ru/)
2. Нажмите "Создать приложение"
3. Выберите тип: "Веб-сервисы"
4. Заполните информацию:
   - **Название:** Gree HVAC Smart Home
   - **Описание:** Сервис для управления кондиционерами Gree
   - **Платформы:** Веб-сервисы

### 2. Настройка OAuth:

1. В настройках приложения найдите "OAuth"
2. Добавьте redirect URI: `https://your-domain.com/oauth/callback`
3. Скопируйте Client ID и Client Secret
4. Обновите файл `.env`:

```bash
YANDEX_CLIENT_ID=ваш-client-id
YANDEX_CLIENT_SECRET=ваш-client-secret
```

### 3. Перезапуск приложения:

```bash
pm2 restart gree-smart-home
```

## 🏠 Создание навыка Умного Дома

### 1. Создание навыка:

1. В Developer Console нажмите "Создать навык"
2. Выберите тип: **"Умный дом"**
3. Заполните информацию:
   - **Название:** Кондиционер Gree
   - **Описание:** Управление кондиционерами Gree через голосовые команды
   - **Категория:** Умный дом

### 2. Настройка API:

1. В разделе "Настройки" найдите "API"
2. Укажите URL: `https://your-domain.com/v1.0`
3. Установите timeout: 5000ms

### 3. Добавление устройств:

1. Перейдите в раздел "Устройства"
2. Нажмите "Добавить устройство"
3. Выберите тип: **"Кондиционер"**
4. Заполните информацию из файла `skill-config.json`

### 4. Настройка OAuth для навыка:

1. В настройках навыка найдите "OAuth"
2. Укажите:
   - **Client ID:** ваш-client-id
   - **Client Secret:** ваш-client-secret
   - **Redirect URI:** `https://your-domain.com/oauth/callback`

## 🧪 Тестирование

### 1. Локальное тестирование:

```bash
# Тестирование API
npm run test

# Проверка health check
curl https://your-domain.com/health

# Тестирование OAuth
curl https://your-domain.com/oauth/authorize
```

### 2. Тестирование в приложении:

1. Откройте приложение "Яндекс Умный дом"
2. Добавьте устройство "Кондиционер Gree"
3. Попробуйте управлять через приложение

### 3. Тестирование голосовых команд:

- "Алиса, включи кондиционер"
- "Алиса, установи температуру 24 градуса"
- "Алиса, включи подсветку"

## 📱 Публикация

### 1. Подготовка к публикации:

1. Убедитесь, что все тесты проходят
2. Проверьте логи на ошибки
3. Убедитесь, что SSL сертификат действителен

### 2. Отправка на модерацию:

1. В Developer Console нажмите "Отправить на модерацию"
2. Заполните дополнительную информацию:
   - Скриншоты интерфейса
   - Инструкции по использованию
   - Описание функций

### 3. Ожидание проверки:

- Модерация занимает 1-3 дня
- После одобрения навык появится в каталоге

## 🔍 Мониторинг и поддержка

### Логи:

```bash
# Просмотр логов приложения
pm2 logs gree-smart-home

# Просмотр логов Nginx
sudo tail -f /var/log/nginx/gree-smart-home.access.log
sudo tail -f /var/log/nginx/gree-smart-home.error.log

# Мониторинг в реальном времени
pm2 monit
```

### Обновления:

```bash
# Обновление приложения
cd /opt/gree-smart-home
git pull
npm install
pm2 restart gree-smart-home

# Обновление SSL сертификата
sudo certbot renew
```

### Резервное копирование:

```bash
# Создание бэкапа
tar -czf gree-smart-home-backup-$(date +%Y%m%d).tar.gz /opt/gree-smart-home

# Восстановление
tar -xzf gree-smart-home-backup-YYYYMMDD.tar.gz -C /
```

## 🚨 Устранение неполадок

### Частые проблемы:

1. **SSL ошибки:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

2. **Приложение не запускается:**
   ```bash
   pm2 logs gree-smart-home
   node main.js
   ```

3. **OAuth не работает:**
   - Проверьте Client ID и Secret
   - Убедитесь, что redirect URI правильный

4. **API не отвечает:**
   - Проверьте, что HVAC сервер работает
   - Проверьте логи приложения

### Контакты для поддержки:

- Логи приложения: `pm2 logs gree-smart-home`
- Логи Nginx: `/var/log/nginx/gree-smart-home.error.log`
- Статус сервисов: `pm2 status && sudo systemctl status nginx`

## 🎉 Готово!

После выполнения всех шагов у вас будет:

✅ Полнофункциональный навык для Яндекс Умного Дома  
✅ OAuth 2.0 авторизация  
✅ API для управления кондиционером  
✅ Логирование всех запросов  
✅ SSL защита  
✅ Мониторинг и поддержка  

**Теперь можно управлять кондиционером Gree через голосовые команды и приложение Яндекс Умный Дом!** 🎉 