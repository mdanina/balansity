# Руководство по администрированию Jitsi для Balansity

## Сервер

- **URL**: https://video.balansity.ru
- **IP сервера**: 155.212.186.130
- **Путь к конфигурации**: `/opt/beget/jitsi/`

## Подключение к серверу

```bash
ssh root@155.212.186.130
```

---

## Управление пользователями

Все команды выполняются внутри контейнера prosody:

```bash
# Войти в контейнер
docker exec -it jitsi-prosody-1 bash

# После выполнения команд — выйти
exit
```

### Создать пользователя

```bash
prosodyctl --config /config/prosody.cfg.lua register ЛОГИН meet.jitsi 'ПАРОЛЬ'
```

**Пример:**
```bash
prosodyctl --config /config/prosody.cfg.lua register specialist1 meet.jitsi 'SecurePass123!'
```

### Сменить пароль

```bash
prosodyctl --config /config/prosody.cfg.lua passwd ЛОГИН meet.jitsi
```

### Удалить пользователя

```bash
prosodyctl --config /config/prosody.cfg.lua deluser ЛОГИН@meet.jitsi
```

### Список пользователей

```bash
ls /config/data/meet%2ejitsi/accounts/
```

---

## Текущие аккаунты

| Логин | Роль | Описание |
|-------|------|----------|
| admin | Администратор | Универсальный доступ для всех специалистов |

---

## Роли в комнате

### Организатор (модератор)
- Входит с логином/паролем
- Может выключать микрофоны участников
- Может удалять участников из комнаты
- Может включать лобби (зал ожидания)
- Может ставить пароль на комнату

### Гость
- Входит без логина, только вводит имя
- Базовые права участника

---

## Управление Jitsi

### Перезапуск сервиса

```bash
cd /opt/beget/jitsi && docker-compose down && docker-compose up -d
```

### Просмотр логов

```bash
cd /opt/beget/jitsi && docker-compose logs -f
```

### Проверка статуса

```bash
cd /opt/beget/jitsi && docker-compose ps
```

---

## Конфигурация (.env)

Файл: `/opt/beget/jitsi/.env`

Текущие настройки:
```
ENABLE_AUTH=1          # Включена авторизация
ENABLE_GUESTS=1        # Гости могут заходить
ENABLE_WELCOME_PAGE=0  # Главная страница скрыта
DISABLE_RECENT_LIST=1  # История комнат отключена
```

---

## Полезные функции Jitsi

### Уже доступны:
- Локальная запись (кнопка в интерфейсе)
- Размытие/виртуальный фон
- Демонстрация экрана
- Поднять руку
- Чат
- Таймер встречи

### Можно настроить:
- Лобби (зал ожидания) — в настройках комнаты
- Пароль на комнату — в настройках комнаты
- Брендинг (логотип Balansity)
- JWT токены для автоматического назначения ролей

---

## Формат ссылок на комнаты

```
https://video.balansity.ru/konsultaciya-DDmon-XXXXXX
```

Пример: `https://video.balansity.ru/konsultaciya-23dec-a1b2c3`

Ссылки генерируются автоматически при создании записи на консультацию в Balansity.

---

## Настройка вебхуков

Вебхуки отправляют уведомления в Telegram о событиях в комнатах:
- **Специалист начал сессию** — когда модератор входит в комнату
- **Клиент подключился** — когда гость входит в комнату
- **Сессия завершена** — когда комната закрывается

### Архитектура

```
Jitsi (Prosody) → HTTP POST → Queue Worker (api.balansity.ru) → Telegram Bot
```

### Эндпоинты вебхуков

| URL | Событие | Описание |
|-----|---------|----------|
| `POST /api/webhook/jitsi` | Общий | Принимает все события с полем `event` |
| `POST /api/webhook/jitsi/participant-joined` | participant_joined | Участник вошёл |
| `POST /api/webhook/jitsi/room-created` | room_created | Комната создана |
| `POST /api/webhook/jitsi/room-destroyed` | room_destroyed | Комната закрыта |
| `POST /api/webhook/jitsi/participant-left` | participant_left | Участник вышел |

### Формат данных

```json
{
  "event": "participant_joined",
  "room_name": "konsultaciya-23dec-abc123",
  "participant_name": "Иван",
  "participant_id": "user@meet.jitsi/abc123",
  "is_host": true,
  "duration": 1800
}
```

---

### Шаг 1: Создать модуль для Prosody

На сервере Jitsi создайте файл модуля:

```bash
# ВАЖНО: Правильный путь для плагинов
mkdir -p /opt/beget/jitsi/prosody/prosody-plugins-custom

# Создаём файл модуля
cat > /opt/beget/jitsi/prosody/prosody-plugins-custom/mod_muc_webhook.lua << 'EOF'
-- Модуль вебхуков для Balansity
local http = require "net.http";
local json = require "util.json";
local timer = require "util.timer";

local webhook_url = os.getenv("BALANSITY_WEBHOOK_URL") or "https://api.balansity.ru/api/webhook/jitsi";

local function send_webhook(event_type, data)
    local payload = json.encode({
        event = event_type,
        roomName = data.room_name,
        participantName = data.participant_name,
        participantId = data.participant_id,
        isHost = data.is_host,
        duration = data.duration,
        createdAt = os.date("!%Y-%m-%dT%H:%M:%SZ")
    });

    http.request(webhook_url, {
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
        },
        body = payload,
    }, function(response, code)
        if code ~= 200 then
            module:log("warn", "Webhook failed: %s", tostring(code));
        end
    end);
end

-- Комната создана
module:hook("muc-room-created", function(event)
    local room = event.room;
    send_webhook("room_created", {
        room_name = room.jid:match("^(.+)@"),
    });
end);

-- Комната уничтожена
module:hook("muc-room-destroyed", function(event)
    local room = event.room;
    send_webhook("room_destroyed", {
        room_name = room.jid:match("^(.+)@"),
    });
end);

-- Участник присоединился
module:hook("muc-occupant-joined", function(event)
    local room = event.room;
    local occupant = event.occupant;
    local is_host = occupant.role == "moderator";

    send_webhook("participant_joined", {
        room_name = room.jid:match("^(.+)@"),
        participant_name = occupant.nick,
        participant_id = occupant.jid,
        is_host = is_host,
    });
end);

-- Участник вышел
module:hook("muc-occupant-left", function(event)
    local room = event.room;
    local occupant = event.occupant;

    send_webhook("participant_left", {
        room_name = room.jid:match("^(.+)@"),
        participant_name = occupant.nick,
        participant_id = occupant.jid,
    });
end);

module:log("info", "Balansity webhook module loaded");
EOF
```

### Шаг 2: Настроить переменные окружения

В файле `/opt/beget/jitsi/.env` добавьте:

```bash
# URL вебхука Balansity
BALANSITY_WEBHOOK_URL=https://api.balansity.ru/api/webhook/jitsi
```

### Шаг 3: Подключить модуль в конфиге Prosody

Отредактируйте конфиг Prosody:

```bash
# ВАЖНО: Правильный путь к конфигу
nano /opt/beget/jitsi/prosody/config/conf.d/jitsi-meet.cfg.lua
```

Найдите секцию `Component "muc.meet.jitsi" "muc"` и добавьте модуль в `modules_enabled`:

```lua
Component "muc.meet.jitsi" "muc"
    storage = "memory"
    modules_enabled = {
        "muc_webhook";         -- <-- добавить эту строку
        "muc_meeting_id";
        "polls";
        "muc_domain_mapper";
        "muc_password_whitelist";
    }
```

Или одной командой:
```bash
docker exec jitsi-prosody-1 sed -i '/modules_enabled = {/a\        "muc_webhook";' /config/conf.d/jitsi-meet.cfg.lua
```

### Шаг 4: Перезапустить Jitsi

```bash
cd /opt/beget/jitsi && docker-compose down && docker-compose up -d
```

### Проверка работы вебхуков

После настройки при входе в комнату в Telegram должно приходить уведомление.

Логи можно посмотреть:
```bash
docker logs jitsi-prosody-1 2>&1 | grep -i webhook
```

---

## Структура директорий на сервере Jitsi

```
/opt/beget/jitsi/
├── .env                              # Основные настройки
├── docker-compose.yml
├── prosody/
│   ├── config/                       # Конфиги Prosody (монтируется в /config)
│   │   ├── prosody.cfg.lua           # Главный конфиг
│   │   └── conf.d/
│   │       └── jitsi-meet.cfg.lua    # Конфиг MUC
│   └── prosody-plugins-custom/       # Кастомные плагины (монтируется в /prosody-plugins-custom)
│       └── mod_muc_webhook.lua       # Модуль вебхуков
├── web/                              # Конфиги web-интерфейса
├── jvb/                              # Конфиги JVB
└── jicofo/                           # Конфиги Jicofo
```

---

## Troubleshooting

### Не могу войти как организатор
1. Проверь, что пользователь создан: `ls /config/data/meet%2ejitsi/accounts/`
2. Пересоздай пользователя с новым паролем

### Jitsi не запускается
```bash
cd /opt/beget/jitsi
docker-compose down
docker-compose up -d
docker-compose logs -f  # смотрим логи
```

### Сертификат SSL не работает
Проверь настройки Let's Encrypt в `.env`:
```
ENABLE_LETSENCRYPT=1
LETSENCRYPT_DOMAIN=video.balansity.ru
LETSENCRYPT_EMAIL=your-email@example.com
```

### Вебхуки не работают

1. **Проверить, что модуль загружен:**
```bash
docker logs jitsi-prosody-1 2>&1 | grep -i webhook
```

2. **Проверить путь к плагинам в главном конфиге:**
```bash
docker exec jitsi-prosody-1 cat /config/prosody.cfg.lua | grep plugin_paths
```

Если `/prosody-plugins-custom` не указан, добавьте:
```bash
# На хосте отредактировать /opt/beget/jitsi/prosody/config/prosody.cfg.lua
# Добавить строку:
plugin_paths = { "/prosody-plugins-custom" }
```

3. **Проверить, что файл модуля существует:**
```bash
docker exec jitsi-prosody-1 ls -la /prosody-plugins-custom/
```

4. **Проверить, что модуль включён в конфиге MUC:**
```bash
docker exec jitsi-prosody-1 cat /config/conf.d/jitsi-meet.cfg.lua | grep muc_webhook
```

5. **Тестовый запрос на вебхук:**
```bash
curl -X POST https://api.balansity.ru/api/webhook/jitsi \
  -H "Content-Type: application/json" \
  -d '{"event":"participant_joined","room_name":"test-room","participant_name":"Test","is_host":true}'
```

6. **Перезапустить Prosody:**
```bash
cd /opt/beget/jitsi && docker-compose restart prosody
```
