-- ============================================
-- Supabase Migration: Add User Roles
-- ============================================
-- Добавление системы ролей для админ-панели

-- ============================================
-- 1. Добавляем поле role в таблицу users
-- ============================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' 
CHECK (role IN ('user', 'support', 'admin', 'super_admin'));

-- Индекс для быстрого поиска по ролям
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================
-- 2. Функция для проверки, является ли пользователь админом
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Функция для проверки, является ли пользователь поддержкой или админом
-- ============================================
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('support', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Комментарии для документации
-- ============================================
COMMENT ON COLUMN public.users.role IS 'Роль пользователя: user (обычный), support (поддержка), admin (администратор), super_admin (супер-администратор)';
COMMENT ON FUNCTION public.is_admin() IS 'Проверяет, является ли текущий пользователь администратором или супер-администратором';
COMMENT ON FUNCTION public.is_staff() IS 'Проверяет, является ли текущий пользователь сотрудником (поддержка, админ или супер-админ)';



