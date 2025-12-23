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
