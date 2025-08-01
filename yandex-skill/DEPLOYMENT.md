# 🚀 Развертывание навыка "Кондиционер Gree"

## 📋 Пошаговая инструкция

### 1. Подготовка сервера

#### Требования:
- VPS или облачный сервер
- Node.js 16+
- Домен с SSL сертификатом
- Порт 443 (HTTPS) открыт

#### Рекомендуемые провайдеры:
- **VPS:** DigitalOcean, Linode, Vultr
- **Облако:** AWS, Google Cloud, Yandex Cloud
- **Хостинг:** Heroku, Railway, Render

### 2. Настройка сервера

#### Установка Node.js:
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### Установка PM2 (менеджер процессов):
```bash
npm install -g pm2
```

### 3. Развертывание webhook

#### Клонирование проекта:
```bash
git clone <your-repo>
cd yandex-skill
npm install
```

#### Настройка переменных окружения:
```bash
# Создайте файл .env
cat > .env << EOF
HVAC_SERVER_URL=http://localhost:3001
YANDEX_SKILL_ID=your-skill-id
NODE_ENV=production
PORT=3002
EOF
```

#### Запуск с PM2:
```bash
pm2 start webhook.js --name "gree-yandex-webhook"
pm2 save
pm2 startup
```

### 4. Настройка Nginx (обратный прокси)

#### Установка Nginx:
```bash
sudo apt-get install nginx
```

#### Конфигурация сайта:
```bash
sudo nano /etc/nginx/sites-available/gree-webhook
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

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

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
    }
}
```

#### Активация конфигурации:
```bash
sudo ln -s /etc/nginx/sites-available/gree-webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL сертификат (Let's Encrypt)

#### Установка Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx
```

#### Получение сертификата:
```bash
sudo certbot --nginx -d your-domain.com
```

#### Автообновление:
```bash
sudo crontab -e
# Добавьте строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Настройка навыка в Яндекс Developer Console

#### Создание навыка:
1. Перейдите на [developer.tech.yandex.ru](https://developer.tech.yandex.ru/)
2. Создайте новый навык
3. Выберите категорию "Умный дом"

#### Настройка webhook:
- **URL:** `https://your-domain.com/yandex-webhook`
- **Timeout:** 5000ms
- **SSL:** Обязательно

#### Добавление интентов:
Скопируйте интенты из файла `skill.json`

### 7. Тестирование

#### Локальное тестирование:
```bash
npm test
```

#### Тестирование webhook:
```bash
curl -X POST https://your-domain.com/yandex-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "command": "включи кондиционер",
      "type": "SimpleUtterance"
    },
    "session": {
      "session_id": "test"
    },
    "version": "1.0"
  }'
```

### 8. Мониторинг

#### Логи PM2:
```bash
pm2 logs gree-yandex-webhook
```

#### Логи Nginx:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Мониторинг статуса:
```bash
pm2 status
pm2 monit
```

## 🔧 Автоматизация развертывания

### Docker Compose (опционально):

```yaml
# docker-compose.yml
version: '3.8'
services:
  webhook:
    build: .
    ports:
      - "3002:3002"
    environment:
      - HVAC_SERVER_URL=http://hvac-server:3001
      - NODE_ENV=production
    restart: unless-stopped
```

### GitHub Actions (CI/CD):

```yaml
# .github/workflows/deploy.yml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /path/to/yandex-skill
            git pull
            npm install
            pm2 restart gree-yandex-webhook
```

## 🚨 Безопасность

### Firewall:
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Обновления:
```bash
# Автоматические обновления безопасности
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Мониторинг безопасности:
```bash
# Установка fail2ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📞 Поддержка

### Полезные команды:
```bash
# Перезапуск webhook
pm2 restart gree-yandex-webhook

# Просмотр логов
pm2 logs gree-yandex-webhook --lines 100

# Статус сервисов
pm2 status
sudo systemctl status nginx

# Проверка SSL
curl -I https://your-domain.com/yandex-webhook
```

### Контакты для поддержки:
- Логи: `pm2 logs gree-yandex-webhook`
- Статус: `pm2 status`
- Nginx: `sudo systemctl status nginx` 