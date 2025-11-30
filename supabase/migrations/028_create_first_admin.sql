-- ============================================
-- Создание первого администратора
-- ============================================
-- Данные администратора:
-- Email: smartbodycentre@gmail.com
-- Password: [УДАЛЕНО ИЗ БЕЗОПАСНОСТИ - используйте переменные окружения или Supabase Dashboard]
-- 
-- ВАЖНО: Не храните пароли в открытом виде в Git!
-- Используйте Supabase Dashboard для создания пользователя или переменные окружения

-- ============================================
-- ВАРИАНТ 1: Если пользователь УЖЕ существует
-- ============================================
-- Если вы уже регистрировались через приложение с этим email,
-- просто выполните этот запрос:

UPDATE public.users 
SET role = 'admin' 
WHERE email = 'smartbodycentre@gmail.com';

-- Проверка (должна вернуть 1 строку с role = 'admin')
SELECT id, email, role, created_at
FROM public.users 
WHERE email = 'smartbodycentre@gmail.com';

-- ============================================
-- ВАРИАНТ 2: Если пользователя НЕТ - создайте через Dashboard
-- ============================================
-- 1. Откройте Supabase Dashboard
-- 2. Перейдите в Authentication → Users
-- 3. Нажмите "Add User"
-- 4. Введите:
--    - Email: smartbodycentre@gmail.com
--    - Password: [создайте безопасный пароль через Dashboard]
--    - Включите "Auto Confirm User" (чтобы не нужно было подтверждать email)
-- 5. Нажмите "Create User"
-- 6. Затем выполните UPDATE выше

-- ============================================
-- ВАРИАНТ 3: Создание через SQL (требует правильного хеша пароля)
-- ============================================
-- ВНИМАНИЕ: Этот вариант сложнее, так как нужно правильно захешировать пароль
-- Рекомендуется использовать Вариант 2 (через Dashboard)

-- Сначала проверьте, существует ли пользователь
DO $$
DECLARE
  user_exists boolean;
  user_id uuid;
BEGIN
  -- Проверяем, есть ли пользователь в auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'smartbodycentre@gmail.com') INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE NOTICE 'Пользователь не найден. Создайте его через Supabase Dashboard:';
    RAISE NOTICE '1. Authentication → Users → Add User';
    RAISE NOTICE '2. Email: smartbodycentre@gmail.com';
    RAISE NOTICE '3. Password: [создайте безопасный пароль]';
    RAISE NOTICE '4. Включите "Auto Confirm User"';
    RAISE NOTICE '5. Затем выполните UPDATE выше';
  ELSE
    -- Пользователь существует, обновляем роль
    SELECT id INTO user_id FROM auth.users WHERE email = 'smartbodycentre@gmail.com';
    
    -- Обновляем роль в public.users
    UPDATE public.users 
    SET role = 'admin' 
    WHERE id = user_id;
    
    RAISE NOTICE 'Роль успешно обновлена на admin для smartbodycentre@gmail.com';
  END IF;
END $$;

-- Проверка результата
SELECT 
  u.id,
  u.email,
  u.role,
  u.created_at,
  CASE 
    WHEN u.role = 'admin' THEN '✅ Администратор создан успешно!'
    WHEN u.role = 'super_admin' THEN '✅ Супер-администратор создан успешно!'
    WHEN u.role = 'support' THEN '✅ Поддержка создана успешно!'
    ELSE '⚠️ Роль не установлена (должна быть admin, support или super_admin)'
  END as status
FROM public.users u
WHERE u.email = 'smartbodycentre@gmail.com';

-- ============================================
-- Создание супер-администратора (опционально)
-- ============================================
-- Если нужен супер-администратор вместо обычного админа:
-- UPDATE public.users 
-- SET role = 'super_admin' 
-- WHERE email = 'smartbodycentre@gmail.com';

-- ============================================
-- Полезные запросы для проверки
-- ============================================

-- Посмотреть всех админов
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
ORDER BY 
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'support' THEN 3
  END,
  created_at DESC;

-- Проверить конкретного пользователя
SELECT 
  id,
  email,
  role,
  phone,
  region,
  marketing_consent,
  created_at
FROM public.users 
WHERE email = 'smartbodycentre@gmail.com';
