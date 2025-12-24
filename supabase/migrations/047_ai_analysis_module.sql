-- ============================================
-- Balansity Migration: AI Analysis Module
-- Migration: 047_ai_analysis_module
-- Description: Добавление модуля AI-анализа сессий
-- Перенос функционала из PsiPilot с адаптацией под Balansity
-- ============================================

-- ============================================
-- 1. ШАБЛОНЫ БЛОКОВ (NOTE_BLOCK_TEMPLATES)
-- ============================================
-- Библиотека блоков с system prompts для AI генерации
-- Каждый блок представляет секцию заметки (например, "Причина обращения")

CREATE TABLE IF NOT EXISTS public.note_block_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Базовая информация
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,

    -- AI настройки
    system_prompt TEXT NOT NULL,

    -- Флаги
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Порядок отображения
    position INTEGER DEFAULT 0,

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_note_block_templates_category ON public.note_block_templates(category);
CREATE INDEX IF NOT EXISTS idx_note_block_templates_active ON public.note_block_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_note_block_templates_slug ON public.note_block_templates(slug);

COMMENT ON TABLE public.note_block_templates IS 'Библиотека шаблонов блоков с промптами для AI генерации';
COMMENT ON COLUMN public.note_block_templates.slug IS 'URL-дружественный идентификатор';
COMMENT ON COLUMN public.note_block_templates.system_prompt IS 'Системный промпт для OpenAI/Claude при генерации контента блока';

-- ============================================
-- 2. ШАБЛОНЫ КЛИНИЧЕСКИХ ЗАМЕТОК
-- ============================================
-- Наборы блоков для генерации полной заметки

CREATE TABLE IF NOT EXISTS public.clinical_note_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Владелец шаблона (NULL = системный или общий)
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    -- Базовая информация
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,

    -- Состав шаблона (упорядоченный массив ID блоков)
    block_template_ids UUID[] NOT NULL,

    -- Флаги
    is_default BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_clinical_note_templates_user ON public.clinical_note_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_note_templates_active ON public.clinical_note_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_clinical_note_templates_default ON public.clinical_note_templates(is_default) WHERE is_default = true;

COMMENT ON TABLE public.clinical_note_templates IS 'Шаблоны клинических заметок, состоящие из набора блоков';
COMMENT ON COLUMN public.clinical_note_templates.block_template_ids IS 'Упорядоченный массив UUID блоков, входящих в шаблон';

-- ============================================
-- 3. КЛИНИЧЕСКИЕ ЗАМЕТКИ
-- ============================================
-- Сгенерированные заметки для сессий/консультаций

CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Связи
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Специалист, создавший заметку
    client_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,  -- Клиент
    template_id UUID REFERENCES public.clinical_note_templates(id) ON DELETE SET NULL,

    -- Базовая информация
    title VARCHAR(255) NOT NULL DEFAULT 'Клиническая заметка',
    note_type VARCHAR(50) DEFAULT 'session_note',

    -- Источник для анализа
    source_transcript TEXT,           -- Загруженный транскрипт
    source_audio_url TEXT,            -- URL загруженного аудио (если есть)
    source_notes TEXT,                -- Заметки специалиста
    source_hash VARCHAR(64),          -- Хеш исходных данных для детекции изменений

    -- AI-сгенерированное резюме
    ai_summary TEXT,
    ai_generated_at TIMESTAMPTZ,

    -- Статус генерации
    generation_status VARCHAR(20) DEFAULT 'draft'
        CHECK (generation_status IN ('draft', 'generating', 'completed', 'failed')),

    -- Статус документа
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_review', 'finalized', 'signed')),

    -- Soft delete
    deleted_at TIMESTAMPTZ,

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment ON public.clinical_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_user ON public.clinical_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_client ON public.clinical_notes(client_user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_status ON public.clinical_notes(status);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_generation_status ON public.clinical_notes(generation_status);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_deleted ON public.clinical_notes(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.clinical_notes IS 'AI-сгенерированные клинические заметки для консультаций';
COMMENT ON COLUMN public.clinical_notes.source_transcript IS 'Загруженный транскрипт сессии для AI анализа';
COMMENT ON COLUMN public.clinical_notes.source_audio_url IS 'URL загруженного аудио файла';

-- ============================================
-- 4. СЕКЦИИ КЛИНИЧЕСКИХ ЗАМЕТОК
-- ============================================
-- Отдельные секции (блоки) внутри заметки

CREATE TABLE IF NOT EXISTS public.clinical_note_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Связи
    clinical_note_id UUID NOT NULL REFERENCES public.clinical_notes(id) ON DELETE CASCADE,
    block_template_id UUID REFERENCES public.note_block_templates(id) ON DELETE SET NULL,

    -- Контент
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    content TEXT,              -- Отредактированный контент
    ai_content TEXT,           -- AI-сгенерированный контент
    ai_generated_at TIMESTAMPTZ,

    -- Статус генерации
    generation_status VARCHAR(20) DEFAULT 'pending'
        CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed', 'skipped')),
    generation_error TEXT,

    -- Порядок отображения
    position INTEGER DEFAULT 0,

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_sections_clinical_note ON public.clinical_note_sections(clinical_note_id);
CREATE INDEX IF NOT EXISTS idx_sections_block_template ON public.clinical_note_sections(block_template_id);
CREATE INDEX IF NOT EXISTS idx_sections_status ON public.clinical_note_sections(generation_status);

COMMENT ON TABLE public.clinical_note_sections IS 'Секции клинической заметки, каждая соответствует блоку шаблона';

-- ============================================
-- 5. RLS ПОЛИТИКИ
-- ============================================

ALTER TABLE public.note_block_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_note_sections ENABLE ROW LEVEL SECURITY;

-- NOTE_BLOCK_TEMPLATES: все аутентифицированные могут читать
CREATE POLICY "note_block_templates_select_all" ON public.note_block_templates
    FOR SELECT TO authenticated USING (is_active = true);

-- NOTE_BLOCK_TEMPLATES: только админы могут изменять
CREATE POLICY "note_block_templates_admin_all" ON public.note_block_templates
    FOR ALL TO authenticated USING (public.is_admin());

-- CLINICAL_NOTE_TEMPLATES: все могут читать системные и свои
CREATE POLICY "clinical_note_templates_select" ON public.clinical_note_templates
    FOR SELECT TO authenticated
    USING (
        is_system = true
        OR user_id = auth.uid()
        OR user_id IS NULL
    );

-- CLINICAL_NOTE_TEMPLATES: пользователи могут создавать свои шаблоны
CREATE POLICY "clinical_note_templates_insert" ON public.clinical_note_templates
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND is_system = false);

-- CLINICAL_NOTE_TEMPLATES: пользователи могут редактировать свои шаблоны
CREATE POLICY "clinical_note_templates_update" ON public.clinical_note_templates
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() AND is_system = false);

-- CLINICAL_NOTE_TEMPLATES: пользователи могут удалять свои шаблоны
CREATE POLICY "clinical_note_templates_delete" ON public.clinical_note_templates
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() AND is_system = false);

-- CLINICAL_NOTE_TEMPLATES: админы могут всё
CREATE POLICY "clinical_note_templates_admin_all" ON public.clinical_note_templates
    FOR ALL TO authenticated USING (public.is_admin());

-- CLINICAL_NOTES: специалист видит и редактирует свои заметки
CREATE POLICY "clinical_notes_select_own" ON public.clinical_notes
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "clinical_notes_insert_own" ON public.clinical_notes
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "clinical_notes_update_own" ON public.clinical_notes
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() AND status NOT IN ('finalized', 'signed'));

CREATE POLICY "clinical_notes_delete_own" ON public.clinical_notes
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() AND status NOT IN ('finalized', 'signed'));

-- CLINICAL_NOTES: админы и координаторы могут всё
CREATE POLICY "clinical_notes_admin_all" ON public.clinical_notes
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_coordinator());

-- CLINICAL_NOTE_SECTIONS: через родительскую заметку
CREATE POLICY "sections_via_note" ON public.clinical_note_sections
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clinical_notes cn
            WHERE cn.id = clinical_note_sections.clinical_note_id
            AND (cn.user_id = auth.uid() OR public.is_admin() OR public.is_coordinator())
        )
    );

-- ============================================
-- 6. ТРИГГЕРЫ
-- ============================================

-- Триггер для note_block_templates
DROP TRIGGER IF EXISTS update_note_block_templates_updated_at ON public.note_block_templates;
CREATE TRIGGER update_note_block_templates_updated_at
    BEFORE UPDATE ON public.note_block_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для clinical_note_templates
DROP TRIGGER IF EXISTS update_clinical_note_templates_updated_at ON public.clinical_note_templates;
CREATE TRIGGER update_clinical_note_templates_updated_at
    BEFORE UPDATE ON public.clinical_note_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для clinical_notes
DROP TRIGGER IF EXISTS update_clinical_notes_updated_at ON public.clinical_notes;
CREATE TRIGGER update_clinical_notes_updated_at
    BEFORE UPDATE ON public.clinical_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для clinical_note_sections
DROP TRIGGER IF EXISTS update_sections_updated_at ON public.clinical_note_sections;
CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON public.clinical_note_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. SEED DATA - СИСТЕМНЫЕ ШАБЛОНЫ БЛОКОВ
-- ============================================

-- 1. Причина обращения
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Причина обращения',
    'Contact Reason',
    'contact_reason',
    'Основная причина, по которой клиент обратился за помощью',
    'assessment',
    'Ты — опытный психолог. На основе транскрипта сессии сформулируй причину обращения клиента.
Напиши 2-4 предложения, описывающие:
- Почему клиент обратился за помощью
- Основные жалобы
- Как долго существует проблема
- Что послужило триггером обращения

Пиши от третьего лица ("Клиент обратился...", "Клиент сообщает...").
Используй профессиональный язык, но избегай излишнего жаргона.',
    true,
    1
) ON CONFLICT (slug) DO NOTHING;

-- 2. История настоящего состояния
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'История настоящего состояния',
    'History of Present Condition',
    'history_present',
    'Развитие текущих симптомов и их характеристики',
    'history',
    'Ты — опытный психолог. На основе транскрипта сессии опиши историю настоящего состояния клиента.
Включи:
- Хронологию развития симптомов
- Характер и выраженность симптомов
- Провоцирующие и облегчающие факторы
- Влияние на повседневную жизнь
- Предыдущие попытки справиться с проблемой

Пиши структурированно, от третьего лица. Длина: 1-2 абзаца.',
    true,
    2
) ON CONFLICT (slug) DO NOTHING;

-- 3. Психологический анамнез
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Психологический анамнез',
    'Psychological History',
    'psych_history',
    'Предыдущий опыт работы с психологом, терапия',
    'history',
    'Ты — опытный психолог. На основе транскрипта сессии опиши психологический анамнез клиента.
Включи (если информация доступна):
- Предыдущий опыт психотерапии
- Методы и подходы, которые использовались ранее
- Результаты предыдущей работы
- Причины завершения предыдущей терапии (если была)

Если информация не упоминается, напиши "Информация не предоставлена" или "Отрицает".
Пиши от третьего лица.',
    true,
    3
) ON CONFLICT (slug) DO NOTHING;

-- 4. Семейная история
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Семейная история',
    'Family History',
    'family_history',
    'Семейный контекст, отношения, значимые события',
    'history',
    'Ты — опытный психолог. На основе транскрипта сессии опиши семейную историю клиента.
Включи:
- Состав семьи
- Характер отношений с членами семьи
- Значимые семейные события
- Психологические проблемы в семье (если упоминаются)

Если информация не упоминается, напиши "Информация не предоставлена".
Пиши от третьего лица.',
    true,
    4
) ON CONFLICT (slug) DO NOTHING;

-- 5. Социальный анамнез
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Социальный анамнез',
    'Social History',
    'social_history',
    'Образование, работа, отношения, условия жизни',
    'history',
    'Ты — опытный психолог. На основе транскрипта сессии опиши социальный анамнез клиента.
Включи:
- Образование
- Текущая занятость / профессия
- Семейное положение и отношения
- Условия проживания
- Социальная поддержка
- Значимые жизненные события

Пиши от третьего лица, структурированно.',
    true,
    5
) ON CONFLICT (slug) DO NOTHING;

-- 6. Текущее эмоциональное состояние
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Текущее эмоциональное состояние',
    'Current Emotional State',
    'emotional_state',
    'Оценка эмоционального состояния на момент сессии',
    'status',
    'Ты — опытный психолог. На основе транскрипта сессии опиши текущее эмоциональное состояние клиента.
Оцени:
- Преобладающие эмоции
- Настроение (со слов клиента)
- Аффект (наблюдаемый)
- Уровень тревожности
- Наличие депрессивных симптомов

Пиши от третьего лица.',
    true,
    6
) ON CONFLICT (slug) DO NOTHING;

-- 7. Ресурсы и сильные стороны
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Ресурсы и сильные стороны',
    'Resources and Strengths',
    'resources',
    'Ресурсы клиента, сильные стороны, опоры',
    'assessment',
    'Ты — опытный психолог. На основе транскрипта сессии опиши ресурсы и сильные стороны клиента.
Включи:
- Внутренние ресурсы (личностные качества, навыки)
- Внешние ресурсы (поддержка, отношения)
- Увлечения и интересы
- Способы совладания со стрессом

Пиши позитивно и конструктивно, от третьего лица.',
    true,
    7
) ON CONFLICT (slug) DO NOTHING;

-- 8. Цели терапии
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Цели терапии',
    'Therapy Goals',
    'therapy_goals',
    'Цели и ожидания от работы',
    'treatment',
    'Ты — опытный психолог. На основе транскрипта сессии сформулируй цели терапии.
Включи:
- Краткосрочные цели (на ближайшие сессии)
- Долгосрочные цели
- Ожидания клиента от работы
- Критерии успеха

Формулируй конкретно и измеримо, где возможно. Пиши от третьего лица.',
    true,
    8
) ON CONFLICT (slug) DO NOTHING;

-- 9. Рекомендации
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Рекомендации',
    'Recommendations',
    'recommendations',
    'Рекомендации по дальнейшей работе',
    'conclusion',
    'Ты — опытный психолог. На основе транскрипта сессии сформулируй рекомендации.

1. План работы:
   - Предлагаемый подход/метод
   - Рекомендуемая частота сессий

2. Домашние задания (если применимо)

3. Направления для проработки

Пиши профессионально, от третьего лица.',
    true,
    9
) ON CONFLICT (slug) DO NOTHING;

-- 10. Краткое резюме сессии
INSERT INTO public.note_block_templates (name, name_en, slug, description, category, system_prompt, is_system, position)
VALUES (
    'Краткое резюме сессии',
    'Session Summary',
    'session_summary',
    'Краткое резюме основных моментов сессии',
    'conclusion',
    'Ты — опытный психолог. Напиши краткое резюме сессии (3-5 предложений).
Включи:
- Основные темы, которые обсуждались
- Ключевые инсайты
- Достигнутые договорённости
- План на следующую сессию

Пиши ёмко и информативно, от третьего лица.',
    true,
    10
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 8. СИСТЕМНЫЙ ШАБЛОН ЗАМЕТКИ
-- ============================================

INSERT INTO public.clinical_note_templates (
    name,
    name_en,
    description,
    block_template_ids,
    is_default,
    is_system
)
SELECT
    'Первичная консультация',
    'Initial Consultation',
    'Шаблон для первичной консультации с клиентом',
    ARRAY_AGG(id ORDER BY position),
    true,
    true
FROM public.note_block_templates
WHERE is_system = true
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. ГРАНТЫ
-- ============================================

GRANT SELECT ON public.note_block_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_note_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_note_sections TO authenticated;
