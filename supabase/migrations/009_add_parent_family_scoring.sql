-- ============================================
-- Функции расчета результатов для parent и family оценок
-- ============================================

-- Функция расчета результатов для parent оценки
create or replace function calculate_parent_scores(assessment_uuid uuid)
returns jsonb as $$
declare
  result jsonb;
  anxiety_score int := 0;
  depression_score int := 0;
  total_score int := 0;
begin
  -- Вопросы 2-3: Тревожность (anxiety)
  -- Исключаем пропущенные вопросы (value = -1)
  select coalesce(sum(value), 0) into anxiety_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 2 and 3
    and answer_type = 'frequency'
    and value >= 0;
  
  -- Вопросы 4-5: Депрессия (depression)
  select coalesce(sum(value), 0) into depression_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 4 and 5
    and answer_type = 'frequency'
    and value >= 0;
  
  total_score := anxiety_score + depression_score;
  
  -- Определение статуса
  -- Пороговые значения для тревожности и депрессии (PHQ-4 подобная шкала)
  result := jsonb_build_object(
    'anxiety', jsonb_build_object(
      'score', anxiety_score,
      'status', case
        when anxiety_score >= 6 then 'concerning'  -- Высокий уровень тревожности
        when anxiety_score >= 3 then 'borderline'  -- Умеренный уровень
        else 'typical'  -- Низкий уровень
      end
    ),
    'depression', jsonb_build_object(
      'score', depression_score,
      'status', case
        when depression_score >= 6 then 'concerning'  -- Высокий уровень депрессии
        when depression_score >= 3 then 'borderline'  -- Умеренный уровень
        else 'typical'  -- Низкий уровень
      end
    ),
    'total', jsonb_build_object(
      'score', total_score,
      'status', case
        when total_score >= 10 then 'concerning'  -- Высокий общий уровень
        when total_score >= 6 then 'borderline'  -- Умеренный уровень
        else 'typical'  -- Низкий уровень
      end
    ),
    'calculated_at', now()
  );
  
  return result;
end;
$$ language plpgsql security definer;

-- Функция расчета результатов для family оценки
create or replace function calculate_family_scores(assessment_uuid uuid)
returns jsonb as $$
declare
  result jsonb;
  family_stress_score int := 0;
  partner_relationship_score int := 0;
  coparenting_score int := 0;
  wellbeing_value int := 0;
  relationship_value int := 0;
  arguments_value int := 0;
  coparenting_together_value int := 0;
  coparenting_arguments_value int := 0;
begin
  -- Вопрос 1: Благополучие семьи (wellbeing) - 0-4, чем выше, тем хуже
  select coalesce(value, 0) into wellbeing_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 1
    and answer_type = 'wellbeing'
    and value >= 0
  limit 1;
  
  family_stress_score := wellbeing_value;
  
  -- Вопрос 2: Отношения с партнером (relationship) - 0-6, но 6 = "Не применимо"
  -- Обратная шкала: 0 = "Все время" (лучше), 5 = "Никогда" (хуже)
  select coalesce(value, 0) into relationship_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 2
    and answer_type = 'relationship'
    and value >= 0
    and value < 6  -- Исключаем "Не применимо"
  limit 1;
  
  -- Преобразуем: 0=0, 1=1, 2=2, 3=3, 4=4, 5=5 (чем выше, тем хуже)
  partner_relationship_score := relationship_value;
  
  -- Вопрос 3: Частота ссор (frequency) - 0-6, но 6 = "Не применимо"
  -- Чем выше значение, тем чаще ссоры (хуже)
  select coalesce(value, 0) into arguments_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 3
    and answer_type = 'frequency'
    and value >= 0
    and value < 6  -- Исключаем "Не применимо"
  limit 1;
  
  -- Вопрос 4: Совместное воспитание (frequency) - 0-6, но 6 = "Не применимо"
  -- Обратная шкала: 0 = "Все время" (лучше), 5 = "Никогда" (хуже)
  select coalesce(value, 0) into coparenting_together_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 4
    and answer_type = 'frequency'
    and value >= 0
    and value < 6  -- Исключаем "Не применимо"
  limit 1;
  
  -- Преобразуем обратную шкалу: 0=5, 1=4, 2=3, 3=2, 4=1, 5=0
  -- (чем выше исходное значение, тем хуже совместное воспитание)
  coparenting_score := 5 - coparenting_together_value;
  
  -- Вопрос 5: Споры о воспитании (frequency) - 0-6, но 6 = "Не применимо"
  -- Чем выше значение, тем чаще споры (хуже)
  select coalesce(value, 0) into coparenting_arguments_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 5
    and answer_type = 'frequency'
    and value >= 0
    and value < 6  -- Исключаем "Не применимо"
  limit 1;
  
  -- Общий балл совместного воспитания (чем выше, тем хуже)
  coparenting_score := coparenting_score + coparenting_arguments_value;
  
  -- Определение статуса
  result := jsonb_build_object(
    'family_stress', jsonb_build_object(
      'score', family_stress_score,
      'status', case
        when family_stress_score >= 3 then 'concerning'  -- Высокий стресс
        when family_stress_score >= 2 then 'borderline'  -- Умеренный стресс
        else 'typical'  -- Низкий стресс
      end
    ),
    'partner_relationship', jsonb_build_object(
      'score', partner_relationship_score,
      'status', case
        when partner_relationship_score >= 4 then 'concerning'  -- Плохие отношения
        when partner_relationship_score >= 3 then 'borderline'  -- Умеренные проблемы
        else 'typical'  -- Хорошие отношения
      end
    ),
    'coparenting', jsonb_build_object(
      'score', coparenting_score,
      'status', case
        when coparenting_score >= 7 then 'concerning'  -- Плохое совместное воспитание
        when coparenting_score >= 5 then 'borderline'  -- Умеренные проблемы
        else 'typical'  -- Хорошее совместное воспитание
      end
    ),
    'calculated_at', now()
  );
  
  return result;
end;
$$ language plpgsql security definer;

-- Обновляем функцию complete_assessment для использования новых функций расчета
create or replace function complete_assessment(assessment_uuid uuid)
returns jsonb as $$
declare
  assessment_type text;
  results jsonb;
begin
  -- Получаем тип оценки
  select a.assessment_type into assessment_type
  from public.assessments a
  where a.id = assessment_uuid;
  
  -- Рассчитываем результаты в зависимости от типа
  if assessment_type = 'checkup' then
    results := calculate_checkup_scores(assessment_uuid);
  elsif assessment_type = 'parent' then
    results := calculate_parent_scores(assessment_uuid);
  elsif assessment_type = 'family' then
    results := calculate_family_scores(assessment_uuid);
  else
    -- Для неизвестных типов
    results := jsonb_build_object('status', 'completed');
  end if;
  
  -- Обновляем оценку
  update public.assessments
  set 
    status = 'completed',
    results_summary = results,
    completed_at = now(),
    updated_at = now()
  where id = assessment_uuid;
  
  return results;
end;
$$ language plpgsql security definer;

