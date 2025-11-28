-- ============================================
-- Пересчет результатов для уже завершенных parent и family оценок
-- ============================================
-- Используем FOR UPDATE SKIP LOCKED для защиты от race conditions
-- при одновременном выполнении миграции и завершении оценки пользователем

-- Пересчитываем все завершенные parent оценки
update public.assessments
set 
  results_summary = calculate_parent_scores(id),
  updated_at = now()
where id in (
  select id from public.assessments
  where assessment_type = 'parent'
    and status = 'completed'
    and (results_summary is null or results_summary = '{"status": "completed"}'::jsonb)
  for update skip locked
);

-- Пересчитываем все завершенные family оценки
update public.assessments
set 
  results_summary = calculate_family_scores(id),
  updated_at = now()
where id in (
  select id from public.assessments
  where assessment_type = 'family'
    and status = 'completed'
    and (results_summary is null or results_summary = '{"status": "completed"}'::jsonb)
  for update skip locked
);

