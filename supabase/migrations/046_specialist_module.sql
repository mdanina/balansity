-- ============================================
-- Balansity Migration: Specialist Module
-- Migration: 046_specialist_module
-- Description: Добавление модуля специалистов (ЛК специалиста)
-- ВАЖНО: Эта миграция НЕ изменяет существующие таблицы,
-- только добавляет новые и расширяет роли
-- ============================================

-- ============================================
-- 1. РАСШИРЯЕМ РОЛИ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================

-- Удаляем старый CHECK constraint и добавляем новый с ролью specialist
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('user', 'support', 'admin', 'super_admin', 'specialist', 'coordinator'));

COMMENT ON COLUMN public.users.role IS 'Роль пользователя: user (клиент), specialist (специалист), coordinator (координатор), support (поддержка), admin (администратор), super_admin (супер-администратор)';

-- ============================================
-- 2. СПРАВОЧНИК СПЕЦИАЛИЗАЦИЙ
-- ============================================

CREATE TABLE IF NOT EXISTS public.specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_specializations_code ON public.specializations(code);
CREATE INDEX IF NOT EXISTS idx_specializations_active ON public.specializations(is_active) WHERE is_active = true;

-- Базовые специализации
INSERT INTO public.specializations (code, name, description) VALUES
    ('psychologist', 'Психолог', 'Специалист по психологии, занимающийся консультированием и психотерапией'),
    ('psychiatrist', 'Психиатр', 'Врач, специализирующийся на диагностике и лечении психических расстройств'),
    ('psychotherapist', 'Психотерапевт', 'Специалист, использующий психологические методы для лечения'),
    ('clinical_psychologist', 'Клинический психолог', 'Психолог, работающий в клинических условиях'),
    ('child_psychologist', 'Детский психолог', 'Психолог, специализирующийся на работе с детьми'),
    ('family_therapist', 'Семейный терапевт', 'Специалист по семейной терапии'),
    ('neuropsychologist', 'Нейропсихолог', 'Специалист, изучающий связь между мозгом и поведением'),
    ('logopedist', 'Логопед', 'Специалист по коррекции речевых нарушений'),
    ('defectologist', 'Дефектолог', 'Специалист по работе с детьми с особенностями развития'),
    ('art_therapist', 'Арт-терапевт', 'Специалист, использующий искусство в терапии'),
    ('cbt_specialist', 'Специалист по КПТ', 'Специалист по когнитивно-поведенческой терапии'),
    ('coordinator', 'Координатор', 'Координатор платформы, проводит установочные встречи')
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE public.specializations IS 'Справочник специализаций специалистов платформы';

-- ============================================
-- 3. ТАБЛИЦА СПЕЦИАЛИСТОВ
-- ============================================

CREATE TABLE IF NOT EXISTS public.specialists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Публичная информация (видна клиентам)
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    experience_years INTEGER,

    -- Специализации (массив кодов)
    specialization_codes TEXT[] DEFAULT '{}',

    -- Контактная информация (для внутреннего использования)
    phone VARCHAR(50),

    -- Настройки
    is_available BOOLEAN DEFAULT true,
    accepts_new_clients BOOLEAN DEFAULT true,
    max_clients INTEGER DEFAULT 50,

    -- Рабочее время (JSONB для гибкости)
    -- Формат: {"mon": {"start": "09:00", "end": "18:00"}, "tue": {...}, ...}
    working_hours JSONB DEFAULT '{}',

    -- Стоимость консультации (если отличается от стандартной)
    hourly_rate NUMERIC(10, 2),

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Один пользователь = один профиль специалиста
    UNIQUE(user_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_specialists_user_id ON public.specialists(user_id);
CREATE INDEX IF NOT EXISTS idx_specialists_available ON public.specialists(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_specialists_specializations ON public.specialists USING GIN(specialization_codes);

COMMENT ON TABLE public.specialists IS 'Профили специалистов платформы. Связаны с users через user_id';
COMMENT ON COLUMN public.specialists.specialization_codes IS 'Массив кодов специализаций из таблицы specializations';
COMMENT ON COLUMN public.specialists.working_hours IS 'Рабочие часы в формате JSON: {"mon": {"start": "09:00", "end": "18:00"}, ...}';

-- ============================================
-- 4. НАЗНАЧЕНИЕ КЛИЕНТОВ СПЕЦИАЛИСТАМ
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Связи
    client_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,

    -- Тип назначения
    assignment_type VARCHAR(50) DEFAULT 'primary'
        CHECK (assignment_type IN ('primary', 'consultant', 'temporary')),

    -- Кто назначил (координатор/админ)
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Статус
    status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),

    -- Заметки координатора
    notes TEXT,

    -- Даты
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Один клиент может быть назначен одному специалисту только один раз (активно)
    -- Но может быть переназначен после завершения
    UNIQUE(client_user_id, specialist_id, status)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_client_assignments_client ON public.client_assignments(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_specialist ON public.client_assignments(specialist_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_status ON public.client_assignments(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_client_assignments_assigned_by ON public.client_assignments(assigned_by);

COMMENT ON TABLE public.client_assignments IS 'Назначение клиентов специалистам. Координатор/админ назначает клиента после установочной встречи';
COMMENT ON COLUMN public.client_assignments.assignment_type IS 'Тип: primary (основной специалист), consultant (консультант), temporary (временная замена)';

-- ============================================
-- 5. РАСШИРЯЕМ ТАБЛИЦУ APPOINTMENTS
-- ============================================

-- Добавляем связь с специалистом (опционально, для обратной совместимости)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS specialist_id UUID REFERENCES public.specialists(id) ON DELETE SET NULL;

-- Индекс для запросов специалиста
CREATE INDEX IF NOT EXISTS idx_appointments_specialist_id ON public.appointments(specialist_id);

COMMENT ON COLUMN public.appointments.specialist_id IS 'Специалист, проводящий консультацию. NULL для старых записей или координаторских встреч';

-- ============================================
-- 6. ФУНКЦИИ ПРОВЕРКИ РОЛЕЙ
-- ============================================

-- Проверка: является ли пользователь специалистом
CREATE OR REPLACE FUNCTION public.is_specialist()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'specialist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Проверка: является ли пользователь координатором
CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'coordinator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Проверка: может ли специалист видеть клиента
CREATE OR REPLACE FUNCTION public.specialist_can_access_client(p_client_user_id UUID)
RETURNS boolean AS $$
DECLARE
  v_specialist_id UUID;
BEGIN
  -- Получаем ID специалиста текущего пользователя
  SELECT id INTO v_specialist_id
  FROM public.specialists
  WHERE user_id = auth.uid();

  IF v_specialist_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Проверяем, назначен ли клиент этому специалисту
  RETURN EXISTS (
    SELECT 1 FROM public.client_assignments
    WHERE client_user_id = p_client_user_id
    AND specialist_id = v_specialist_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Получить ID специалиста текущего пользователя
CREATE OR REPLACE FUNCTION public.get_current_specialist_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.specialists
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_specialist() IS 'Проверяет, является ли текущий пользователь специалистом';
COMMENT ON FUNCTION public.is_coordinator() IS 'Проверяет, является ли текущий пользователь координатором';
COMMENT ON FUNCTION public.specialist_can_access_client(UUID) IS 'Проверяет, может ли специалист получить доступ к данным клиента';
COMMENT ON FUNCTION public.get_current_specialist_id() IS 'Возвращает ID специалиста для текущего пользователя';

-- ============================================
-- 7. RLS ПОЛИТИКИ ДЛЯ НОВЫХ ТАБЛИЦ
-- ============================================

-- Включаем RLS
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

-- SPECIALIZATIONS: все могут читать
CREATE POLICY "specializations_select_all" ON public.specializations
    FOR SELECT USING (true);

-- SPECIALIZATIONS: только админы могут изменять
CREATE POLICY "specializations_admin_all" ON public.specializations
    FOR ALL USING (public.is_admin());

-- SPECIALISTS: специалист видит свой профиль
CREATE POLICY "specialists_select_own" ON public.specialists
    FOR SELECT USING (user_id = auth.uid());

-- SPECIALISTS: специалист может редактировать свой профиль
CREATE POLICY "specialists_update_own" ON public.specialists
    FOR UPDATE USING (user_id = auth.uid());

-- SPECIALISTS: админы и координаторы видят всех специалистов
CREATE POLICY "specialists_select_staff" ON public.specialists
    FOR SELECT USING (public.is_admin() OR public.is_coordinator());

-- SPECIALISTS: админы могут всё
CREATE POLICY "specialists_admin_all" ON public.specialists
    FOR ALL USING (public.is_admin());

-- SPECIALISTS: клиенты видят своих назначенных специалистов
CREATE POLICY "specialists_select_assigned" ON public.specialists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_assignments ca
            WHERE ca.specialist_id = specialists.id
            AND ca.client_user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

-- CLIENT_ASSIGNMENTS: специалист видит свои назначения
CREATE POLICY "client_assignments_select_specialist" ON public.client_assignments
    FOR SELECT USING (
        specialist_id = public.get_current_specialist_id()
    );

-- CLIENT_ASSIGNMENTS: клиент видит свои назначения
CREATE POLICY "client_assignments_select_client" ON public.client_assignments
    FOR SELECT USING (client_user_id = auth.uid());

-- CLIENT_ASSIGNMENTS: координаторы и админы видят всё
CREATE POLICY "client_assignments_select_staff" ON public.client_assignments
    FOR SELECT USING (public.is_admin() OR public.is_coordinator());

-- CLIENT_ASSIGNMENTS: координаторы и админы могут создавать/изменять
CREATE POLICY "client_assignments_manage_staff" ON public.client_assignments
    FOR ALL USING (public.is_admin() OR public.is_coordinator());

-- ============================================
-- 8. ТРИГГЕР ОБНОВЛЕНИЯ updated_at
-- ============================================

-- Триггер для specializations
DROP TRIGGER IF EXISTS update_specializations_updated_at ON public.specializations;
CREATE TRIGGER update_specializations_updated_at
    BEFORE UPDATE ON public.specializations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для specialists
DROP TRIGGER IF EXISTS update_specialists_updated_at ON public.specialists;
CREATE TRIGGER update_specialists_updated_at
    BEFORE UPDATE ON public.specialists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для client_assignments
DROP TRIGGER IF EXISTS update_client_assignments_updated_at ON public.client_assignments;
CREATE TRIGGER update_client_assignments_updated_at
    BEFORE UPDATE ON public.client_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- ============================================

-- Функция для получения клиентов специалиста с информацией
CREATE OR REPLACE FUNCTION public.get_specialist_clients()
RETURNS TABLE (
    assignment_id UUID,
    client_user_id UUID,
    client_email TEXT,
    client_phone TEXT,
    client_region TEXT,
    assignment_type VARCHAR(50),
    assignment_status VARCHAR(50),
    assigned_at TIMESTAMPTZ,
    notes TEXT,
    -- Последняя активность
    last_appointment_at TIMESTAMPTZ,
    next_appointment_at TIMESTAMPTZ,
    -- Статистика
    total_appointments BIGINT,
    completed_appointments BIGINT
) AS $$
DECLARE
    v_specialist_id UUID;
BEGIN
    v_specialist_id := public.get_current_specialist_id();

    IF v_specialist_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        ca.id as assignment_id,
        ca.client_user_id,
        u.email as client_email,
        u.phone as client_phone,
        u.region as client_region,
        ca.assignment_type,
        ca.status as assignment_status,
        ca.assigned_at,
        ca.notes,
        -- Последняя консультация
        (SELECT MAX(a.scheduled_at)
         FROM public.appointments a
         WHERE a.user_id = ca.client_user_id
         AND a.specialist_id = v_specialist_id
         AND a.status = 'completed') as last_appointment_at,
        -- Следующая консультация
        (SELECT MIN(a.scheduled_at)
         FROM public.appointments a
         WHERE a.user_id = ca.client_user_id
         AND a.specialist_id = v_specialist_id
         AND a.status = 'scheduled'
         AND a.scheduled_at > NOW()) as next_appointment_at,
        -- Всего консультаций
        (SELECT COUNT(*)
         FROM public.appointments a
         WHERE a.user_id = ca.client_user_id
         AND a.specialist_id = v_specialist_id) as total_appointments,
        -- Проведённых консультаций
        (SELECT COUNT(*)
         FROM public.appointments a
         WHERE a.user_id = ca.client_user_id
         AND a.specialist_id = v_specialist_id
         AND a.status = 'completed') as completed_appointments
    FROM public.client_assignments ca
    JOIN public.users u ON u.id = ca.client_user_id
    WHERE ca.specialist_id = v_specialist_id
    AND ca.status = 'active'
    ORDER BY ca.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_specialist_clients() IS 'Возвращает список клиентов текущего специалиста с информацией о консультациях';

-- Функция для получения расписания специалиста
CREATE OR REPLACE FUNCTION public.get_specialist_appointments(
    p_from_date TIMESTAMPTZ DEFAULT NOW(),
    p_to_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
)
RETURNS TABLE (
    appointment_id UUID,
    client_user_id UUID,
    client_email TEXT,
    client_phone TEXT,
    scheduled_at TIMESTAMPTZ,
    status VARCHAR(50),
    appointment_type_name TEXT,
    video_room_url TEXT,
    notes TEXT
) AS $$
DECLARE
    v_specialist_id UUID;
BEGIN
    v_specialist_id := public.get_current_specialist_id();

    IF v_specialist_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        a.id as appointment_id,
        a.user_id as client_user_id,
        u.email as client_email,
        u.phone as client_phone,
        a.scheduled_at,
        a.status,
        at.name as appointment_type_name,
        a.video_room_url,
        a.notes
    FROM public.appointments a
    JOIN public.users u ON u.id = a.user_id
    LEFT JOIN public.appointment_types at ON at.id = a.appointment_type_id
    WHERE a.specialist_id = v_specialist_id
    AND a.scheduled_at >= p_from_date
    AND a.scheduled_at <= p_to_date
    ORDER BY a.scheduled_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_specialist_appointments(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Возвращает расписание консультаций специалиста за указанный период';

-- ============================================
-- 10. ГРАНТЫ
-- ============================================

GRANT SELECT ON public.specializations TO authenticated;
GRANT SELECT, UPDATE ON public.specialists TO authenticated;
GRANT SELECT ON public.client_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_specialist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coordinator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.specialist_can_access_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_specialist_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_specialist_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_specialist_appointments(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
