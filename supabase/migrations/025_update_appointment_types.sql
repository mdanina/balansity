-- ============================================
-- Обновление типов консультаций
-- ============================================
-- Заменяем старые платные типы на новые категории специалистов
-- "Первичная встреча" остается без изменений

-- Шаг 1: Добавляем новые типы специалистов (все по 5000₽, 45 минут)
INSERT INTO public.appointment_types (name, duration_minutes, price, description, is_active)
VALUES 
  ('Детский психолог', 45, 5000.00, 'Консультация с детским психологом', true),
  ('Нейропсихолог', 45, 5000.00, 'Консультация с нейропсихологом', true),
  ('Психиатр', 45, 5000.00, 'Консультация с психиатром', true),
  ('Невролог', 45, 5000.00, 'Консультация с неврологом', true),
  ('Семейный психолог', 45, 5000.00, 'Консультация с семейным психологом', true)
ON CONFLICT DO NOTHING;

-- Шаг 2: Обновляем существующие appointments
-- Заменяем "Сессия для ребенка" на "Детский психолог"
UPDATE public.appointments
SET appointment_type_id = (
  SELECT id FROM public.appointment_types WHERE name = 'Детский психолог' LIMIT 1
)
WHERE appointment_type_id IN (
  SELECT id FROM public.appointment_types WHERE name = 'Сессия для ребенка'
);

-- Заменяем "Сессия для родителя" на "Семейный психолог"
UPDATE public.appointments
SET appointment_type_id = (
  SELECT id FROM public.appointment_types WHERE name = 'Семейный психолог' LIMIT 1
)
WHERE appointment_type_id IN (
  SELECT id FROM public.appointment_types WHERE name = 'Сессия для родителя'
);

-- Шаг 3: Удаляем старые пакеты, привязанные к удаляемым типам
DELETE FROM public.packages WHERE appointment_type_id IN (
  SELECT id FROM public.appointment_types 
  WHERE name IN ('Сессия для ребенка', 'Сессия для родителя')
);

-- Шаг 4: Удаляем старые платные типы консультаций
-- Теперь это безопасно, т.к. все appointments уже обновлены
DELETE FROM public.appointment_types 
WHERE name IN ('Сессия для ребенка', 'Сессия для родителя');

