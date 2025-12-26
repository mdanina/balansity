# ⚡ Быстрая шпаргалка по деплою

## 🎯 Основные команды

### Подключение к серверу
```bash
ssh user@ваш-сервер.com
```

### Первоначальная настройка
```bash
# Клонирование репозитория
cd /var/www
git clone <URL_РЕПОЗИТОРИЯ> balansity
cd balansity
```

### Фронтенд - деплой
```bash
cd /var/www/balansity

# Создать .env.production
nano .env.production
# (заполнить значениями)

# Установить зависимости и собрать
npm install
npm run build
```

### Queue Worker - деплой
```bash
cd /var/www/balansity/queue-worker

# Создать .env
nano .env
# (заполнить значениями)

# Установить зависимости и собрать
npm install
npm run build

# Запустить через PM2
mkdir -p logs
npm run start:pm2
pm2 save
pm2 startup
```

### Nginx - настройка
```bash
# Создать конфигурацию
sudo nano /etc/nginx/sites-available/balansity
# (скопировать конфигурацию из nginx.conf.example)

# Активировать
sudo ln -s /etc/nginx/sites-available/balansity /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL - настройка
```bash
# Установить Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d ваш-домен.com -d www.ваш-домен.com
```

## 🔍 Проверка

```bash
# Фронтенд
curl https://ваш-домен.com

# API
curl https://ваш-домен.com/api/health

# Queue Worker
pm2 status
pm2 logs balansity-queue-worker
```

## 🔄 Обновление

### Фронтенд
```bash
cd /var/www/balansity
git pull origin main
npm install
npm run build
```

### Queue Worker
```bash
cd /var/www/balansity/queue-worker
git pull origin main
npm install
npm run build
npm run restart:pm2
```

## 📋 Переменные окружения

### .env.production (фронтенд)
```env
VITE_SUPABASE_URL=https://oyuyienekon.beget.app
VITE_SUPABASE_ANON_KEY=ваш-anon-key
VITE_API_URL=https://ваш-домен.com/api
```

### .env (queue-worker)
```env
SUPABASE_URL=https://oyuyienekon.beget.app
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
API_PORT=3001
API_BASE_URL=https://ваш-домен.com
FRONTEND_URL=https://ваш-домен.com
YUKASSA_SHOP_ID=ваш-shop-id
YUKASSA_SECRET_KEY=ваш-секретный-ключ
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.nic.ru
SMTP_PORT=587
SMTP_USER=noreply@balansity.ru
SMTP_PASS=ваш-пароль
SMTP_FROM=noreply@balansity.ru
SMTP_FROM_NAME=Little Otter
```

## 🚨 Быстрое решение проблем

```bash
# Nginx не работает
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# Queue Worker не работает
pm2 status
pm2 logs balansity-queue-worker
pm2 restart balansity-queue-worker

# Проверить порты
netstat -tulpn | grep 3001

# Логи Nginx
sudo tail -f /var/log/nginx/balansity-error.log
```

## 📚 Полная документация

См. `DEPLOY_GUIDE_RU.md` для подробной инструкции.




