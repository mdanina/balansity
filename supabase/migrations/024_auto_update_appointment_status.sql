-- ============================================
-- Функция для автоматического обновления статусов консультаций
-- ============================================

CREATE OR REPLACE FUNCTION update_appointment_statuses()
RETURNS void AS $$
BEGIN
  -- 1. Консультации, которые должны начаться (scheduled_at <= now())
  --    и еще не начались -> статус 'in_progress'
  UPDATE public.appointments
  SET status = 'in_progress'
  WHERE status = 'scheduled'
    AND scheduled_at <= now();
  
  -- 2. Консультации, которые должны завершиться 
  --    (scheduled_at + duration_minutes <= now())
  --    и еще идут -> статус 'completed'
  UPDATE public.appointments a
  SET status = 'completed'
  FROM public.appointment_types at
  WHERE a.appointment_type_id = at.id
    AND a.status = 'in_progress'
    AND (a.scheduled_at + (at.duration_minutes || ' minutes')::interval) <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



