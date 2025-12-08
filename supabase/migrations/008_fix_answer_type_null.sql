-- ============================================
-- Исправление: учитываем answer_type IS NULL для обратной совместимости
-- ============================================

-- Обновляем функцию calculate_checkup_scores
-- Теперь учитываем как 'default', так и NULL (для старых записей)
create or replace function calculate_checkup_scores(assessment_uuid uuid)
returns jsonb as $$
declare
  result jsonb;
  emotional_score int := 0;
  conduct_score int := 0;
  hyperactivity_score int := 0;
  peer_problems_score int := 0;
  prosocial_score int := 0;
  impact_score int := 0;
begin
  -- Подсчет баллов по категориям
  -- Вопросы 1-5: Эмоциональные проблемы
  -- Исключаем пропущенные вопросы (value = -1)
  -- Учитываем как 'default', так и NULL (для обратной совместимости)
  select coalesce(sum(value), 0) into emotional_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 1 and 5
    and (answer_type = 'default' OR answer_type IS NULL)
    and value >= 0; -- Исключаем пропущенные вопросы
  
  -- Вопросы 6-10: Проблемы поведения
  -- Вопрос 7 - обратный, но reverse scoring уже применен при сохранении
  select coalesce(sum(value), 0) into conduct_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 6 and 10
    and (answer_type = 'default' OR answer_type IS NULL)
    and value >= 0; -- Исключаем пропущенные вопросы
  
  -- Вопросы 11-15: Гиперактивность/Невнимательность
  -- Вопросы 14, 15 - обратные, но reverse scoring уже применен при сохранении
  select coalesce(sum(value), 0) into hyperactivity_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 11 and 15
    and (answer_type = 'default' OR answer_type IS NULL)
    and value >= 0; -- Исключаем пропущенные вопросы
  
  -- Вопросы 16-21: Проблемы со сверстниками
  -- Вопросы 16, 17, 20, 21 - обратные, но reverse scoring уже применен при сохранении
  select coalesce(sum(value), 0) into peer_problems_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 16 and 21
    and (answer_type = 'default' OR answer_type IS NULL)
    and value >= 0; -- Исключаем пропущенные вопросы
  
  -- Вопросы 7, 14, 15, 20, 21: Просоциальное поведение
  -- Теперь просто суммируем, т.к. reverse scoring уже применен
  select coalesce(sum(value), 0) into prosocial_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (7, 14, 15, 20, 21)
    and (answer_type = 'default' OR answer_type IS NULL)
    and value >= 0; -- Исключаем пропущенные вопросы
  
  -- Вопросы 22-31: Влияние (impact)
  select coalesce(sum(value), 0) into impact_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 22 and 31
    and answer_type = 'impact'
    and value >= 0; -- Исключаем пропущенные вопросы
  
  -- Определение статуса по баллам
  -- Пороговые значения для РФ (Russian Federation thresholds)
  result := jsonb_build_object(
    'emotional', jsonb_build_object(
      'score', emotional_score,
      'status', case
        when emotional_score >= 5 then 'concerning'  -- Порог для РФ: ≥ 5
        when emotional_score >= 3 then 'borderline'
        else 'typical'
      end
    ),
    'conduct', jsonb_build_object(
      'score', conduct_score,
      'status', case
        when conduct_score >= 4 then 'concerning'  -- Порог для РФ: ≥ 4
        when conduct_score >= 3 then 'borderline'
        else 'typical'
      end
    ),
    'hyperactivity', jsonb_build_object(
      'score', hyperactivity_score,
      'status', case
        when hyperactivity_score >= 7 then 'concerning'  -- Порог для РФ: ≥ 7
        when hyperactivity_score >= 5 then 'borderline'
        else 'typical'
      end
    ),
    'peer_problems', jsonb_build_object(
      'score', peer_problems_score,
      'status', case
        when peer_problems_score >= 4 then 'concerning'  -- Порог для РФ: ≥ 4
        when peer_problems_score >= 3 then 'borderline'
        else 'typical'
      end
    ),
    'prosocial', jsonb_build_object(
      'score', prosocial_score,
      'status', case
        when prosocial_score <= 4 then 'concerning'
        when prosocial_score <= 5 then 'borderline'
        else 'typical'
      end
    ),
    'impact', jsonb_build_object(
      'score', impact_score,
      'status', case
        when impact_score >= 2 then 'high_impact'
        when impact_score >= 1 then 'medium_impact'
        else 'low_impact'
      end
    ),
    'total_difficulties', emotional_score + conduct_score + hyperactivity_score + peer_problems_score,
    'calculated_at', now()
  );
  
  return result;
end;
$$ language plpgsql security definer;











