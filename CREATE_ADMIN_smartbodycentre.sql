-- ============================================
-- БЫСТРОЕ СОЗДАНИЕ АДМИНА
-- Email: smartbodycentre@gmail.com
-- Password: 123456
-- ============================================

-- ШАГ 1: Проверьте, существует ли пользователь
-- Если этот запрос вернет строку - пользователь существует, переходите к ШАГУ 2
-- Если ничего не вернет - сначала создайте пользователя через Supabase Dashboard
SELECT id, email 
FROM auth.users 
WHERE email = 'smartbodycentre@gmail.com';

-- ШАГ 2: Обновите роль на admin
-- Выполните этот запрос после создания пользователя
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'smartbodycentre@gmail.com';

-- ШАГ 3: Проверка результата
-- Должна вернуться строка с role = 'admin'
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Готово! Теперь можно войти на /admin/login'
    WHEN role = 'super_admin' THEN '✅ Супер-админ создан!'
    ELSE '⚠️ Роль не установлена'
  END as status
FROM public.users 
WHERE email = 'smartbodycentre@gmail.com';

-- ============================================
-- ИНСТРУКЦИЯ: Если пользователя нет
-- ============================================
-- 1. Откройте Supabase Dashboard
-- 2. Перейдите: Authentication → Users → Add User
-- 3. Заполните:
--    Email: smartbodycentre@gmail.com
--    Password: 123456
--    ✅ Включите "Auto Confirm User"
-- 4. Нажмите "Create User"
-- 5. Вернитесь сюда и выполните ШАГ 2


