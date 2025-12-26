-- =============================================
-- Миграция: Case Summaries (сводки по клиентам)
-- Хранит комплексный обзор клиента
-- =============================================

-- Создаём таблицу case summaries
CREATE TABLE IF NOT EXISTS public.case_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    specialist_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Case Summary',
    summary_type TEXT NOT NULL DEFAULT 'manual' CHECK (summary_type IN ('auto', 'manual')),

    -- Секции сводки
    presenting_concerns TEXT,         -- Первичные обращения
    therapy_goals TEXT,               -- Цели терапии
    progress_summary TEXT,            -- Прогресс терапии
    key_themes TEXT[] DEFAULT '{}',   -- Ключевые темы (массив)
    treatment_approach TEXT,          -- Подход к лечению
    recommendations TEXT,             -- Рекомендации
    risk_assessment TEXT,             -- Оценка рисков

    -- Статистика
    sessions_count INTEGER NOT NULL DEFAULT 0,
    last_session_date TIMESTAMPTZ,
    notes_count INTEGER NOT NULL DEFAULT 0,

    -- Метаданные генерации
    generation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
    last_generated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Один специалист - одна сводка на клиента
    UNIQUE (client_user_id, specialist_user_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_case_summaries_client_user_id
    ON public.case_summaries(client_user_id);
CREATE INDEX IF NOT EXISTS idx_case_summaries_specialist_user_id
    ON public.case_summaries(specialist_user_id);
CREATE INDEX IF NOT EXISTS idx_case_summaries_updated_at
    ON public.case_summaries(updated_at DESC);

-- RLS политики
ALTER TABLE public.case_summaries ENABLE ROW LEVEL SECURITY;

-- Специалист может видеть только свои сводки
CREATE POLICY "Specialists can view their own case summaries"
    ON public.case_summaries
    FOR SELECT
    USING (specialist_user_id = auth.uid());

-- Специалист может создавать сводки для своих клиентов
CREATE POLICY "Specialists can create case summaries for their clients"
    ON public.case_summaries
    FOR INSERT
    WITH CHECK (
        specialist_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.client_assignments ca
            JOIN public.specialists s ON s.id = ca.specialist_id
            WHERE ca.client_user_id = case_summaries.client_user_id
            AND s.user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

-- Специалист может обновлять только свои сводки
CREATE POLICY "Specialists can update their own case summaries"
    ON public.case_summaries
    FOR UPDATE
    USING (specialist_user_id = auth.uid());

-- Специалист может удалять только свои сводки
CREATE POLICY "Specialists can delete their own case summaries"
    ON public.case_summaries
    FOR DELETE
    USING (specialist_user_id = auth.uid());

-- Администратор имеет полный доступ
CREATE POLICY "Admins have full access to case summaries"
    ON public.case_summaries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION public.update_case_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_case_summaries_updated_at ON public.case_summaries;
CREATE TRIGGER trigger_update_case_summaries_updated_at
    BEFORE UPDATE ON public.case_summaries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_case_summaries_updated_at();

-- Комментарии
COMMENT ON TABLE public.case_summaries IS 'Сводки по клиентам для специалистов';
COMMENT ON COLUMN public.case_summaries.presenting_concerns IS 'Первичные жалобы и причины обращения';
COMMENT ON COLUMN public.case_summaries.therapy_goals IS 'Цели терапии, согласованные с клиентом';
COMMENT ON COLUMN public.case_summaries.progress_summary IS 'Общий прогресс терапии';
COMMENT ON COLUMN public.case_summaries.key_themes IS 'Ключевые темы, выявленные в работе';
COMMENT ON COLUMN public.case_summaries.treatment_approach IS 'Используемые методы и подходы';
COMMENT ON COLUMN public.case_summaries.recommendations IS 'Рекомендации для дальнейшей работы';
COMMENT ON COLUMN public.case_summaries.risk_assessment IS 'Оценка рисков и факторов внимания';
