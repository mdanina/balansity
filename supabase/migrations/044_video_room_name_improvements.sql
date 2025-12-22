-- ============================================
-- Supabase Migration: Video Room Name Improvements
-- ============================================
-- Улучшение названий видеокомнат и безопасности

SET search_path = public;

-- ============================================
-- 1. Улучшенная функция генерации имени комнаты
-- ============================================
-- Формат: konsultaciya-{дата}-{короткий_id}
-- Пример: konsultaciya-25dec-a1b2c3

CREATE OR REPLACE FUNCTION public.generate_video_room_name(p_scheduled_at timestamptz DEFAULT now())
RETURNS text AS $$
DECLARE
  v_date_part text;
  v_random_part text;
BEGIN
  -- Формируем дату в формате DDmon (25dec, 03jan)
  v_date_part := lower(to_char(p_scheduled_at AT TIME ZONE 'Europe/Moscow', 'DDmon'));

  -- Короткий случайный ID (6 символов)
  v_random_part := lower(substr(md5(random()::text), 1, 6));

  -- Итоговый формат: konsultaciya-25dec-a1b2c3
  RETURN 'konsultaciya-' || v_date_part || '-' || v_random_part;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Обновляем триггер создания комнаты
-- ============================================
CREATE OR REPLACE FUNCTION public.create_video_room_for_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Генерируем имя комнаты с учётом даты консультации
  NEW.video_room_name := public.generate_video_room_name(NEW.scheduled_at);
  NEW.video_room_url := public.generate_video_room_url(NEW.video_room_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Обновляем существующие записи с новым форматом
-- ============================================
UPDATE public.appointments
SET
  video_room_name = public.generate_video_room_name(scheduled_at),
  video_room_url = 'https://video.balansity.ru/' || public.generate_video_room_name(scheduled_at)
WHERE video_room_name LIKE 'balansity-%';

-- ============================================
-- ГОТОВО!
-- ============================================
-- Новый формат названия: konsultaciya-25dec-a1b2c3
-- В Jitsi отобразится как: "Konsultaciya 25dec A1b2c3"
-- ============================================
