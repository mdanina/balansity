# ⚡ Быстрая настройка Email для Self-Hosted Supabase

## 🎯 Цель: Отключить подтверждение email для разработки

Чтобы пользователи могли регистрироваться без подтверждения email, нужно добавить одну переменную окружения.

## 📝 Шаг 1: Найдите файл конфигурации

На сервере найдите один из этих файлов:
- `docker-compose.yml` (обычно в папке `/opt/supabase/` или `/home/user/supabase/`)
- `.env` (в той же папке, что и docker-compose.yml)

## 📝 Шаг 2: Добавьте переменную

### Если редактируете docker-compose.yml:

Найдите секцию `auth` (или `gotrue`) и добавьте в `environment`:

```yaml
services:
  auth:
    environment:
      # Добавьте эту строку:
      GOTRUE_MAILER_AUTOCONFIRM: "true"
      
      # И убедитесь, что есть:
      GOTRUE_SITE_URL: "http://localhost:8080"
      # или для продакшена:
      # GOTRUE_SITE_URL: "https://oyuyienekon.beget.app"
```

### Если редактируете .env файл:

Добавьте строки:

```env
GOTRUE_MAILER_AUTOCONFIRM=true
GOTRUE_SITE_URL=http://localhost:8080
```

## 📝 Шаг 3: Перезапустите сервис

После сохранения файла выполните на сервере:

```bash
# Если используете docker-compose
docker-compose restart auth

# Или полный перезапуск
docker-compose down && docker-compose up -d
```

## ✅ Готово!

Теперь пользователи смогут регистрироваться и сразу входить в систему без подтверждения email.

---

## 🔧 Для продакшена (с подтверждением email)

Если нужно включить подтверждение email и настроить SMTP:

### В docker-compose.yml:

```yaml
services:
  auth:
    environment:
      GOTRUE_MAILER_AUTOCONFIRM: "false"  # С подтверждением
      GOTRUE_SITE_URL: "https://oyuyienekon.beget.app"
      GOTRUE_URI_ALLOW_LIST: "https://oyuyienekon.beget.app/email-confirm,https://oyuyienekon.beget.app"
      
      # Настройки SMTP
      GOTRUE_SMTP_HOST: smtp.beget.com
      GOTRUE_SMTP_PORT: 587
      GOTRUE_SMTP_USER: ваш-email@beget.com
      GOTRUE_SMTP_PASS: ваш-пароль
      GOTRUE_SMTP_ADMIN_EMAIL: noreply@oyuyienekon.beget.app
      GOTRUE_SMTP_SENDER_NAME: "Little Otter"
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: /email-confirm
```

### В .env файле:

```env
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_SITE_URL=https://oyuyienekon.beget.app
GOTRUE_URI_ALLOW_LIST=https://oyuyienekon.beget.app/email-confirm,https://oyuyienekon.beget.app
GOTRUE_SMTP_HOST=smtp.beget.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=ваш-email@beget.com
GOTRUE_SMTP_PASS=ваш-пароль
GOTRUE_SMTP_ADMIN_EMAIL=noreply@oyuyienekon.beget.app
GOTRUE_SMTP_SENDER_NAME=Little Otter
GOTRUE_MAILER_URLPATHS_CONFIRMATION=/email-confirm
```

---

## 🆘 Не можете найти файлы?

1. **Через панель Beget:**
   - Войдите в панель управления
   - Найдите приложение Supabase
   - Откройте "Файловый менеджер"
   - Ищите файлы в корневой папке приложения

2. **Через SSH:**
   ```bash
   # Подключитесь к серверу
   ssh user@oyuyienekon.beget.app
   
   # Найдите файлы
   find / -name "docker-compose.yml" 2>/dev/null | grep -i supabase
   find / -name ".env" 2>/dev/null | grep -i supabase
   ```

3. **Свяжитесь с поддержкой Beget** - они подскажут, где находятся файлы конфигурации



