-- ============================================
-- Supabase Migration: Fix handle_new_user Function
-- Migration: 048_fix_handle_new_user_function.sql
-- ============================================
-- ИСПРАВЛЕНИЕ КРИТИЧЕСКОГО БАГА РЕГИСТРАЦИИ
--
-- Проблема: В миграции 034 функция handle_new_user() была ошибочно изменена:
-- вместо создания записи в public.users она пыталась создать запись в public.profiles.
-- Это приводило к ошибке 500 при регистрации, т.к. profiles.user_id требует
-- существующую запись в users (foreign key constraint).
--
-- Решение: Восстанавливаем корректную логику создания записи в public.users
-- ============================================

-- Исправляем функцию handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Комментарий для документации
COMMENT ON FUNCTION public.handle_new_user() IS 'Триггерная функция для автоматического создания записи в public.users при регистрации нового пользователя в auth.users';
