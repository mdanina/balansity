# 🚀 Настройка Queue Worker

## ✅ Что создано

Создана полная структура worker'а для обработки очередей Supabase:

```
queue-worker/
  ├── src/
  │   ├── index.ts              # Главный файл
  │   ├── processors/           # Обработчики очередей
  │   │   ├── email.ts
  │   │   ├── reports.ts
  │   │   └── payments.ts
  │   ├── services/             # Сервисы
  │   │   ├── email.ts         # Отправка email через SMTP от nic.ru
  │   │   └── supabase.ts      # Подключение к Supabase
  │   └── utils/
  │       └── logger.ts        # Логирование
  ├── .env                      # Настройки (нужно заполнить)
  ├── .env.example             # Пример настроек
  ├── package.json
  ├── tsconfig.json
  ├── Dockerfile
  ├── docker-compose.yml
  ├── ecosystem.config.js      # PM2 конфиг
  └── README.md
```

## 🔧 Шаг 1: Настройка .env

Откройте файл `queue-worker/.env` и заполните:

1. **SUPABASE_SERVICE_ROLE_KEY** - получите из Supabase Dashboard:
   - Settings → API → Service Role Key (секретный ключ!)

2. Остальные настройки уже заполнены из `SMTP_SETUP_BALANSITY.md`:
   - SMTP_HOST=mail.nic.ru ✅
   - SMTP_PORT=587 ✅
   - SMTP_USER=noreply@balansity.ru ✅
   - SMTP_PASS=ILoveBalansity100! ✅

## 📦 Шаг 2: Установка зависимостей

```bash
cd queue-worker
npm install
```

## 🧪 Шаг 3: Тестирование (разработка)

```bash
npm run dev
```

Worker запустится и начнет обрабатывать очереди. Вы увидите логи в консоли.

## 🚀 Шаг 4: Запуск в продакшене

### Вариант A: PM2 (рекомендуется)

```bash
# Сборка
npm run build

# Запуск
npm run start:pm2

# Сохранение для автозапуска
pm2 save
pm2 startup  # Следуйте инструкциям
```

### Вариант B: Docker

```bash
docker-compose up -d
```

### Вариант C: systemd (Linux)

Создайте файл `/etc/systemd/system/balansity-worker.service`:

```ini
[Unit]
Description=Balansity Queue Worker
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/queue-worker
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Затем:
```bash
sudo systemctl enable balansity-worker
sudo systemctl start balansity-worker
```

## ✅ Проверка работы

### 1. Проверка логов

```bash
# PM2
pm2 logs balansity-queue-worker

# Docker
docker-compose logs -f queue-worker

# Или файлы
tail -f queue-worker/logs/out.log
```

### 2. Тест обработки email

1. Завершите тестовый чекап в приложении
2. Проверьте очередь в Supabase:
   ```sql
   SELECT * FROM pgmq.email_queue ORDER BY enqueued_at DESC LIMIT 5;
   ```
3. Подождите несколько секунд
4. Проверьте, что задача обработана (исчезла из очереди)
5. Проверьте почту - должно прийти письмо

## 📊 Мониторинг

### Проверка статистики очередей

```sql
-- Email очередь
SELECT 
  queue_length,
  newest_msg_age_sec,
  oldest_msg_age_sec,
  total_messages
FROM pgmq_metrics('email_queue');
```

### Проверка работы worker

```bash
# PM2
pm2 status
pm2 monit

# Docker
docker-compose ps
docker stats balansity-queue-worker
```

## 🔧 Troubleshooting

### Worker не запускается

1. Проверьте `.env` файл - все переменные заполнены?
2. Проверьте `SUPABASE_SERVICE_ROLE_KEY` - правильный ключ?
3. Проверьте логи: `tail -f logs/error.log`

### Email не отправляются

1. Проверьте SMTP настройки в `.env`
2. Проверьте логи на ошибки SMTP
3. Убедитесь, что почтовый ящик `noreply@balansity.ru` существует
4. Проверьте, что порт 587 не заблокирован

### Задачи не обрабатываются

1. Проверьте подключение к Supabase:
   ```sql
   SELECT * FROM pgmq.list_queues();
   ```
2. Проверьте, что очереди созданы (миграция 031)
3. Проверьте логи worker'а

## 📝 Что дальше

1. ✅ Worker создан и настроен
2. ⏳ Заполните `SUPABASE_SERVICE_ROLE_KEY` в `.env`
3. ⏳ Установите зависимости: `npm install`
4. ⏳ Протестируйте: `npm run dev`
5. ⏳ Запустите в продакшене: `npm run build && npm run start:pm2`

## 🔐 Безопасность

⚠️ **Важно:**
- Не коммитьте `.env` в Git (уже в `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY` - секретный ключ, храните в безопасности
- Пароль SMTP тоже секретный

## 📚 Дополнительно

- См. `queue-worker/README.md` для подробной документации
- См. `SMTP_SETUP_BALANSITY.md` для информации о SMTP настройках



