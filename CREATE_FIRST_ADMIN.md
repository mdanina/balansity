# Как создать первого администратора

## Быстрый вариант для smartbodycentre@gmail.com

Если ваш email `smartbodycentre@gmail.com`, используйте готовый скрипт:
- **`CREATE_ADMIN_smartbodycentre.sql`** — простой скрипт с вашими данными
- **`supabase/migrations/028_create_first_admin.sql`** — полный скрипт с вашими данными

---

## Общая инструкция

## Проблема

Для входа в админ-панель нужна роль `admin`, `super_admin` или `support`. Но если нет ни одного админа, то нельзя войти в админ-панель, чтобы создать админа через интерфейс. Поэтому **первого админа нужно создать вручную через SQL**.

---

## Способ 1: Через SQL Editor (Рекомендуется)

### Шаг 1: Откройте Supabase SQL Editor

1. Войдите в [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (в левом меню)

### Шаг 2: Выполните SQL запрос

**Вариант A: Если пользователь уже зарегистрирован**

Если у вас уже есть пользователь (вы регистрировались через приложение), просто обновите его роль:

```sql
-- Замените email на ваш реальный email
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Вариант B: Создать нового пользователя через Supabase Auth, затем обновить роль**

1. Сначала создайте пользователя:
   - Перейдите в **Authentication** → **Users**
   - Нажмите **Add User**
   - Введите email и пароль
   - Включите **Auto Confirm User** (чтобы не нужно было подтверждать email)
   - Нажмите **Create User**

2. Затем обновите роль:
   ```sql
   UPDATE public.users 
   SET role = 'admin' 
   WHERE email = 'new-admin@example.com';
   ```

### Шаг 3: Проверка

Убедитесь, что роль установлена:

```sql
SELECT id, email, role 
FROM public.users 
WHERE email = 'your-email@example.com';
```

Должна вернуться строка с `role = 'admin'`.

---

## Способ 2: Использовать готовый SQL скрипт

Используйте файл `supabase/migrations/028_create_first_admin.sql`:

1. Откройте файл в редакторе
2. Замените `'your-admin-email@example.com'` на реальный email
3. Скопируйте нужный вариант запроса
4. Вставьте в Supabase SQL Editor
5. Выполните

---

## Способ 3: Через Supabase CLI (для разработчиков)

Если используете Supabase CLI локально:

```bash
# Подключитесь к БД
supabase db reset

# Или выполните SQL напрямую
psql -h localhost -U postgres -d postgres -c "UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';"
```

---

## Типы ролей

### `user` (по умолчанию)
- Обычный пользователь
- Нет доступа к админ-панели

### `support`
- Сотрудник поддержки
- Имеет доступ к админ-панели
- Может просматривать данные пользователей

### `admin`
- Администратор
- Полный доступ к админ-панели
- Может управлять пользователями, контентом и т.д.

### `super_admin`
- Супер-администратор
- Все права админа
- Может изменять роли других админов

---

## Создание нескольких админов

Можно создать несколько админов сразу:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'support@example.com'  -- для поддержки
);
```

---

## Проверка всех админов

Посмотреть всех пользователей с правами доступа:

```sql
SELECT 
  id,
  email,
  role,
  created_at,
  CASE 
    WHEN role = 'super_admin' THEN 'Супер-администратор'
    WHEN role = 'admin' THEN 'Администратор'
    WHEN role = 'support' THEN 'Поддержка'
    ELSE 'Пользователь'
  END as role_name
FROM public.users
WHERE role IN ('admin', 'super_admin', 'support')
ORDER BY created_at DESC;
```

---

## После создания админа

1. **Войдите в админ-панель:**
   - Откройте приложение
   - Перейдите на `/admin/login`
   - Введите email и пароль админа

2. **Создайте других админов через интерфейс:**
   - После входа перейдите в `/admin/users`
   - Найдите пользователя
   - Нажмите "Редактировать"
   - Измените роль на `admin`, `support` или `super_admin`

---

## Частые проблемы

### Проблема: "Доступ запрещен" при входе

**Решение:**
1. Проверьте, что роль установлена в БД:
   ```sql
   SELECT email, role FROM public.users WHERE email = 'your-email@example.com';
   ```
2. Убедитесь, что роль `admin`, `super_admin` или `support`
3. Попробуйте выйти и войти заново

### Проблема: Пользователь не найден в `public.users`

**Решение:**
Пользователь должен быть сначала создан в `auth.users` (через регистрацию или Supabase Dashboard), затем автоматически создается запись в `public.users` через триггер.

Если записи нет, создайте вручную:
```sql
-- Сначала найдите ID пользователя в auth.users
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Затем создайте запись в public.users (замените uuid на реальный ID)
INSERT INTO public.users (id, email, role)
VALUES ('uuid-from-auth-users', 'your-email@example.com', 'admin');
```

### Проблема: Миграции не применены

**Решение:**
Убедитесь, что выполнены миграции:
- `026_add_user_roles.sql` (добавляет поле `role`)
- `027_admin_rls_policies.sql` (добавляет RLS политики)

---

## Безопасность

⚠️ **Важно:**
- Используйте сильные пароли для админ-аккаунтов
- Не делитесь админ-учетными данными
- Ограничьте количество админов
- Регулярно проверяйте список админов

---

**Готово!** Теперь вы можете войти в админ-панель на `/admin/login`

