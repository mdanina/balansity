# Создание специалиста в Balansity

## Предварительные требования

1. Доступ к Supabase Dashboard
2. Пользователь должен быть создан через Supabase Auth

## Шаг 1: Создание пользователя

В Supabase Dashboard:
1. Перейдите в **Authentication → Users**
2. Нажмите **Add User → Create New User**
3. Введите email и пароль специалиста
4. Нажмите **Create User**

## Шаг 2: Настройка специалиста (SQL)

Откройте **SQL Editor** в Supabase Dashboard и выполните скрипт:

```sql
-- ============================================
-- СКРИПТ СОЗДАНИЯ СПЕЦИАЛИСТА
-- ============================================

DO $$
DECLARE
  -- ИЗМЕНИТЕ ЭТИ ПАРАМЕТРЫ:
  v_email TEXT := 'specialist@example.com';        -- Email специалиста (должен совпадать с Auth)
  v_display_name TEXT := 'Иван Петров';            -- Отображаемое имя
  v_phone TEXT := '+7 999 123-45-67';              -- Телефон (опционально)
  v_bio TEXT := 'Психолог с 10-летним опытом работы. Специализация: семейная терапия, работа с тревожностью.';
  v_experience_years INT := 10;                     -- Лет опыта
  v_specializations TEXT[] := ARRAY['psychologist', 'family_therapist'];  -- Специализации
  v_hourly_rate NUMERIC := 5000.00;                -- Стоимость часа (опционально)

  -- Служебные переменные
  v_user_id UUID;
  v_specialist_id UUID;
BEGIN
  -- Находим пользователя по email
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь с email % не найден. Сначала создайте пользователя через Supabase Auth.', v_email;
  END IF;

  -- Проверяем, не является ли уже специалистом
  IF EXISTS (SELECT 1 FROM public.specialists WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Пользователь % уже является специалистом.', v_email;
  END IF;

  -- Устанавливаем роль specialist
  UPDATE public.users
  SET role = 'specialist'
  WHERE id = v_user_id;

  -- Создаём профиль специалиста
  INSERT INTO public.specialists (
    user_id,
    display_name,
    phone,
    bio,
    experience_years,
    specialization_codes,
    hourly_rate,
    is_available,
    accepts_new_clients,
    max_clients,
    working_hours
  )
  VALUES (
    v_user_id,
    v_display_name,
    v_phone,
    v_bio,
    v_experience_years,
    v_specializations,
    v_hourly_rate,
    true,   -- is_available
    true,   -- accepts_new_clients
    50,     -- max_clients
    '{
      "mon": {"start": "09:00", "end": "18:00"},
      "tue": {"start": "09:00", "end": "18:00"},
      "wed": {"start": "09:00", "end": "18:00"},
      "thu": {"start": "09:00", "end": "18:00"},
      "fri": {"start": "09:00", "end": "17:00"}
    }'::jsonb
  )
  RETURNING id INTO v_specialist_id;

  RAISE NOTICE 'Специалист успешно создан!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Specialist ID: %', v_specialist_id;
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Вход: /specialist/login';
END $$;
```

## Доступные специализации

| Код | Название |
|-----|----------|
| `psychologist` | Психолог |
| `psychiatrist` | Психиатр |
| `psychotherapist` | Психотерапевт |
| `clinical_psychologist` | Клинический психолог |
| `child_psychologist` | Детский психолог |
| `family_therapist` | Семейный терапевт |
| `neuropsychologist` | Нейропсихолог |
| `logopedist` | Логопед |
| `defectologist` | Дефектолог |
| `art_therapist` | Арт-терапевт |
| `cbt_specialist` | Специалист по КПТ |
| `coordinator` | Координатор |

Получить полный список:
```sql
SELECT code, name, description FROM public.specializations WHERE is_active = true;
```

## Создание координатора

Для координатора используйте роль `coordinator`:

```sql
DO $$
DECLARE
  v_email TEXT := 'coordinator@example.com';
  v_display_name TEXT := 'Мария Иванова';
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;

  UPDATE public.users SET role = 'coordinator' WHERE id = v_user_id;

  INSERT INTO public.specialists (
    user_id,
    display_name,
    specialization_codes,
    is_available
  ) VALUES (
    v_user_id,
    v_display_name,
    ARRAY['coordinator'],
    true
  );

  RAISE NOTICE 'Координатор создан: %', v_email;
END $$;
```

## Проверка созданного специалиста

```sql
SELECT
  u.email,
  u.role,
  s.display_name,
  s.specialization_codes,
  s.is_available,
  s.created_at
FROM public.specialists s
JOIN public.users u ON u.id = s.user_id
ORDER BY s.created_at DESC;
```

## Назначение клиента специалисту

```sql
INSERT INTO public.client_assignments (
  client_user_id,
  specialist_id,
  assignment_type,
  assigned_by,
  status,
  notes
)
SELECT
  (SELECT id FROM public.users WHERE email = 'client@example.com'),
  s.id,
  'primary',
  (SELECT id FROM public.users WHERE role = 'coordinator' LIMIT 1),
  'active',
  'Назначен после установочной консультации'
FROM public.specialists s
JOIN public.users u ON u.id = s.user_id
WHERE u.email = 'specialist@example.com';
```

## Вход в кабинет специалиста

После создания специалист может войти:

- **URL:** `https://your-domain.com/specialist/login`
- **Email:** тот же, что при создании в Auth
- **Пароль:** тот же, что при создании в Auth

## Доступные страницы

| URL | Описание |
|-----|----------|
| `/specialist` | Обзор (дашборд) |
| `/specialist/clients` | Список клиентов |
| `/specialist/calendar` | Календарь |
| `/specialist/sessions` | Сессии |
| `/specialist/ai-analysis` | AI-анализ |

## Удаление специалиста

```sql
-- Сначала удаляем профиль специалиста
DELETE FROM public.specialists
WHERE user_id = (SELECT id FROM public.users WHERE email = 'specialist@example.com');

-- Возвращаем роль user
UPDATE public.users
SET role = 'user'
WHERE email = 'specialist@example.com';
```

## Troubleshooting

### "Пользователь не найден"
Убедитесь, что пользователь создан через Supabase Auth и email совпадает.

### "Уже является специалистом"
Пользователь уже добавлен в таблицу specialists. Проверьте:
```sql
SELECT * FROM public.specialists WHERE user_id = (SELECT id FROM public.users WHERE email = 'email@example.com');
```

### "Нет доступа к кабинету"
Проверьте роль пользователя:
```sql
SELECT email, role FROM public.users WHERE email = 'email@example.com';
```
Должна быть `specialist` или `coordinator`.
