-- ============================================
-- Переименование типов консультаций
-- ============================================
-- Этот скрипт обновляет названия типов консультаций на русские

-- Обновляем названия типов консультаций
UPDATE public.appointment_types
SET name = 'Первичная встреча'
WHERE name = 'Kickoff Call (Portal)';

UPDATE public.appointment_types
SET name = 'Сессия для ребенка'
WHERE name = 'Child Therapy Session';

UPDATE public.appointment_types
SET name = 'Сессия для родителя'
WHERE name = 'Parent Specialist Session';

-- Обновляем названия пакетов
UPDATE public.packages
SET name = '4 сессии для ребенка'
WHERE name = '4 Session Treatment (Child Therapy)';

UPDATE public.packages
SET name = '8 сессий для ребенка'
WHERE name = '8 Session Treatment (Child Therapy)';

UPDATE public.packages
SET name = '12 сессий для ребенка'
WHERE name = '12 Session Treatment (Child Therapy)';

UPDATE public.packages
SET name = '4 сессии для родителя'
WHERE name = '4 Session Treatment (Parent Specialist)';

UPDATE public.packages
SET name = '8 сессий для родителя'
WHERE name = '8 Session Treatment (Parent Specialist)';

UPDATE public.packages
SET name = '12 сессий для родителя'
WHERE name = '12 Session Treatment (Parent Specialist)';










