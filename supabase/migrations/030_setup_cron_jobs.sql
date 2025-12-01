-- ============================================
-- Supabase Migration: Setup Cron Jobs
-- ============================================
-- Автоматические задачи для обновления статусов и очистки данных
-- 
-- Требует установленного расширения pg_cron (обычно уже включено при установке Cron интеграции)

-- Устанавливаем схему по умолчанию
SET search_path = public;

-- ============================================
-- 1. Включаем расширение pg_cron (если еще не включено)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 2. Задача: Автоматическое обновление статусов консультаций
-- ============================================
-- Обновляет статусы консультаций каждые 5 минут
-- - scheduled -> in_progress (когда время наступило)
-- - in_progress -> completed (когда время прошло)

-- Удаляем задачу, если она уже существует
SELECT cron.unschedule('update-appointment-statuses') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-appointment-statuses'
);

-- Создаем задачу
SELECT cron.schedule(
  'update-appointment-statuses',
  '*/5 * * * *', -- каждые 5 минут
  $$
  SELECT update_appointment_statuses();
  $$
);

-- ============================================
-- 3. Задача: Очистка старых неактивных оценок
-- ============================================
-- Помечает как 'abandoned' оценки, которые не завершены более 30 дней
-- Выполняется раз в день в 3:00 ночи

SELECT cron.unschedule('cleanup-old-assessments') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-assessments'
);

SELECT cron.schedule(
  'cleanup-old-assessments',
  '0 3 * * *', -- каждый день в 3:00
  $$
  UPDATE public.assessments 
  SET status = 'abandoned', updated_at = now()
  WHERE status = 'in_progress' 
    AND created_at < now() - interval '30 days';
  $$
);

-- ============================================
-- 4. Функция для отправки напоминаний о консультациях
-- ============================================
-- Создаем отдельную функцию, которую будет вызывать Cron
CREATE OR REPLACE FUNCTION public.send_appointment_reminders()
RETURNS void AS $$
DECLARE
  appointment_record RECORD;
  msg_id bigint;
BEGIN
  -- Напоминания за 24 часа
  FOR appointment_record IN
    SELECT a.id, a.user_id, a.scheduled_at, u.email
    FROM public.appointments a
    LEFT JOIN public.users u ON u.id = a.user_id
    WHERE a.status = 'scheduled'
      AND a.scheduled_at BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
      AND u.email IS NOT NULL
  LOOP
    PERFORM public.queue_email_task(
      appointment_record.email,
      'Напоминание о консультации',
      'appointment_reminder_24h',
      jsonb_build_object(
        'appointment_id', appointment_record.id,
        'scheduled_at', appointment_record.scheduled_at
      )
    );
  END LOOP;
  
  -- Напоминания за 1 час
  FOR appointment_record IN
    SELECT a.id, a.user_id, a.scheduled_at, u.email
    FROM public.appointments a
    LEFT JOIN public.users u ON u.id = a.user_id
    WHERE a.status IN ('scheduled', 'in_progress')
      AND a.scheduled_at BETWEEN now() + interval '55 minutes' AND now() + interval '65 minutes'
      AND u.email IS NOT NULL
  LOOP
    PERFORM public.queue_email_task(
      appointment_record.email,
      'Напоминание о консультации',
      'appointment_reminder_1h',
      jsonb_build_object(
        'appointment_id', appointment_record.id,
        'scheduled_at', appointment_record.scheduled_at
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Задача: Напоминания о предстоящих консультациях
-- ============================================
-- Выполняется каждый час
SELECT cron.unschedule('send-appointment-reminders') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-appointment-reminders'
);

SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *', -- каждый час
  $$ SELECT send_appointment_reminders(); $$
);

-- ============================================
-- Проверка: Просмотр созданных задач
-- ============================================
-- Выполните для проверки:
-- SELECT * FROM cron.job WHERE jobname IN ('update-appointment-statuses', 'cleanup-old-assessments', 'send-appointment-reminders');

