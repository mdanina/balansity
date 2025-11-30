-- ============================================
-- Добавление статуса 'in_progress' для консультаций
-- ============================================

-- Удаляем старый constraint
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Добавляем новый constraint с статусом 'in_progress'
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'));

