-- ============================================
-- Supabase Migration: Telegram Notifications via pg_net
-- ============================================
-- Отправка уведомлений в Telegram при новых записях на консультацию
-- Использует pg_net для асинхронных HTTP запросов

-- Устанавливаем схему по умолчанию
SET search_path = public;

-- ============================================
-- 1. Таблица конфигурации Telegram
-- ============================================
-- Хранит токен бота и chat_id для уведомлений
-- Более безопасно, чем хардкод в функции

CREATE TABLE IF NOT EXISTS public.telegram_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,           -- Название конфигурации (например, 'manager_notifications')
  bot_token text NOT NULL,             -- Токен бота от @BotFather
  chat_id text NOT NULL,               -- ID чата/группы для уведомлений
  is_active boolean DEFAULT true,      -- Включены ли уведомления
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS для telegram_config (только админы могут читать/писать)
ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

-- Политика: только service_role может работать с конфигурацией
CREATE POLICY "Service role full access to telegram_config"
  ON public.telegram_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Политика: админы могут читать
CREATE POLICY "Admins can read telegram_config"
  ON public.telegram_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- 2. Функция отправки сообщения в Telegram
-- ============================================
CREATE OR REPLACE FUNCTION public.send_telegram_message(
  p_config_name text,
  p_message text
)
RETURNS bigint AS $$
DECLARE
  v_bot_token text;
  v_chat_id text;
  v_is_active boolean;
  v_request_id bigint;
BEGIN
  -- Получаем конфигурацию
  SELECT bot_token, chat_id, is_active
  INTO v_bot_token, v_chat_id, v_is_active
  FROM public.telegram_config
  WHERE name = p_config_name;

  -- Проверяем, что конфигурация существует и активна
  IF v_bot_token IS NULL THEN
    RAISE WARNING 'Telegram config "%" not found', p_config_name;
    RETURN NULL;
  END IF;

  IF NOT v_is_active THEN
    RAISE NOTICE 'Telegram notifications disabled for "%"', p_config_name;
    RETURN NULL;
  END IF;

  -- Отправляем запрос через pg_net
  SELECT net.http_post(
    url := format('https://api.telegram.org/bot%s/sendMessage', v_bot_token),
    body := jsonb_build_object(
      'chat_id', v_chat_id,
      'text', p_message,
      'parse_mode', 'HTML'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Функция для уведомления о новой записи
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_telegram_new_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
  v_user_phone text;
  v_appointment_type_name text;
  v_appointment_price numeric;
  v_profile_name text;
  v_user_region text;
  v_message text;
BEGIN
  -- Получаем данные пользователя
  SELECT email, phone, region
  INTO v_user_email, v_user_phone, v_user_region
  FROM public.users
  WHERE id = NEW.user_id;

  -- Получаем название и цену типа консультации
  SELECT name, price
  INTO v_appointment_type_name, v_appointment_price
  FROM public.appointment_types
  WHERE id = NEW.appointment_type_id;

  -- Получаем имя профиля (если указан)
  IF NEW.profile_id IS NOT NULL THEN
    SELECT first_name
    INTO v_profile_name
    FROM public.profiles
    WHERE id = NEW.profile_id;
  END IF;

  -- Формируем сообщение
  v_message := format(
    E'📅 <b>Новая запись на консультацию!</b>\n\n' ||
    '👤 <b>Клиент:</b> %s\n' ||
    '📱 <b>Телефон:</b> %s\n' ||
    '📋 <b>Тип:</b> %s\n' ||
    '💰 <b>Цена:</b> %s ₽\n' ||
    '🕐 <b>Дата:</b> %s\n' ||
    '📍 <b>Регион:</b> %s\n' ||
    '👶 <b>Для:</b> %s\n\n' ||
    '🔗 <a href="https://balansity.ru/admin/appointments">Открыть в админке</a>',
    COALESCE(v_user_email, 'Не указан'),
    COALESCE(v_user_phone, 'Не указан'),
    COALESCE(v_appointment_type_name, 'Не указан'),
    COALESCE(v_appointment_price::text, '0'),
    to_char(NEW.scheduled_at AT TIME ZONE 'Europe/Moscow', 'DD.MM.YYYY HH24:MI'),
    COALESCE(v_user_region, 'Не указан'),
    COALESCE(v_profile_name, 'Не указан')
  );

  -- Отправляем в Telegram
  PERFORM public.send_telegram_message('manager_notifications', v_message);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Триггер на новые записи
-- ============================================
DROP TRIGGER IF EXISTS on_new_appointment_telegram ON public.appointments;

CREATE TRIGGER on_new_appointment_telegram
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_telegram_new_appointment();

-- ============================================
-- 5. Функция для уведомления об отмене записи
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_telegram_cancelled_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
  v_appointment_type_name text;
  v_message text;
BEGIN
  -- Проверяем, что статус изменился на 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Получаем данные
    SELECT email INTO v_user_email
    FROM public.users WHERE id = NEW.user_id;

    SELECT name INTO v_appointment_type_name
    FROM public.appointment_types WHERE id = NEW.appointment_type_id;

    -- Формируем сообщение
    v_message := format(
      E'❌ <b>Запись отменена</b>\n\n' ||
      '👤 <b>Клиент:</b> %s\n' ||
      '📋 <b>Тип:</b> %s\n' ||
      '🕐 <b>Была на:</b> %s',
      COALESCE(v_user_email, 'Не указан'),
      COALESCE(v_appointment_type_name, 'Не указан'),
      to_char(NEW.scheduled_at AT TIME ZONE 'Europe/Moscow', 'DD.MM.YYYY HH24:MI')
    );

    PERFORM public.send_telegram_message('manager_notifications', v_message);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Триггер на отмену записи
-- ============================================
DROP TRIGGER IF EXISTS on_cancelled_appointment_telegram ON public.appointments;

CREATE TRIGGER on_cancelled_appointment_telegram
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
  EXECUTE FUNCTION public.notify_telegram_cancelled_appointment();

-- ============================================
-- 7. Тестовая функция для проверки
-- ============================================
CREATE OR REPLACE FUNCTION public.test_telegram_notification()
RETURNS text AS $$
DECLARE
  v_request_id bigint;
BEGIN
  SELECT public.send_telegram_message(
    'manager_notifications',
    E'✅ <b>Тест уведомлений</b>\n\nЕсли вы видите это сообщение, уведомления работают!'
  ) INTO v_request_id;

  IF v_request_id IS NOT NULL THEN
    RETURN format('Сообщение отправлено! Request ID: %s', v_request_id);
  ELSE
    RETURN 'Ошибка: проверьте конфигурацию telegram_config';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ИНСТРУКЦИЯ ПО НАСТРОЙКЕ
-- ============================================
--
-- 1. Создайте бота в Telegram:
--    - Напишите @BotFather
--    - Отправьте /newbot
--    - Следуйте инструкциям
--    - Сохраните токен (например: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
--
-- 2. Получите chat_id:
--    - Добавьте бота в группу или напишите ему лично
--    - Откройте: https://api.telegram.org/bot<TOKEN>/getUpdates
--    - Найдите "chat":{"id": ЧИСЛО} - это ваш chat_id
--    - Для групп chat_id будет отрицательным (например: -1001234567890)
--
-- 3. Добавьте конфигурацию (выполните в SQL Editor):
--
--    INSERT INTO public.telegram_config (name, bot_token, chat_id)
--    VALUES (
--      'manager_notifications',
--      'YOUR_BOT_TOKEN_HERE',
--      'YOUR_CHAT_ID_HERE'
--    );
--
-- 4. Протестируйте:
--
--    SELECT public.test_telegram_notification();
--
-- ============================================
