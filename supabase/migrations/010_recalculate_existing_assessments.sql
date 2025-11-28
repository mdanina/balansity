-- ============================================
-- Пересчет результатов для уже завершенных parent и family оценок
-- ============================================

-- Пересчитываем все завершенные parent оценки
update public.assessments
set 
  results_summary = calculate_parent_scores(id),
  updated_at = now()
where assessment_type = 'parent'
  and status = 'completed'
  and (results_summary is null or results_summary = '{"status": "completed"}'::jsonb);

-- Пересчитываем все завершенные family оценки
update public.assessments
set 
  results_summary = calculate_family_scores(id),
  updated_at = now()
where assessment_type = 'family'
  and status = 'completed'
  and (results_summary is null or results_summary = '{"status": "completed"}'::jsonb);

