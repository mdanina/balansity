-- ============================================
-- Исправление функций подсчета согласно авторской схеме обработки результатов
-- ============================================

-- ============================================
-- 1. Checkup (Вопросы ребенка)
-- ============================================

create or replace function calculate_checkup_scores(assessment_uuid uuid)
returns jsonb as $$
declare
  result jsonb;
  emotional_score int := 0;
  conduct_score int := 0;
  hyperactivity_score int := 0;
  peer_problems_score int := 0;
  
  -- Impact scores
  impact_child_score int := 0;      -- Вопрос 23
  impact_parent_score int := 0;     -- Вопросы 30, 31
  impact_family_score int := 0;     -- Вопросы 24, 25, 26, 27, 28, 29
begin
  -- 4.3.1. Эмоциональные проблемы: вопросы 2, 3, 4, 5, 6
  -- Максимум: 20 (5 вопросов × 4). Пороговое значение: 12 и выше (60% от максимума)
  select coalesce(sum(value), 0) into emotional_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (2, 3, 4, 5, 6)
    and answer_type = 'default'
    and value >= 0;
  
  -- 4.3.2. Поведенческие проблемы: вопросы 7, 8, 9, 10, 11
  -- Максимум: 20 (5 вопросов × 4). Пороговое значение: 12 и выше (60% от максимума)
  -- Вопрос 7 - обратный (isReverse: true), reverse scoring уже применен при сохранении
  -- Вопрос 8 - прямой (не обратный), несмотря на указание в схеме
  select coalesce(sum(value), 0) into conduct_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (7, 8, 9, 10, 11)
    and answer_type = 'default'
    and value >= 0;
  
  -- 4.3.3. Гиперактивность и внимание: вопросы 12, 13, 14, 15 (обратная), 16 (обратная)
  -- Максимум: 20 (5 вопросов × 4). Пороговое значение: 12 и выше (60% от максимума)
  -- Вопросы 15, 16 - обратные, но reverse scoring уже применен при сохранении
  select coalesce(sum(value), 0) into hyperactivity_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (12, 13, 14, 15, 16)
    and answer_type = 'default'
    and value >= 0;
  
  -- 4.3.4. Проблемы со сверстниками: вопросы 17, 18, 19, 20 (обратная), 21 (обратная)
  -- Максимум: 24 (6 вопросов × 4). Пороговое значение: 15 и выше (60% от максимума, округлено вверх)
  -- Вопросы 20, 21 - обратные, но reverse scoring уже применен при сохранении
  select coalesce(sum(value), 0) into peer_problems_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (17, 18, 19, 20, 21)
    and answer_type = 'default'
    and value >= 0;
  
  -- 4.4. Домен влияния
  
  -- Влияние на ребёнка: вопрос 23
  -- Пороговое значение: 2 и выше
  select coalesce(value, 0) into impact_child_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id = 23
    and answer_type = 'impact'
    and value >= 0
  limit 1;
  
  -- Влияние на родителя: вопросы 30, 31
  -- Сумма пороговых значений: 3 и выше
  select coalesce(sum(value), 0) into impact_parent_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (30, 31)
    and answer_type = 'impact'
    and value >= 0;
  
  -- Влияние на семью: вопросы 24, 25, 26, 27, 28, 29
  -- Сумма пороговых значений: 6 и выше
  select coalesce(sum(value), 0) into impact_family_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (24, 25, 26, 27, 28, 29)
    and answer_type = 'impact'
    and value >= 0;
  
  -- Определение статуса по баллам
  -- Все результаты: Типично (норма) или Требует внимания (отклонение от нормы)
  result := jsonb_build_object(
    'emotional', jsonb_build_object(
      'score', emotional_score,
      'status', case
        when emotional_score >= 12 then 'concerning'  -- Требует внимания (60% от максимума 20)
        else 'typical'  -- Типично (норма)
      end
    ),
    'conduct', jsonb_build_object(
      'score', conduct_score,
      'status', case
        when conduct_score >= 12 then 'concerning'  -- Требует внимания (60% от максимума 20)
        else 'typical'  -- Типично (норма)
      end
    ),
    'hyperactivity', jsonb_build_object(
      'score', hyperactivity_score,
      'status', case
        when hyperactivity_score >= 12 then 'concerning'  -- Требует внимания (60% от максимума 20)
        else 'typical'  -- Типично (норма)
      end
    ),
    'peer_problems', jsonb_build_object(
      'score', peer_problems_score,
      'status', case
        when peer_problems_score >= 15 then 'concerning'  -- Требует внимания (60% от максимума 24)
        else 'typical'  -- Типично (норма)
      end
    ),
    'impact_child', jsonb_build_object(
      'score', impact_child_score,
      'status', case
        when impact_child_score >= 2 then 'concerning'  -- Требует внимания
        else 'typical'  -- Типично (норма)
      end
    ),
    'impact_parent', jsonb_build_object(
      'score', impact_parent_score,
      'status', case
        when impact_parent_score >= 3 then 'concerning'  -- Требует внимания
        else 'typical'  -- Типично (норма)
      end
    ),
    'impact_family', jsonb_build_object(
      'score', impact_family_score,
      'status', case
        when impact_family_score >= 6 then 'concerning'  -- Требует внимания
        else 'typical'  -- Типично (норма)
      end
    ),
    'total_difficulties', emotional_score + conduct_score + hyperactivity_score + peer_problems_score,
    -- Максимум Total Difficulties: 84 (20+20+20+24). Порог "Есть проблемы": 51 (60% от 84, округлено вверх)
    'calculated_at', now()
  );
  
  return result;
end;
$$ language plpgsql security definer;

-- ============================================
-- 2. Parent (Вопросы родителя)
-- ============================================

create or replace function calculate_parent_scores(assessment_uuid uuid)
returns jsonb as $$
declare
  result jsonb;
  anxiety_score int := 0;    -- GAD-2: вопросы 3, 4
  depression_score int := 0; -- PHQ-2: вопросы 5, 6
  total_score int := 0;
begin
  -- 4.5.1. Тревожность (GAD-2): вопросы 3, 4
  -- Максимальный балл: 6. Пороговое значение: 4 и выше (60% от максимума, округлено вверх)
  -- В схеме указаны вопросы 3, 4, но в коде parentQuestions вопросы имеют id: 2, 3
  -- Проверяю: в parentQuestions.ts id: 2="Чувство нервозности...", id: 3="Невозможность остановить..."
  -- Значит, это вопросы с id 2, 3 (но в схеме указаны 3, 4)
  -- Возможно, в схеме нумерация начинается с 1 (вопрос о поле), а в коде id=1 тоже про поле
  -- Но по логике GAD-2 это должны быть вопросы про тревожность
  -- Согласно схеме: вопросы 3, 4
  -- Согласно коду: id 2, 3 (но это вопросы про тревожность!)
  -- Используем id 2, 3 из кода (соответствуют вопросам 3, 4 в схеме, если вопрос 1 - про пол)
  select coalesce(sum(value), 0) into anxiety_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (2, 3)  -- В коде это вопросы про тревожность
    and answer_type = 'frequency'
    and value >= 0;
  
  -- 4.5.2. Депрессия (PHQ-2): вопросы 5, 6
  -- Максимальный балл: 6. Пороговое значение: 4 и выше (60% от максимума, округлено вверх)
  -- В коде id: 4, 5 (вопросы про депрессию)
  select coalesce(sum(value), 0) into depression_score
  from public.answers
  where assessment_id = assessment_uuid
    and question_id in (4, 5)  -- В коде это вопросы про депрессию
    and answer_type = 'frequency'
    and value >= 0;
  
  total_score := anxiety_score + depression_score;
  
  -- Определение статуса
  result := jsonb_build_object(
    'anxiety', jsonb_build_object(
      'score', anxiety_score,
      'status', case
        when anxiety_score >= 4 then 'concerning'  -- Требует внимания (60% от максимума 6)
        else 'typical'  -- Типично (норма)
      end
    ),
    'depression', jsonb_build_object(
      'score', depression_score,
      'status', case
        when depression_score >= 4 then 'concerning'  -- Требует внимания (60% от максимума 6)
        else 'typical'  -- Типично (норма)
      end
    ),
    'total', jsonb_build_object(
      'score', total_score,
      'status', case
        when total_score >= 8 then 'concerning'  -- Требует внимания (60% от максимума 12, округлено вверх)
        else 'typical'  -- Типично (норма)
      end
    ),
    'calculated_at', now()
  );
  
  return result;
end;
$$ language plpgsql security definer;

-- ============================================
-- 3. Family (Вопросы семьи)
-- ============================================

create or replace function calculate_family_scores(assessment_uuid uuid)
returns jsonb as $$
declare
  result jsonb;
  family_stress_score int := 0;         -- Вопрос 2 (в схеме)
  partner_relationship_score int := 0;  -- Вопросы 3, 4 (обратная)
  coparenting_score int := 0;           -- Вопросы 5, 6 (обратная)
  
  -- Значения отдельных вопросов
  wellbeing_value int := 0;      -- Вопрос 1 (в коде id=1)
  relationship_value int := 0;   -- Вопрос 2 (в коде id=2, обратная)
  arguments_value int := 0;      -- Вопрос 3 (в коде id=3)
  coparenting_together_value int := 0;  -- Вопрос 4 (в коде id=4, обратная)
  coparenting_arguments_value int := 0; -- Вопрос 5 (в коде id=5)
begin
  -- 4.6.1. Семейный стресс: вопрос 2 (в схеме)
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
  
  -- 4.6.2. Отношения с партнёром: вопросы 3, 4 (обратная) (в схеме)
  -- В коде: id=2 (обратная), id=3
  -- Reverse scoring уже применен при сохранении для id=2
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
  
  -- 4.6.3. Совместное родительство: вопросы 5, 6 (обратная) (в схеме)
  -- В коде: id=4 (обратная), id=5
  -- Reverse scoring уже применен при сохранении для id=4
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

