-- ============================================
-- Исправление обратных шкал для семейного опросника
-- Вопрос 2 - прямая, вопрос 3 - обратная
-- Вопрос 4 - прямая, вопрос 5 - обратная
-- ============================================

create or replace function calculate_family_scores(assessment_uuid uuid)
returns jsonb as $$
declare
  result jsonb;
  family_stress_score int := 0;         -- Вопрос 1 (в коде id=1)
  partner_relationship_score int := 0;  -- Вопросы 2 (прямая), 3 (обратная)
  coparenting_score int := 0;           -- Вопросы 4 (прямая), 5 (обратная)
  
  -- Значения отдельных вопросов
  wellbeing_value int := 0;      -- Вопрос 1 (в коде id=1)
  relationship_value int := 0;   -- Вопрос 2 (в коде id=2, прямая)
  arguments_value int := 0;      -- Вопрос 3 (в коде id=3, обратная)
  coparenting_together_value int := 0;  -- Вопрос 4 (в коде id=4, прямая)
  coparenting_arguments_value int := 0; -- Вопрос 5 (в коде id=5, обратная)
begin
  -- 4.6.1. Семейный стресс: вопрос 1
  -- В коде: id=1 - "Как дела у вашей семьи?"
  -- Максимум: 4. Пороговое значение: 3 и выше (60% от максимума, округлено вверх)
  select coalesce(value, 0) into wellbeing_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 1
    and answer_type = 'wellbeing'
    and value >= 0
  limit 1;
  
  family_stress_score := coalesce(wellbeing_value, 0);
  
  -- 4.6.2. Отношения с партнёром: вопросы 2 (прямая), 3 (обратная)
  -- В коде: id=2 (прямая), id=3 (обратная)
  -- Reverse scoring уже применен при сохранении для id=3
  select coalesce(value, 0) into relationship_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 2
    and answer_type = 'relationship'
    and value >= 0
    and value < 6  -- Исключаем "Не применимо"
  limit 1;
  
  select coalesce(value, 0) into arguments_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 3
    and answer_type = 'frequency'
    and value >= 0
    and value < 6  -- Исключаем "Не применимо"
  limit 1;
  
  partner_relationship_score := coalesce(relationship_value, 0) + coalesce(arguments_value, 0);
  
  -- 4.6.3. Совместное родительство: вопросы 4 (прямая), 5 (обратная)
  -- В коде: id=4 (прямая), id=5 (обратная)
  -- Reverse scoring уже применен при сохранении для id=5
  select coalesce(value, 0) into coparenting_together_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 4
    and answer_type = 'frequency'
    and value >= 0
    and value < 6  -- Исключаем "Не применимо"
  limit 1;
  
  select coalesce(value, 0) into coparenting_arguments_value
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 5
    and answer_type = 'frequency'
    and value >= 0
    and value < 6  -- Исключаем "Не применимо"
  limit 1;
  
  coparenting_score := coalesce(coparenting_together_value, 0) + coalesce(coparenting_arguments_value, 0);
  
  -- Определение статуса
  result := jsonb_build_object(
    'family_stress', jsonb_build_object(
      'score', family_stress_score,
      'status', case
        when family_stress_score >= 3 then 'concerning'  -- Требует внимания (60% от максимума 4)
        else 'typical'  -- Типично (норма)
      end
    ),
    'partner_relationship', jsonb_build_object(
      'score', partner_relationship_score,
      'status', case
        when partner_relationship_score >= 6 then 'concerning'  -- Требует внимания (60% от максимума 10)
        else 'typical'  -- Типично (норма)
      end
    ),
    'coparenting', jsonb_build_object(
      'score', coparenting_score,
      'status', case
        when coparenting_score >= 6 then 'concerning'  -- Требует внимания (60% от максимума 10)
        else 'typical'  -- Типично (норма)
      end
    ),
    'calculated_at', now()
  );
  
  return result;
end;
$$ language plpgsql security definer;






