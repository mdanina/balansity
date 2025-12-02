-- ============================================
-- Функции для подсчета баллов и генерации результатов
-- ============================================

-- ============================================
-- 1. Функция подсчета баллов для Checkup (SDQ-подобный)
-- ============================================
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
  select coalesce(sum(value), 0) into emotional_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 1 and 5
    and answer_type = 'default';
  
  -- Вопросы 6-10: Проблемы поведения
  select coalesce(sum(value), 0) into conduct_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 6 and 10
    and answer_type = 'default';
  
  -- Вопросы 11-15: Гиперактивность/Невнимательность
  select coalesce(sum(value), 0) into hyperactivity_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 11 and 15
    and answer_type = 'default';
  
  -- Вопросы 16-21: Проблемы со сверстниками
  select coalesce(sum(value), 0) into peer_problems_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 16 and 21
    and answer_type = 'default';
  
  -- Вопросы 7, 14, 15, 20, 21: Просоциальное поведение (обратная шкала)
  -- Для этих вопросов: 0=4, 1=3, 2=2, 3=1, 4=0
  select coalesce(sum(case value
    when 0 then 4
    when 1 then 3
    when 2 then 2
    when 3 then 1
    when 4 then 0
    else 0
  end), 0) into prosocial_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (7, 14, 15, 20, 21)
    and answer_type = 'default';
  
  -- Вопросы 22-31: Влияние (impact)
  select coalesce(sum(value), 0) into impact_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id between 22 and 31
    and answer_type = 'impact';
  
  -- Определение статуса по баллам
  -- Пороговые значения можно настроить в зависимости от возраста и пола
  result := jsonb_build_object(
    'emotional', jsonb_build_object(
      'score', emotional_score,
      'status', case
        when emotional_score >= 5 then 'concerning'
        when emotional_score >= 3 then 'borderline'
        else 'typical'
      end
    ),
    'conduct', jsonb_build_object(
      'score', conduct_score,
      'status', case
        when conduct_score >= 4 then 'concerning'
        when conduct_score >= 3 then 'borderline'
        else 'typical'
      end
    ),
    'hyperactivity', jsonb_build_object(
      'score', hyperactivity_score,
      'status', case
        when hyperactivity_score >= 6 then 'concerning'
        when hyperactivity_score >= 5 then 'borderline'
        else 'typical'
      end
    ),
    'peer_problems', jsonb_build_object(
      'score', peer_problems_score,
      'status', case
        when peer_problems_score >= 4 then 'concerning'
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

-- ============================================
-- 2. Функция для завершения оценки и расчета результатов
-- ============================================
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
  else
    -- Для других типов можно добавить свои функции
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

-- ============================================
-- 3. Функция для получения активной оценки
-- ============================================
create or replace function get_active_assessment(
  p_profile_id uuid,
  p_assessment_type text
)
returns uuid as $$
declare
  assessment_id uuid;
begin
  -- Ищем активную оценку
  select id into assessment_id
  from public.assessments
  where profile_id = p_profile_id
    and assessment_type = p_assessment_type
    and status = 'in_progress'
  order by created_at desc
  limit 1;
  
  -- Если нет активной, создаем новую
  if assessment_id is null then
    insert into public.assessments (profile_id, assessment_type, status, current_step)
    values (p_profile_id, p_assessment_type, 'in_progress', 1)
    returning id into assessment_id;
  end if;
  
  return assessment_id;
end;
$$ language plpgsql security definer;








