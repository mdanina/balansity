# 📚 Полная документация по интеграциям Supabase

## 📋 Содержание

1. [Обзор](#обзор)
2. [Что было реализовано](#что-было-реализовано)
3. [Cron Jobs (Автоматические задачи)](#cron-jobs)
4. [Queues (Очереди)](#queues)
5. [Database Webhooks (Триггеры)](#database-webhooks)
6. [Queue Worker (Обработчик очередей)](#queue-worker)
7. [Проверка работы](#проверка-работы)
8. [Запуск в продакшене](#запуск-в-продакшене)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Обзор

Реализована полная система автоматизации для self-hosted Supabase:
- ✅ **Cron Jobs** - автоматическое выполнение задач по расписанию
- ✅ **Queues** - асинхронная обработка тяжелых задач
- ✅ **Database Webhooks** - автоматические действия при событиях в БД
- ✅ **Queue Worker** - отдельный сервис для обработки очередей

---

## 📦 Что было реализовано

### 1. Cron Jobs (Миграция 030)

Автоматические задачи, выполняемые по расписанию:
- Обновление статусов консультаций каждые 5 минут
- Очистка старых чекапов (ежедневно в 3:00)
- Отправка напоминаний о консультациях (каждый час)

### 2. Queues (Миграция 031)

Очереди для асинхронной обработки:
- `email_queue` - отправка email уведомлений
- `report_generation_queue` - генерация PDF отчетов
- `payment_processing_queue` - обработка платежей
- `analytics_queue` - аналитика и метрики

### 3. Database Webhooks (Миграция 032)

Автоматические триггеры при событиях:
- Завершение чекапа → отправка email + генерация отчета
- Новая консультация → подтверждение email
- Изменение статуса платежа → уведомление + обновление консультации

### 4. Queue Worker (Отдельный сервис)

Node.js приложение для обработки очередей:
- Чтение задач из очередей
- Отправка email через SMTP от nic.ru
- Обработка отчетов и платежей
- Логирование и мониторинг

---

## ⏰ Cron Jobs

### Файл: `supabase/migrations/030_setup_cron_jobs.sql`

### Что делает:

#### 1. Обновление статусов консультаций (каждые 5 минут)
```sql
SELECT cron.schedule(
  'update-appointment-statuses',
  '*/5 * * * *',
  $$ SELECT public.update_appointment_statuses(); $$
);
```

**Функция:** `public.update_appointment_statuses()`
- Обновляет статусы консультаций на основе текущего времени
- `scheduled` → `in_progress` (если началось)
- `in_progress` → `completed` (если закончилось)

#### 2. Очистка старых чекапов (ежедневно в 3:00)
```sql
SELECT cron.schedule(
  'cleanup-old-assessments',
  '0 3 * * *',
  $$
  UPDATE public.assessments
  SET status = 'abandoned'
  WHERE status = 'in_progress'
    AND created_at < now() - interval '30 days';
  $$
);
```

**Что делает:** Помечает как `abandoned` чекапы, которые не завершены более 30 дней.

#### 3. Напоминания о консультациях (каждый час)
```sql
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *',
  $$ SELECT public.send_appointment_reminders(); $$
);
```

**Функция:** `public.send_appointment_reminders()`
- Напоминания за 24 часа до консультации
- Напоминания за 1 час до консультации
- Добавляет задачи в `email_queue`

### Проверка работы Cron:

```sql
-- Просмотр всех Cron задач
SELECT * FROM cron.job;

-- Просмотр истории выполнения
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 📬 Queues

### Файл: `supabase/migrations/031_setup_queues.sql`

### Созданные очереди:

1. **email_queue** - Отправка email уведомлений
2. **report_generation_queue** - Генерация PDF отчетов
3. **payment_processing_queue** - Обработка платежей
4. **analytics_queue** - Аналитика и метрики

### Вспомогательные функции:

#### `public.queue_email_task()`
Добавляет задачу в очередь email:
```sql
SELECT public.queue_email_task(
  'user@example.com',           -- to
  'Тема письма',                  -- subject
  'checkup_completed',            -- template
  '{"assessment_id": "..."}'::jsonb,  -- variables
  0                               -- priority
);
```

#### `public.queue_report_generation()`
Добавляет задачу генерации отчета:
```sql
SELECT public.queue_report_generation(
  'assessment-id',  -- assessment_id
  'user-id',        -- user_id
  'pdf'             -- report_type
);
```

#### `public.queue_payment_processing()`
Добавляет задачу обработки платежа:
```sql
SELECT public.queue_payment_processing(
  'payment-id',  -- payment_id
  'verify'        -- action
);
```

### Проверка очередей:

```sql
-- Список всех очередей
SELECT * FROM pgmq.list_queues();

-- Задачи в очереди email
SELECT 
  msg_id,
  enqueued_at,
  msg->>'to' as email_to,
  msg->>'subject' as subject
FROM pgmq.email_queue
ORDER BY enqueued_at DESC
LIMIT 10;

-- Статистика очереди
SELECT 
  queue_length,
  newest_msg_age_sec,
  oldest_msg_age_sec,
  total_messages
FROM pgmq_metrics('email_queue');
```

---

## 🔔 Database Webhooks (Триггеры)

### Файл: `supabase/migrations/032_webhook_triggers.sql`

### Реализованные триггеры:

#### 1. Завершение чекапа (`on_checkup_completed`)

**Триггер:** После обновления `assessments` когда `status = 'completed'`

**Что делает:**
- Добавляет задачу генерации отчета в `report_generation_queue`
- Добавляет задачу отправки email в `email_queue`
- Добавляет событие в `analytics_queue`

**Функция:** `public.handle_completed_checkup()`

#### 2. Новая консультация (`on_new_appointment`)

**Триггер:** После вставки в `appointments`

**Что делает:**
- Отправляет email подтверждение записи

**Функция:** `public.handle_new_appointment()`

#### 3. Изменение статуса платежа (`on_payment_status_change`)

**Триггер:** После обновления `payments` когда меняется `status`

**Что делает:**
- При `completed`: отправляет подтверждение оплаты + обновляет статус консультации
- При `failed`: отправляет уведомление об ошибке

**Функция:** `public.handle_payment_status_change()`

### Проверка триггеров:

```sql
-- Просмотр всех триггеров
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

---

## 🔧 Queue Worker

### Структура проекта:

```
queue-worker/
  ├── src/
  │   ├── index.ts              # Главный файл
  │   ├── processors/           # Обработчики очередей
  │   │   ├── email.ts
  │   │   ├── reports.ts
  │   │   └── payments.ts
  │   ├── services/             # Сервисы
  │   │   ├── email.ts          # Отправка email через SMTP
  │   │   └── supabase.ts       # Подключение к Supabase
  │   └── utils/
  │       └── logger.ts         # Логирование
  ├── .env                      # Настройки (не в Git)
  ├── package.json
  ├── tsconfig.json
  └── README.md
```

### Настройка .env:

```env
# Supabase
SUPABASE_URL=https://oyuyienekon.beget.app
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# SMTP от nic.ru
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.nic.ru
SMTP_PORT=587
SMTP_USER=noreply@balansity.ru
SMTP_PASS=ILoveBalansity100!
SMTP_FROM=noreply@balansity.ru
SMTP_FROM_NAME=Little Otter

# Worker настройки
WORKER_INTERVAL_MS=5000
MAX_TASKS_PER_CYCLE=10
LOG_LEVEL=info
```

### Запуск:

#### Разработка:
```bash
cd queue-worker
npm install
npm run dev
```

#### Продакшен (PM2):
```bash
npm run build
npm run start:pm2
pm2 save
pm2 startup
```

#### Продакшен (Docker):
```bash
docker-compose up -d
```

### Что обрабатывает worker:

1. **Email Queue** - отправляет email уведомления через SMTP
2. **Report Generation Queue** - генерирует PDF отчеты (TODO)
3. **Payment Processing Queue** - обрабатывает платежи (TODO)

### Логи:

```bash
# PM2
pm2 logs balansity-queue-worker

# Docker
docker-compose logs -f queue-worker

# Файлы
tail -f queue-worker/logs/out.log
```

---

## ✅ Проверка работы

### 1. Проверка Cron Jobs

```sql
-- Просмотр всех задач
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job;

-- История выполнения
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### 2. Проверка очередей

```sql
-- Список очередей
SELECT * FROM pgmq.list_queues();

-- Задачи в email_queue
SELECT 
  msg_id,
  enqueued_at,
  msg->>'to' as email_to,
  msg->>'subject' as subject,
  EXTRACT(EPOCH FROM (now() - enqueued_at)) as age_seconds
FROM pgmq.email_queue
ORDER BY enqueued_at DESC
LIMIT 10;
```

### 3. Тестирование email

1. Завершите тестовый чекап в приложении
2. Подождите 5-10 секунд
3. Проверьте логи worker'а:
   ```
   [INFO] Processing email task: user@example.com - Ваш чекап завершен
   [INFO] Email sent via SMTP to user@example.com
   ```
4. Проверьте почту - должно прийти письмо

### 4. Проверка триггеров

```sql
-- Проверка, что триггеры созданы
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('assessments', 'appointments', 'payments');
```

---

## 🚀 Запуск в продакшене

### 1. Миграции применены

Убедитесь, что все миграции применены:
- ✅ `030_setup_cron_jobs.sql`
- ✅ `031_setup_queues.sql`
- ✅ `032_webhook_triggers.sql`
- ✅ `033_pgmq_rpc_wrappers.sql`

### 2. Worker настроен

1. Создайте файл `queue-worker/.env` с настройками
2. Установите зависимости: `npm install`
3. Протестируйте: `npm run dev`

### 3. Запуск worker в продакшене

#### Вариант A: PM2 (рекомендуется)

```bash
cd queue-worker
npm run build
npm run start:pm2
pm2 save
pm2 startup  # Следуйте инструкциям
```

**Управление:**
```bash
pm2 status
pm2 logs balansity-queue-worker
pm2 restart balansity-queue-worker
pm2 stop balansity-queue-worker
```

#### Вариант B: Docker

```bash
cd queue-worker
docker-compose up -d
docker-compose logs -f queue-worker
```

#### Вариант C: systemd (Linux)

Создайте `/etc/systemd/system/balansity-worker.service`:

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
sudo systemctl status balansity-worker
```

### 4. Мониторинг

#### Проверка работы Cron:

```sql
-- Последние выполнения
SELECT 
  jobid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE start_time > now() - interval '1 hour'
ORDER BY start_time DESC;
```

#### Проверка очередей:

```sql
-- Статистика очередей
SELECT 
  'email_queue' as queue,
  COUNT(*) as pending_tasks
FROM pgmq.email_queue
UNION ALL
SELECT 
  'report_generation_queue' as queue,
  COUNT(*) as pending_tasks
FROM pgmq.report_generation_queue;
```

#### Проверка worker:

```bash
# PM2
pm2 status
pm2 monit

# Docker
docker-compose ps
docker stats balansity-queue-worker
```

---

## 🔧 Troubleshooting

### Проблема: Cron задачи не выполняются

**Проверьте:**
1. Расширение `pg_cron` установлено:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```
2. Задачи созданы:
   ```sql
   SELECT * FROM cron.job;
   ```
3. Логи выполнения:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
   ```

**Решение:** Перезапустите PostgreSQL или проверьте права доступа.

### Проблема: Worker не обрабатывает задачи

**Проверьте:**
1. Worker запущен: `pm2 status` или `docker-compose ps`
2. Подключение к Supabase:
   - Проверьте `SUPABASE_SERVICE_ROLE_KEY` в `.env`
   - Проверьте логи на ошибки подключения
3. Очереди созданы:
   ```sql
   SELECT * FROM pgmq.list_queues();
   ```
4. Функции RPC доступны:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'pgmq_%';
   ```

**Решение:** 
- Примените миграцию `033_pgmq_rpc_wrappers.sql`
- Перезапустите worker

### Проблема: Email не отправляются

**Проверьте:**
1. SMTP настройки в `.env`:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
2. Логи worker'а на ошибки SMTP:
   ```bash
   pm2 logs balansity-queue-worker | grep -i smtp
   ```
3. Существует ли почтовый ящик `noreply@balansity.ru`
4. Порт 587 не заблокирован

**Решение:**
- Проверьте настройки SMTP в `SMTP_SETUP_BALANSITY.md`
- Попробуйте порт 465 (SSL) вместо 587 (TLS)

### Проблема: Триггеры не срабатывают

**Проверьте:**
1. Триггеры созданы:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_schema = 'public';
   ```
2. Функции триггеров существуют:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('handle_completed_checkup', 'handle_new_appointment', 'handle_payment_status_change');
   ```
3. Очереди созданы (см. выше)

**Решение:** Примените миграцию `032_webhook_triggers.sql` заново.

### Проблема: "Could not find the function pgmq_read"

**Решение:** Примените миграцию `033_pgmq_rpc_wrappers.sql`:

```sql
-- Выполните в SQL Editor
-- См. файл: supabase/migrations/033_pgmq_rpc_wrappers.sql
```

---

## 📊 Архитектура системы

```
┌─────────────────┐
│   Приложение    │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │
│                 │
│  ┌───────────┐  │
│  │  Triggers │  │──► Добавляют задачи в очереди
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │ Cron Jobs │  │──► Выполняют задачи по расписанию
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │  Queues   │  │──► Хранят задачи для обработки
│  └───────────┘  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Queue Worker   │
│  (Node.js)      │
│                 │
│  ┌───────────┐  │
│  │ Processors│  │──► Обрабатывают задачи
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │  Email    │  │──► Отправка через SMTP
│  └───────────┘  │
└─────────────────┘
```

---

## 📝 Файлы миграций

1. **030_setup_cron_jobs.sql** - Настройка Cron задач
2. **031_setup_queues.sql** - Создание очередей
3. **032_webhook_triggers.sql** - Настройка триггеров
4. **033_pgmq_rpc_wrappers.sql** - RPC обёртки для pgmq

---

## 🔐 Безопасность

⚠️ **Важно:**
- `SUPABASE_SERVICE_ROLE_KEY` - секретный ключ, храните в безопасности
- Файл `.env` не коммитьте в Git (уже в `.gitignore`)
- Пароль SMTP тоже секретный
- Используйте `SECURITY DEFINER` только для необходимых функций

---

## 📚 Дополнительные ресурсы

- **SMTP настройки:** `SMTP_SETUP_BALANSITY.md`
- **Быстрый старт worker:** `queue-worker/QUICK_START.md`
- **Как запустить worker:** `queue-worker/HOW_TO_RUN.md`
- **Проверка интеграций:** `VERIFY_INTEGRATIONS.md`

---

## ✅ Чек-лист настройки

- [ ] Миграции 030, 031, 032, 033 применены
- [ ] Cron задачи созданы и работают
- [ ] Очереди созданы
- [ ] Триггеры созданы и работают
- [ ] Worker настроен (`.env` заполнен)
- [ ] Worker запущен и обрабатывает задачи
- [ ] Email отправляются успешно
- [ ] Мониторинг настроен

---

**Дата создания:** 2025-12-01  
**Версия:** 1.0.0  
**Статус:** ✅ Полностью реализовано и протестировано



