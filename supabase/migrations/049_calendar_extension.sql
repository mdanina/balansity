-- ============================================
-- Balansity Migration: Calendar Extension
-- Migration: 049_calendar_extension
-- Description: Добавляем поля для полноценного календаря специалиста
-- ============================================

SET search_path = public;

-- ============================================
-- 1. РАСШИРЕНИЕ ТАБЛИЦЫ APPOINTMENTS
-- ============================================

-- Формат встречи
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS meeting_format TEXT
  CHECK (meeting_format IN ('online', 'in_person'));

-- Длительность в минутах (если отличается от типа консультации)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- URL видеокомнаты
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS video_room_url TEXT;

-- Поля для повторяющихся консультаций
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT
  CHECK (recurring_pattern IN ('weekly', 'monthly'));

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS parent_appointment_id UUID
  REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Временная зона
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Moscow';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_appointments_meeting_format
ON public.appointments(meeting_format)
WHERE meeting_format IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_recurring_pattern
ON public.appointments(recurring_pattern)
WHERE recurring_pattern IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_parent_id
ON public.appointments(parent_appointment_id)
WHERE parent_appointment_id IS NOT NULL;

-- ============================================
-- 2. ОБНОВЛЕНИЕ RLS ПОЛИТИК ДЛЯ СПЕЦИАЛИСТОВ
-- ============================================

-- Специалист может видеть свои назначенные консультации
DROP POLICY IF EXISTS "Specialists can view assigned appointments" ON public.appointments;
CREATE POLICY "Specialists can view assigned appointments"
ON public.appointments FOR SELECT TO authenticated
USING (
    specialist_id = (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.is_admin()
    OR public.is_coordinator()
);

-- Специалист может создавать консультации для своих клиентов
DROP POLICY IF EXISTS "Specialists can insert appointments" ON public.appointments;
CREATE POLICY "Specialists can insert appointments"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (
    specialist_id = (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.is_admin()
    OR public.is_coordinator()
);

-- Специалист может обновлять свои консультации
DROP POLICY IF EXISTS "Specialists can update assigned appointments" ON public.appointments;
CREATE POLICY "Specialists can update assigned appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (
    specialist_id = (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.is_admin()
    OR public.is_coordinator()
);

-- Специалист может удалять свои консультации
DROP POLICY IF EXISTS "Specialists can delete assigned appointments" ON public.appointments;
CREATE POLICY "Specialists can delete assigned appointments"
ON public.appointments FOR DELETE TO authenticated
USING (
    specialist_id = (SELECT id FROM public.specialists WHERE user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.is_admin()
    OR public.is_coordinator()
);

-- ============================================
-- 3. ФУНКЦИЯ ДЛЯ УСТАНОВКИ ДЛИТЕЛЬНОСТИ
-- ============================================
-- Если duration_minutes не указан, берём из appointment_type

CREATE OR REPLACE FUNCTION public.set_appointment_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Если duration_minutes не указан, берём из типа консультации
    IF NEW.duration_minutes IS NULL THEN
        SELECT duration_minutes INTO NEW.duration_minutes
        FROM public.appointment_types
        WHERE id = NEW.appointment_type_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_appointment_duration_trigger ON public.appointments;
CREATE TRIGGER set_appointment_duration_trigger
    BEFORE INSERT ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_appointment_duration();

-- ============================================
-- 4. КОММЕНТАРИИ
-- ============================================

COMMENT ON COLUMN public.appointments.meeting_format IS 'Формат встречи: online или in_person';
COMMENT ON COLUMN public.appointments.duration_minutes IS 'Длительность консультации в минутах';
COMMENT ON COLUMN public.appointments.video_room_url IS 'URL видеокомнаты для онлайн-консультации';
COMMENT ON COLUMN public.appointments.recurring_pattern IS 'Паттерн повторения: weekly или monthly';
COMMENT ON COLUMN public.appointments.parent_appointment_id IS 'ID родительской консультации для повторяющихся серий';
COMMENT ON COLUMN public.appointments.timezone IS 'Временная зона для отображения времени';
