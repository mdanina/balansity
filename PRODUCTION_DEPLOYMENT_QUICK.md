# ⚡ Быстрый старт: Деплой в продакшн

## 🎯 Краткая инструкция

### 1. Фронтенд (React)

```bash
# На сервере
cd /var/www/balansity
npm install
npm run build

# Создайте .env.production
cat > .env.production << EOF
VITE_SUPABASE_URL=https://oyuyienekon.beget.app
VITE_SUPABASE_ANON_KEY=ваш-anon-key
VITE_API_URL=https://ваш-домен.com/api
EOF

# Настройте Nginx (см. полную инструкцию)
```

### 2. Queue Worker

```bash
cd /var/www/balansity/queue-worker
npm install
npm run build

# Создайте .env
cat > .env << EOF
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
EOF

# Запустите через PM2
npm run start:pm2
pm2 save
```

### 3. Nginx конфигурация

```nginx
server {
    listen 80;
    server_name ваш-домен.com;
    root /var/www/balansity/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Проверка

```bash
# Фронтенд
curl https://ваш-домен.com

# API
curl https://ваш-домен.com/api/health

# Queue Worker
pm2 status
pm2 logs balansity-queue-worker
```

**Полная инструкция:** см. `PRODUCTION_DEPLOYMENT.md`



