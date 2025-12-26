-- =============================================
-- Миграция: Расписание работы специалистов
-- Хранит рабочие часы и дни
-- =============================================

-- Создаём таблицу расписания
CREATE TABLE IF NOT EXISTS public.specialist_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,

    -- Рабочие часы
    work_start_time TIME NOT NULL DEFAULT '09:00',
    work_end_time TIME NOT NULL DEFAULT '18:00',

    -- Рабочие дни (массив: mon, tue, wed, thu, fri, sat, sun)
    work_days TEXT[] NOT NULL DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri'],

    -- Перерыв (опционально)
    break_start_time TIME,
    break_end_time TIME,

    -- Длительность слота по умолчанию (минуты)
    default_slot_duration INTEGER NOT NULL DEFAULT 60,

    -- Буфер между консультациями (минуты)
    buffer_between_appointments INTEGER NOT NULL DEFAULT 15,

    -- Таймзона
    timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',

    -- Метаданные
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Один специалист - одно расписание
    UNIQUE (specialist_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_specialist_schedules_specialist_id
    ON public.specialist_schedules(specialist_id);

-- RLS политики
ALTER TABLE public.specialist_schedules ENABLE ROW LEVEL SECURITY;

-- Специалист видит только своё расписание
CREATE POLICY "Specialists can view their own schedule"
    ON public.specialist_schedules
    FOR SELECT
    USING (
        specialist_id = (
            SELECT id FROM public.specialists WHERE user_id = auth.uid()
        )
    );

-- Специалист может создавать своё расписание
CREATE POLICY "Specialists can create their own schedule"
    ON public.specialist_schedules
    FOR INSERT
    WITH CHECK (
        specialist_id = (
            SELECT id FROM public.specialists WHERE user_id = auth.uid()
        )
    );

-- Специалист может обновлять своё расписание
CREATE POLICY "Specialists can update their own schedule"
    ON public.specialist_schedules
    FOR UPDATE
    USING (
        specialist_id = (
            SELECT id FROM public.specialists WHERE user_id = auth.uid()
        )
    );

-- Специалист может удалять своё расписание
CREATE POLICY "Specialists can delete their own schedule"
    ON public.specialist_schedules
    FOR DELETE
    USING (
        specialist_id = (
            SELECT id FROM public.specialists WHERE user_id = auth.uid()
        )
    );

-- Админы имеют полный доступ
CREATE POLICY "Admins have full access to schedules"
    ON public.specialist_schedules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Клиенты могут видеть расписание своих специалистов (для записи)
CREATE POLICY "Clients can view their specialists schedules"
    ON public.specialist_schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.client_assignments ca
            WHERE ca.specialist_id = specialist_schedules.specialist_id
            AND ca.client_user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION public.update_specialist_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_specialist_schedules_updated_at ON public.specialist_schedules;
CREATE TRIGGER trigger_update_specialist_schedules_updated_at
    BEFORE UPDATE ON public.specialist_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_specialist_schedules_updated_at();

-- Гранты
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specialist_schedules TO authenticated;

-- Комментарии
COMMENT ON TABLE public.specialist_schedules IS 'Расписание работы специалистов';
COMMENT ON COLUMN public.specialist_schedules.work_days IS 'Массив рабочих дней: mon, tue, wed, thu, fri, sat, sun';
COMMENT ON COLUMN public.specialist_schedules.default_slot_duration IS 'Длительность слота по умолчанию в минутах';
COMMENT ON COLUMN public.specialist_schedules.buffer_between_appointments IS 'Буфер между консультациями в минутах';
