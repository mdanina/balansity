-- ============================================
-- Добавление типа консультации - Логопед
-- ============================================

-- Добавляем новый тип консультации "Логопед" (если еще не существует)
INSERT INTO public.appointment_types (name, duration_minutes, price, description, is_active)
SELECT 'Логопед', 45, 5000.00, 'Консультация с логопедом', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.appointment_types WHERE name = 'Логопед'
);

