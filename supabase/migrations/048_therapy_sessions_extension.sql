-- ============================================
-- Balansity Migration: Therapy Sessions Extension
-- Migration: 048_therapy_sessions_extension
-- Description: Расширение appointments для поддержки терапевтических сессий
-- Перенос функционала из PsiPilot
-- ============================================

SET search_path = public;

-- ============================================
-- 1. РАСШИРЕНИЕ ТАБЛИЦЫ APPOINTMENTS
-- ============================================
-- Добавляем поля для терапевтических сессий

-- Поля для транскрипции
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS transcript_status TEXT DEFAULT 'pending'
  CHECK (transcript_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Поля для тайминга сессии
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Поле для специалиста (если не указан через appointment_type)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS specialist_id UUID REFERENCES public.specialists(id) ON DELETE SET NULL;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_appointments_transcript_status
ON public.appointments(transcript_status)
WHERE transcript_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_specialist_id
ON public.appointments(specialist_id)
WHERE specialist_id IS NOT NULL;

-- ============================================
-- 2. ТАБЛИЦА RECORDINGS (Аудиозаписи)
-- ============================================

CREATE TABLE IF NOT EXISTS public.recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Информация о файле
    file_path TEXT NOT NULL,
    file_name TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    duration_seconds INTEGER,

    -- Транскрипция
    transcript TEXT,
    transcript_status TEXT DEFAULT 'pending'
      CHECK (transcript_status IN ('pending', 'processing', 'completed', 'failed')),
    transcript_id TEXT, -- ID во внешнем сервисе транскрипции

    -- Статусы
    upload_status TEXT DEFAULT 'pending'
      CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),

    -- Soft delete
    deleted_at TIMESTAMPTZ,

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_recordings_appointment_id ON public.recordings(appointment_id);
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_transcript_status ON public.recordings(transcript_status);
CREATE INDEX IF NOT EXISTS idx_recordings_deleted_at ON public.recordings(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.recordings IS 'Аудиозаписи терапевтических сессий';

-- ============================================
-- 3. ТАБЛИЦА SESSION_NOTES (Заметки специалиста)
-- ============================================

CREATE TABLE IF NOT EXISTS public.session_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),

    -- Контент
    content TEXT NOT NULL,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'file')),
    original_filename TEXT,

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_session_notes_appointment_id ON public.session_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON public.session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_created_at ON public.session_notes(created_at);

COMMENT ON TABLE public.session_notes IS 'Заметки специалиста к терапевтическим сессиям';

-- ============================================
-- 4. ТАБЛИЦА USER_APPOINTMENT_TABS (Открытые вкладки)
-- ============================================
-- Хранит открытые вкладки сессий для каждого пользователя

CREATE TABLE IF NOT EXISTS public.user_appointment_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    opened_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_user_appointment_tabs_user_id ON public.user_appointment_tabs(user_id);

COMMENT ON TABLE public.user_appointment_tabs IS 'Открытые вкладки сессий для UI';

-- ============================================
-- 5. RLS ПОЛИТИКИ
-- ============================================

-- RECORDINGS
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- Специалист видит записи своих консультаций
CREATE POLICY "recordings_select_specialist" ON public.recordings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = recordings.appointment_id
            AND (
                a.specialist_id = (SELECT id FROM public.specialists WHERE user_id = auth.uid())
                OR recordings.user_id = auth.uid()
            )
        )
        AND deleted_at IS NULL
    );

-- Специалист может создавать записи для своих консультаций
CREATE POLICY "recordings_insert_specialist" ON public.recordings
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = recordings.appointment_id
            AND (
                a.specialist_id = (SELECT id FROM public.specialists WHERE user_id = auth.uid())
                OR public.is_coordinator()
                OR public.is_admin()
            )
        )
    );

-- Специалист может обновлять свои записи
CREATE POLICY "recordings_update_own" ON public.recordings
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Специалист может удалять свои записи (soft delete)
CREATE POLICY "recordings_delete_own" ON public.recordings
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Админы и координаторы видят всё
CREATE POLICY "recordings_admin_all" ON public.recordings
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_coordinator());

-- SESSION_NOTES
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

-- Специалист видит заметки к своим консультациям
CREATE POLICY "session_notes_select_specialist" ON public.session_notes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = session_notes.appointment_id
            AND (
                a.specialist_id = (SELECT id FROM public.specialists WHERE user_id = auth.uid())
                OR session_notes.user_id = auth.uid()
            )
        )
    );

-- Специалист может создавать заметки
CREATE POLICY "session_notes_insert" ON public.session_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

-- Специалист может обновлять свои заметки
CREATE POLICY "session_notes_update_own" ON public.session_notes
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Специалист может удалять свои заметки
CREATE POLICY "session_notes_delete_own" ON public.session_notes
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Админы видят всё
CREATE POLICY "session_notes_admin_all" ON public.session_notes
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_coordinator());

-- USER_APPOINTMENT_TABS
ALTER TABLE public.user_appointment_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tabs_own" ON public.user_appointment_tabs
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 6. ТРИГГЕРЫ
-- ============================================

-- Триггер для recordings
DROP TRIGGER IF EXISTS update_recordings_updated_at ON public.recordings;
CREATE TRIGGER update_recordings_updated_at
    BEFORE UPDATE ON public.recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для session_notes
DROP TRIGGER IF EXISTS update_session_notes_updated_at ON public.session_notes;
CREATE TRIGGER update_session_notes_updated_at
    BEFORE UPDATE ON public.session_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ФУНКЦИИ ПОМОЩНИКИ
-- ============================================

-- Функция для получения комбинированного транскрипта с заметками
CREATE OR REPLACE FUNCTION public.get_combined_transcript(p_appointment_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_transcript TEXT;
    v_notes TEXT;
BEGIN
    -- Получаем транскрипт из appointments
    SELECT transcript INTO v_transcript
    FROM public.appointments
    WHERE id = p_appointment_id;

    -- Собираем все заметки
    SELECT string_agg(content, E'\n\n')
    INTO v_notes
    FROM public.session_notes
    WHERE appointment_id = p_appointment_id
    ORDER BY created_at;

    -- Комбинируем
    IF v_notes IS NOT NULL AND v_notes != '' THEN
        IF v_transcript IS NOT NULL AND v_transcript != '' THEN
            RETURN v_transcript || E'\n\n--- Комментарии специалиста ---\n\n' || v_notes;
        ELSE
            RETURN E'--- Комментарии специалиста ---\n\n' || v_notes;
        END IF;
    ELSE
        RETURN COALESCE(v_transcript, '');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для подсчёта контента сессии
CREATE OR REPLACE FUNCTION public.get_appointment_content_counts(p_appointment_id UUID)
RETURNS TABLE (
    recordings_count BIGINT,
    notes_count BIGINT,
    clinical_notes_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.recordings WHERE appointment_id = p_appointment_id AND deleted_at IS NULL),
        (SELECT COUNT(*) FROM public.session_notes WHERE appointment_id = p_appointment_id),
        (SELECT COUNT(*) FROM public.clinical_notes WHERE appointment_id = p_appointment_id AND deleted_at IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. STORAGE BUCKET ДЛЯ ЗАПИСЕЙ
-- ============================================

-- Создаём bucket для аудиозаписей (если не существует)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recordings',
    'recordings',
    false,
    104857600, -- 100MB
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Политики для storage bucket
DROP POLICY IF EXISTS "recordings_upload" ON storage.objects;
DROP POLICY IF EXISTS "recordings_download" ON storage.objects;
DROP POLICY IF EXISTS "recordings_delete" ON storage.objects;

-- Загрузка записей (только аутентифицированные)
CREATE POLICY "recordings_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'recordings');

-- Скачивание записей (только владелец или специалист консультации)
CREATE POLICY "recordings_download" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'recordings'
        AND (
            -- Проверяем через таблицу recordings
            EXISTS (
                SELECT 1 FROM public.recordings r
                JOIN public.appointments a ON a.id = r.appointment_id
                WHERE r.file_path = name
                AND (
                    r.user_id = auth.uid()
                    OR a.specialist_id = (SELECT id FROM public.specialists WHERE user_id = auth.uid())
                    OR public.is_admin()
                )
            )
            -- Или это админ/координатор
            OR public.is_admin()
            OR public.is_coordinator()
        )
    );

-- Удаление записей (только владелец)
CREATE POLICY "recordings_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'recordings'
        AND EXISTS (
            SELECT 1 FROM public.recordings r
            WHERE r.file_path = name
            AND r.user_id = auth.uid()
        )
    );

-- ============================================
-- 9. ГРАНТЫ
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recordings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_appointment_tabs TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_combined_transcript TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_appointment_content_counts TO authenticated;
