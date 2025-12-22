-- ============================================
-- Supabase Migration: Video Consultations (Jitsi Integration)
-- ============================================
-- Интеграция видеоконсультаций через Jitsi Meet
-- Сервер: video.balansity.ru

SET search_path = public;

-- ============================================
-- 1. Добавляем поля для видео в appointments
-- ============================================
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS video_room_name text,
ADD COLUMN IF NOT EXISTS video_room_url text;

-- Индекс для быстрого поиска по имени комнаты
CREATE INDEX IF NOT EXISTS idx_appointments_video_room_name
ON public.appointments(video_room_name)
WHERE video_room_name IS NOT NULL;

-- ============================================
-- 2. Функция генерации уникального имени комнаты
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_video_room_name()
RETURNS text AS $$
BEGIN
  -- Формат: balansity-UUID (без дефисов для совместимости с Jitsi)
  RETURN 'balansity-' || replace(gen_random_uuid()::text, '-', '');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Функция для создания ссылки на видеокомнату
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_video_room_url(room_name text)
RETURNS text AS $$
BEGIN
  RETURN 'https://video.balansity.ru/' || room_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Триггер: автоматически создаём комнату при создании записи
-- ============================================
CREATE OR REPLACE FUNCTION public.create_video_room_for_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Генерируем имя комнаты и URL
  NEW.video_room_name := public.generate_video_room_name();
  NEW.video_room_url := public.generate_video_room_url(NEW.video_room_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер срабатывает ПЕРЕД вставкой
DROP TRIGGER IF EXISTS on_appointment_create_video_room ON public.appointments;

CREATE TRIGGER on_appointment_create_video_room
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_video_room_for_appointment();

-- ============================================
-- 5. Обновляем Telegram уведомление - добавляем ссылку на видео
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

  -- Формируем сообщение с ссылкой на видео
  v_message := format(
    E'📅 <b>Новая запись на консультацию!</b>\n\n' ||
    '👤 <b>Клиент:</b> %s\n' ||
    '📱 <b>Телефон:</b> %s\n' ||
    '📋 <b>Тип:</b> %s\n' ||
    '💰 <b>Цена:</b> %s ₽\n' ||
    '🕐 <b>Дата:</b> %s\n' ||
    '📍 <b>Регион:</b> %s\n' ||
    '👶 <b>Для:</b> %s\n\n' ||
    '🎥 <b>Видео:</b> <a href="%s">Войти в комнату</a>\n\n' ||
    '🔗 <a href="https://balansity.ru/admin/appointments">Открыть в админке</a>',
    COALESCE(v_user_email, 'Не указан'),
    COALESCE(v_user_phone, 'Не указан'),
    COALESCE(v_appointment_type_name, 'Не указан'),
    COALESCE(v_appointment_price::text, '0'),
    to_char(NEW.scheduled_at AT TIME ZONE 'Europe/Moscow', 'DD.MM.YYYY HH24:MI'),
    COALESCE(v_user_region, 'Не указан'),
    COALESCE(v_profile_name, 'Не указан'),
    COALESCE(NEW.video_room_url, 'Не создана')
  );

  -- Отправляем в Telegram
  PERFORM public.send_telegram_message('manager_notifications', v_message);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Функция для получения ссылки на видео по appointment_id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_video_room_url(p_appointment_id uuid)
RETURNS text AS $$
DECLARE
  v_url text;
BEGIN
  SELECT video_room_url INTO v_url
  FROM public.appointments
  WHERE id = p_appointment_id;

  RETURN v_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Обновляем существующие записи (добавляем видеокомнаты)
-- ============================================
UPDATE public.appointments
SET
  video_room_name = public.generate_video_room_name(),
  video_room_url = public.generate_video_room_url(video_room_name)
WHERE video_room_name IS NULL;

-- Ещё раз обновляем URL (т.к. в первом UPDATE video_room_name ещё не был установлен)
UPDATE public.appointments
SET video_room_url = public.generate_video_room_url(video_room_name)
WHERE video_room_url IS NULL AND video_room_name IS NOT NULL;

-- ============================================
-- ГОТОВО!
-- ============================================
-- Теперь при создании записи на консультацию:
-- 1. Автоматически генерируется уникальное имя комнаты
-- 2. Создаётся ссылка на видео: https://video.balansity.ru/balansity-xxx
-- 3. В Telegram приходит уведомление со ссылкой на видео
--
-- Клиент и специалист могут войти по этой ссылке
-- Комната создаётся автоматически при первом входе
-- ============================================
