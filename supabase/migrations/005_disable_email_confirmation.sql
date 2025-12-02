-- ============================================
-- Supabase Migration: Отключение подтверждения email
-- ============================================
-- Для self-hosted Supabase настройки email настраиваются через переменные окружения GoTrue
-- 
-- ⚠️ ВАЖНО: Эта миграция НЕ отключит подтверждение email автоматически!
-- 
-- Для отключения подтверждения email в self-hosted Supabase нужно:
-- 
-- 1. Найти файл docker-compose.yml или .env на сервере
-- 2. Добавить/изменить переменную окружения:
--    GOTRUE_MAILER_AUTOCONFIRM=true
-- 3. Перезапустить сервис auth:
--    docker-compose restart auth
-- 
-- См. подробную инструкцию: SUPABASE_SELF_HOSTED_EMAIL_SETUP.md
-- 
-- ============================================
-- Попытка обновить настройки через SQL (может не работать для self-hosted)
-- ============================================

-- Проверяем, существует ли таблица auth.config (может не существовать в self-hosted)
DO $$
BEGIN
  -- Пытаемся обновить настройки, если таблица существует
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'config'
  ) THEN
    -- Обновляем настройки подтверждения email
    UPDATE auth.config 
    SET 
      enable_email_confirmations = false,
      enable_signup = true
    WHERE true;
    
    RAISE NOTICE 'Настройки email обновлены через SQL (если таблица auth.config существует)';
  ELSE
    RAISE NOTICE 'Таблица auth.config не найдена. Для self-hosted Supabase используйте переменные окружения GOTRUE_MAILER_AUTOCONFIRM=true';
  END IF;
END $$;

-- ============================================
-- Инструкция для настройки через переменные окружения
-- ============================================
-- 
-- Для Docker Compose добавьте в docker-compose.yml:
-- 
-- services:
--   auth:
--     environment:
--       GOTRUE_MAILER_AUTOCONFIRM: "true"  # true = без подтверждения
--       GOTRUE_SITE_URL: "http://localhost:8080"  # или ваш домен
-- 
-- Для .env файла добавьте:
-- 
-- GOTRUE_MAILER_AUTOCONFIRM=true
-- GOTRUE_SITE_URL=http://localhost:8080
-- 
-- После изменения перезапустите:
-- docker-compose restart auth
-- 
-- ============================================








