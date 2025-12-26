-- ============================================
-- Пересчет всех завершенных оценок с исправленной логикой
-- ============================================
-- Используем FOR UPDATE SKIP LOCKED для защиты от race conditions

-- Пересчитываем все завершенные checkup оценки
update public.assessments
set 
  results_summary = calculate_checkup_scores(id),
  updated_at = now()
where id in (
  select id from public.assessments
  where assessment_type = 'checkup'
    and status = 'completed'
  for update skip locked
);

-- Пересчитываем все завершенные parent оценки
update public.assessments
set 
  results_summary = calculate_parent_scores(id),
  updated_at = now()
where id in (
  select id from public.assessments
  where assessment_type = 'parent'
    and status = 'completed'
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
  for update skip locked
);













