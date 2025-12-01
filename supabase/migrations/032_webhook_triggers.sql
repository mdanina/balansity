-- ============================================
-- Supabase Migration: Webhook Triggers
-- ============================================
-- Автоматические триггеры для обработки событий в базе данных
-- Используют Queues для фоновой обработки

-- Устанавливаем схему по умолчанию
SET search_path = public;

-- ============================================
-- 1. Функция для обработки завершенного чекапа
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_completed_checkup()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_profile_name text;
  v_user_email text;
BEGIN
  -- Проверяем, что статус изменился на 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Получаем user_id через профиль
    SELECT p.user_id, p.first_name, u.email
    INTO v_user_id, v_profile_name, v_user_email
    FROM public.profiles p
    LEFT JOIN public.users u ON u.id = p.user_id
    WHERE p.id = NEW.profile_id;
    
    -- Добавляем задачу генерации отчета в очередь (если есть user_id)
    IF v_user_id IS NOT NULL THEN
      PERFORM public.queue_report_generation(
        NEW.id,
        v_user_id,
        'pdf'
      );
    END IF;
    
    -- Добавляем задачу отправки email уведомления (если есть email)
    IF v_user_email IS NOT NULL AND v_user_email != '' THEN
      PERFORM public.queue_email_task(
        v_user_email,
        'Ваш чекап завершен',
        'checkup_completed',
        jsonb_build_object(
          'assessment_id', NEW.id,
          'profile_name', v_profile_name,
          'completed_at', NEW.completed_at
        )
      );
    END IF;
    
    -- Добавляем задачу обновления аналитики
    IF v_user_id IS NOT NULL THEN
      PERFORM pgmq.send(
        'analytics_queue',
        jsonb_build_object(
          'type', 'assessment_completed',
          'assessment_id', NEW.id,
          'assessment_type', NEW.assessment_type,
          'user_id', v_user_id,
          'completed_at', NEW.completed_at
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Триггер для автоматической обработки завершенных чекапов
-- ============================================
-- БЕЗОПАСНО: DROP IF EXISTS не удалит ничего, если триггер не существует
-- Это стандартная практика для миграций - сначала удалить старую версию, потом создать новую
DROP TRIGGER IF EXISTS on_checkup_completed ON public.assessments;

CREATE TRIGGER on_checkup_completed
  AFTER UPDATE ON public.assessments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
  EXECUTE FUNCTION public.handle_completed_checkup();

-- ============================================
-- 3. Функция для обработки новой записи на консультацию
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
  v_appointment_type_name text;
BEGIN
  -- Получаем email пользователя
  SELECT email INTO v_user_email
  FROM public.users
  WHERE id = NEW.user_id;
  
  -- Получаем название типа консультации
  SELECT name INTO v_appointment_type_name
  FROM public.appointment_types
  WHERE id = NEW.appointment_type_id;
  
  -- Добавляем задачу отправки подтверждения
  IF v_user_email IS NOT NULL AND v_user_email != '' THEN
    PERFORM public.queue_email_task(
      v_user_email,
      'Подтверждение записи на консультацию',
      'appointment_confirmation',
      jsonb_build_object(
        'appointment_id', NEW.id,
        'appointment_type', v_appointment_type_name,
        'scheduled_at', NEW.scheduled_at,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Триггер для новых записей на консультацию
-- ============================================
-- БЕЗОПАСНО: DROP IF EXISTS не удалит ничего, если триггер не существует
DROP TRIGGER IF EXISTS on_new_appointment ON public.appointments;

CREATE TRIGGER on_new_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_appointment();

-- ============================================
-- 5. Функция для обработки изменений статуса платежа
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_payment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Если платеж успешно завершен
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Получаем email пользователя
    SELECT email INTO v_user_email
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- Отправляем подтверждение об оплате
    IF v_user_email IS NOT NULL AND v_user_email != '' THEN
      PERFORM public.queue_email_task(
        v_user_email,
        'Подтверждение оплаты',
        'payment_confirmation',
        jsonb_build_object(
          'payment_id', NEW.id,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'payment_method', NEW.payment_method
        )
      );
    END IF;
    
    -- Если это платеж за консультацию, обновляем статус консультации
    UPDATE public.appointments
    SET status = 'confirmed'
    WHERE payment_id = NEW.id
      AND status = 'pending';
      
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    -- Уведомление об ошибке оплаты
    SELECT email INTO v_user_email
    FROM public.users
    WHERE id = NEW.user_id;
    
    IF v_user_email IS NOT NULL AND v_user_email != '' THEN
      PERFORM public.queue_email_task(
        v_user_email,
        'Ошибка оплаты',
        'payment_failed',
        jsonb_build_object(
          'payment_id', NEW.id,
          'amount', NEW.amount
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Триггер для изменений статуса платежа
-- ============================================
-- БЕЗОПАСНО: DROP IF EXISTS не удалит ничего, если триггер не существует
DROP TRIGGER IF EXISTS on_payment_status_change ON public.payments;

CREATE TRIGGER on_payment_status_change
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.handle_payment_status_change();

-- ============================================
-- Проверка: Просмотр созданных триггеров
-- ============================================
-- Выполните для проверки:
-- SELECT trigger_name, event_object_table, event_manipulation 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' 
--   AND trigger_name IN ('on_checkup_completed', 'on_new_appointment', 'on_payment_status_change');

