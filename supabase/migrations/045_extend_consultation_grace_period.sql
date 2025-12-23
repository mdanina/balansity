-- ============================================
-- Миграция 045: Продление времени консультации на 15 минут
-- ============================================
-- Добавляем 15 минут буфера после окончания консультации,
-- чтобы специалист и клиент могли дообщаться

-- Обновляем функцию автоматического обновления статусов
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
  --    (scheduled_at + duration_minutes + 15 минут буфера <= now())
  --    и еще идут -> статус 'completed'
  --    Добавляем 15 минут дополнительного времени для общения
  UPDATE public.appointments a
  SET status = 'completed'
  FROM public.appointment_types at
  WHERE a.appointment_type_id = at.id
    AND a.status = 'in_progress'
    AND (a.scheduled_at + (at.duration_minutes || ' minutes')::interval + interval '15 minutes') <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарий для документации
COMMENT ON FUNCTION update_appointment_statuses() IS
'Автоматически обновляет статусы консультаций:
- scheduled -> in_progress: когда наступило время начала
- in_progress -> completed: через duration_minutes + 15 минут после начала
15 минут буфера добавлены, чтобы специалист и клиент могли дообщаться';
