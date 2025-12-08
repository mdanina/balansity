-- ============================================
-- Исправление значений ответов для семейного опросника
-- и пересчет всех завершенных family assessments
-- ============================================
-- 
-- Изменения в логике reverse scoring:
-- Старая логика: вопросы 2 и 4 были обратными
-- Новая логика: вопросы 3 и 5 стали обратными
--
-- Нужно исправить значения в таблице answers:
-- - Вопрос 2: был обратным, теперь прямой -> инвертировать обратно (5 - value)
-- - Вопрос 3: был прямым, теперь обратный -> инвертировать (5 - value)
-- - Вопрос 4: был обратным, теперь прямой -> инвертировать обратно (5 - value)
-- - Вопрос 5: был прямым, теперь обратный -> инвертировать (5 - value)

-- Исправляем значения для вопроса 2 (был обратным, теперь прямой)
-- Инвертируем обратно: если было сохранено как инвертированное, возвращаем исходное
update public.answers
set value = case
    when value >= 0 and value <= 5 then 5 - value
    else value  -- Оставляем -1 (пропущено) и 6 (не применимо) без изменений
  end,
  updated_at = now()
where question_id = 2
  and answer_type = 'relationship'
  and assessment_id in (
    select id from public.assessments
    where assessment_type = 'family'
  )
  and value >= 0 and value <= 5;  -- Инвертируем только валидные значения 0-5

-- Исправляем значения для вопроса 3 (был прямым, теперь обратный)
-- Инвертируем: применяем reverse scoring
update public.answers
set value = case
    when value >= 0 and value <= 5 then 5 - value
    else value  -- Оставляем -1 (пропущено) и 6 (не применимо) без изменений
  end,
  updated_at = now()
where question_id = 3
  and answer_type = 'frequency'
  and assessment_id in (
    select id from public.assessments
    where assessment_type = 'family'
  )
  and value >= 0 and value <= 5;  -- Инвертируем только валидные значения 0-5

-- Исправляем значения для вопроса 4 (был обратным, теперь прямой)
-- Инвертируем обратно: если было сохранено как инвертированное, возвращаем исходное
update public.answers
set value = case
    when value >= 0 and value <= 5 then 5 - value
    else value  -- Оставляем -1 (пропущено) и 6 (не применимо) без изменений
  end,
  updated_at = now()
where question_id = 4
  and answer_type = 'frequency'
  and assessment_id in (
    select id from public.assessments
    where assessment_type = 'family'
  )
  and value >= 0 and value <= 5;  -- Инвертируем только валидные значения 0-5

-- Исправляем значения для вопроса 5 (был прямым, теперь обратный)
-- Инвертируем: применяем reverse scoring
update public.answers
set value = case
    when value >= 0 and value <= 5 then 5 - value
    else value  -- Оставляем -1 (пропущено) и 6 (не применимо) без изменений
  end,
  updated_at = now()
where question_id = 5
  and answer_type = 'frequency'
  and assessment_id in (
    select id from public.assessments
    where assessment_type = 'family'
  )
  and value >= 0 and value <= 5;  -- Инвертируем только валидные значения 0-5

-- Пересчитываем все завершенные family оценки с исправленными значениями
update public.assessments
set 
  results_summary = calculate_family_scores(id),
  updated_at = now()
where id in (
  select id from public.assessments
  where assessment_type = 'family'
    and status = 'completed'
  for update skip locked
);









