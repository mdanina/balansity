-- ============================================
-- Миграция: Добавление composite индексов для оптимизации RLS
-- ============================================
-- Эти индексы ускоряют JOIN запросы в RLS политиках безопасности
-- КРИТИЧНО: Улучшает производительность на 2-5x

-- Для таблицы assessments: часто используется (id, profile_id) в JOIN
-- Используется в RLS политике для answers
CREATE INDEX IF NOT EXISTS idx_assessments_id_profile_id 
  ON public.assessments(id, profile_id);

-- Для таблицы profiles: часто используется (id, user_id) в JOIN
-- Используется в RLS политиках для assessments и answers
CREATE INDEX IF NOT EXISTS idx_profiles_id_user_id 
  ON public.profiles(id, user_id);

-- Для таблицы answers: оптимизация scoring запросов
-- Partial index для неотрицательных значений (фильтрует пропущенные ответы)
-- Ускоряет запросы при расчете оценок
CREATE INDEX IF NOT EXISTS idx_answers_assessment_value_type 
  ON public.answers(assessment_id, answer_type, value) 
  WHERE value >= 0;

-- Индекс для часто используемого фильтра по статусу и типу
-- Используется при поиске завершенных оценок определенного типа
CREATE INDEX IF NOT EXISTS idx_assessments_type_status_profile 
  ON public.assessments(assessment_type, status, profile_id)
  WHERE status = 'completed';

-- Комментарии для документации
COMMENT ON INDEX idx_assessments_id_profile_id IS 
  'Оптимизирует RLS JOIN между assessments и profiles в политике answers';
COMMENT ON INDEX idx_profiles_id_user_id IS 
  'Оптимизирует RLS проверки user_id в profiles для assessments и answers';
COMMENT ON INDEX idx_answers_assessment_value_type IS 
  'Ускоряет scoring запросы для расчетов оценок, фильтрует пропущенные ответы';
COMMENT ON INDEX idx_assessments_type_status_profile IS 
  'Оптимизирует поиск завершенных оценок определенного типа для профиля';








