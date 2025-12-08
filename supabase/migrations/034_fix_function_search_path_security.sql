-- ============================================
-- Supabase Migration: Fix Function Search Path Security
-- Migration: 034_fix_function_search_path_security.sql
-- ============================================
-- Исправление уязвимости "Function Search Path Mutable" для всех функций
-- Добавляем SET search_path = '' ко всем функциям для безопасности
-- 
-- Это критически важно для предотвращения SQL injection через изменение search_path
-- ============================================

-- ============================================
-- 1. Функции из initial_schema.sql
-- ============================================

-- update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, name, relationship)
  VALUES (
    gen_random_uuid(),
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Пользователь'),
    'self'
  );
  RETURN new;
END;
$$;

-- ============================================
-- 2. Функции из scoring_functions.sql и связанных миграций
-- ============================================

-- calculate_checkup_scores
CREATE OR REPLACE FUNCTION calculate_checkup_scores(assessment_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
  emotional_score int := 0;
  conduct_score int := 0;
  hyperactivity_score int := 0;
  peer_problems_score int := 0;
  prosocial_score int := 0;
  impact_score int := 0;
BEGIN
  SELECT coalesce(sum(value), 0) INTO emotional_score
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id BETWEEN 1 AND 5
    AND answer_type = 'default';
  
  SELECT coalesce(sum(value), 0) INTO conduct_score
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id BETWEEN 6 AND 10
    AND answer_type = 'default';
  
  SELECT coalesce(sum(value), 0) INTO hyperactivity_score
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id BETWEEN 11 AND 15
    AND answer_type = 'default';
  
  SELECT coalesce(sum(value), 0) INTO peer_problems_score
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id BETWEEN 16 AND 21
    AND answer_type = 'default';
  
  SELECT coalesce(sum(value), 0) INTO prosocial_score
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id IN (7, 14, 15, 20, 21)
    AND answer_type = 'default';
  
  SELECT coalesce(sum(value), 0) INTO impact_score
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND answer_type = 'impact';
  
  result := jsonb_build_object(
    'emotional', jsonb_build_object(
      'score', emotional_score,
      'status', CASE
        WHEN emotional_score >= 5 THEN 'concerning'
        WHEN emotional_score >= 3 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'conduct', jsonb_build_object(
      'score', conduct_score,
      'status', CASE
        WHEN conduct_score >= 4 THEN 'concerning'
        WHEN conduct_score >= 3 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'hyperactivity', jsonb_build_object(
      'score', hyperactivity_score,
      'status', CASE
        WHEN hyperactivity_score >= 6 THEN 'concerning'
        WHEN hyperactivity_score >= 5 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'peer_problems', jsonb_build_object(
      'score', peer_problems_score,
      'status', CASE
        WHEN peer_problems_score >= 4 THEN 'concerning'
        WHEN peer_problems_score >= 3 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'prosocial', jsonb_build_object(
      'score', prosocial_score,
      'status', CASE
        WHEN prosocial_score <= 4 THEN 'concerning'
        WHEN prosocial_score <= 5 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'impact', jsonb_build_object(
      'score', impact_score,
      'status', CASE
        WHEN impact_score >= 2 THEN 'high_impact'
        WHEN impact_score >= 1 THEN 'medium_impact'
        ELSE 'low_impact'
      END
    ),
    'total_difficulties', emotional_score + conduct_score + hyperactivity_score + peer_problems_score,
    'calculated_at', now()
  );
  
  RETURN result;
END;
$$;

-- calculate_parent_scores
CREATE OR REPLACE FUNCTION calculate_parent_scores(assessment_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
  anxiety_score int := 0;
  depression_score int := 0;
  total_score int := 0;
BEGIN
  SELECT coalesce(sum(value), 0) INTO anxiety_score
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id BETWEEN 2 AND 3
    AND answer_type = 'frequency'
    AND value >= 0;
  
  SELECT coalesce(sum(value), 0) INTO depression_score
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id BETWEEN 4 AND 5
    AND answer_type = 'frequency'
    AND value >= 0;
  
  total_score := anxiety_score + depression_score;
  
  result := jsonb_build_object(
    'anxiety', jsonb_build_object(
      'score', anxiety_score,
      'status', CASE
        WHEN anxiety_score >= 6 THEN 'concerning'
        WHEN anxiety_score >= 3 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'depression', jsonb_build_object(
      'score', depression_score,
      'status', CASE
        WHEN depression_score >= 6 THEN 'concerning'
        WHEN depression_score >= 3 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'total', jsonb_build_object(
      'score', total_score,
      'status', CASE
        WHEN total_score >= 10 THEN 'concerning'
        WHEN total_score >= 6 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'calculated_at', now()
  );
  
  RETURN result;
END;
$$;

-- calculate_family_scores
CREATE OR REPLACE FUNCTION calculate_family_scores(assessment_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
  family_stress_score int := 0;
  partner_relationship_score int := 0;
  coparenting_score int := 0;
  wellbeing_value int := 0;
  relationship_value int := 0;
  arguments_value int := 0;
  coparenting_together_value int := 0;
  coparenting_arguments_value int := 0;
BEGIN
  SELECT coalesce(value, 0) INTO wellbeing_value
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id = 1
    AND answer_type = 'wellbeing'
    AND value >= 0
  LIMIT 1;
  
  family_stress_score := coalesce(wellbeing_value, 0);
  
  SELECT coalesce(value, 0) INTO relationship_value
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id = 2
    AND answer_type = 'relationship'
    AND value >= 0
    AND value < 6
  LIMIT 1;
  
  partner_relationship_score := coalesce(relationship_value, 0);
  
  SELECT coalesce(value, 0) INTO arguments_value
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id = 3
    AND answer_type = 'frequency'
    AND value >= 0
    AND value < 6
  LIMIT 1;
  
  SELECT coalesce(value, 0) INTO coparenting_together_value
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id = 4
    AND answer_type = 'frequency'
    AND value >= 0
    AND value < 6
  LIMIT 1;
  
  SELECT coalesce(value, 0) INTO coparenting_arguments_value
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id = 5
    AND answer_type = 'frequency'
    AND value >= 0
    AND value < 6
  LIMIT 1;
  
  coparenting_score := coalesce(coparenting_together_value, 0) + coalesce(coparenting_arguments_value, 0);
  
  result := jsonb_build_object(
    'family_stress', jsonb_build_object(
      'score', family_stress_score,
      'status', CASE
        WHEN family_stress_score >= 3 THEN 'concerning'
        WHEN family_stress_score >= 2 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'partner_relationship', jsonb_build_object(
      'score', partner_relationship_score,
      'status', CASE
        WHEN partner_relationship_score >= 4 THEN 'concerning'
        WHEN partner_relationship_score >= 3 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'coparenting', jsonb_build_object(
      'score', coparenting_score,
      'status', CASE
        WHEN coparenting_score >= 7 THEN 'concerning'
        WHEN coparenting_score >= 5 THEN 'borderline'
        ELSE 'typical'
      END
    ),
    'calculated_at', now()
  );
  
  RETURN result;
END;
$$;

-- complete_assessment
CREATE OR REPLACE FUNCTION complete_assessment(assessment_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assessment_type text;
  results jsonb;
BEGIN
  SELECT a.assessment_type INTO assessment_type
  FROM public.assessments a
  WHERE a.id = assessment_uuid;
  
  IF assessment_type = 'checkup' THEN
    results := calculate_checkup_scores(assessment_uuid);
  ELSIF assessment_type = 'parent' THEN
    results := calculate_parent_scores(assessment_uuid);
  ELSIF assessment_type = 'family' THEN
    results := calculate_family_scores(assessment_uuid);
  ELSE
    results := jsonb_build_object('status', 'completed');
  END IF;
  
  UPDATE public.assessments
  SET 
    status = 'completed',
    results_summary = results,
    completed_at = now(),
    updated_at = now()
  WHERE id = assessment_uuid;
  
  RETURN results;
END;
$$;

-- get_active_assessment
CREATE OR REPLACE FUNCTION get_active_assessment(
  p_profile_id uuid,
  p_assessment_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assessment_id uuid;
BEGIN
  SELECT id INTO assessment_id
  FROM public.assessments
  WHERE profile_id = p_profile_id
    AND assessment_type = p_assessment_type
    AND status = 'in_progress'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF assessment_id IS NULL THEN
    INSERT INTO public.assessments (profile_id, assessment_type, status, current_step)
    VALUES (p_profile_id, p_assessment_type, 'in_progress', 1)
    RETURNING id INTO assessment_id;
  END IF;
  
  RETURN assessment_id;
END;
$$;

-- ============================================
-- 3. Функции из add_user_roles.sql
-- ============================================

-- is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- is_staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('support', 'admin', 'super_admin')
  );
END;
$$;

-- ============================================
-- 4. Функции из setup_queues.sql
-- ============================================

-- queue_email_task
CREATE OR REPLACE FUNCTION public.queue_email_task(
  p_to text,
  p_subject text,
  p_template text,
  p_variables jsonb DEFAULT '{}'::jsonb,
  p_priority int DEFAULT 0
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send(
    'email_queue',
    jsonb_build_object(
      'to', p_to,
      'subject', p_subject,
      'template', p_template,
      'variables', p_variables,
      'priority', p_priority,
      'created_at', now()
    )
  ) INTO msg_id;
  
  RETURN msg_id;
END;
$$;

-- queue_report_generation
CREATE OR REPLACE FUNCTION public.queue_report_generation(
  p_assessment_id uuid,
  p_user_id uuid,
  p_report_type text DEFAULT 'pdf'
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send(
    'report_generation_queue',
    jsonb_build_object(
      'assessment_id', p_assessment_id,
      'user_id', p_user_id,
      'report_type', p_report_type,
      'created_at', now()
    )
  ) INTO msg_id;
  
  RETURN msg_id;
END;
$$;

-- queue_payment_processing
CREATE OR REPLACE FUNCTION public.queue_payment_processing(
  p_payment_id uuid,
  p_action text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send(
    'payment_processing_queue',
    jsonb_build_object(
      'payment_id', p_payment_id,
      'action', p_action,
      'created_at', now()
    )
  ) INTO msg_id;
  
  RETURN msg_id;
END;
$$;

-- ============================================
-- 5. Функции из setup_cron_jobs.sql
-- ============================================

-- send_appointment_reminders
CREATE OR REPLACE FUNCTION public.send_appointment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  appointment_record RECORD;
  msg_id bigint;
BEGIN
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
$$;

-- ============================================
-- 6. Функции из auto_update_appointment_status.sql
-- ============================================

-- update_appointment_statuses
CREATE OR REPLACE FUNCTION update_appointment_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.appointments
  SET status = 'in_progress'
  WHERE status = 'scheduled'
    AND scheduled_at <= now();
  
  UPDATE public.appointments a
  SET status = 'completed'
  FROM public.appointment_types at
  WHERE a.appointment_type_id = at.id
    AND a.status = 'in_progress'
    AND (a.scheduled_at + (at.duration_minutes || ' minutes')::interval) <= now();
END;
$$;

-- ============================================
-- 7. Функции из webhook_triggers.sql
-- ============================================

-- handle_completed_checkup
CREATE OR REPLACE FUNCTION public.handle_completed_checkup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile_name text;
  v_user_email text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT p.user_id, p.first_name, u.email
    INTO v_user_id, v_profile_name, v_user_email
    FROM public.profiles p
    LEFT JOIN public.users u ON u.id = p.user_id
    WHERE p.id = NEW.profile_id;
    
    IF v_user_id IS NOT NULL THEN
      PERFORM public.queue_report_generation(
        NEW.id,
        v_user_id,
        'pdf'
      );
    END IF;
    
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
$$;

-- handle_new_appointment
CREATE OR REPLACE FUNCTION public.handle_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_email text;
  v_appointment_type_name text;
BEGIN
  SELECT email INTO v_user_email
  FROM public.users
  WHERE id = NEW.user_id;
  
  SELECT name INTO v_appointment_type_name
  FROM public.appointment_types
  WHERE id = NEW.appointment_type_id;
  
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
$$;

-- handle_payment_status_change
CREATE OR REPLACE FUNCTION public.handle_payment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_email text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT email INTO v_user_email
    FROM public.users
    WHERE id = NEW.user_id;
    
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
    
    UPDATE public.appointments
    SET status = 'confirmed'
    WHERE payment_id = NEW.id
      AND status = 'pending';
      
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
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
$$;

-- ============================================
-- 8. Функции из pgmq_rpc_wrappers.sql
-- ============================================

-- pgmq_read
CREATE OR REPLACE FUNCTION public.pgmq_read(
  queue_name text,
  vt_timeout integer DEFAULT 5
)
RETURNS TABLE (
  msg_id bigint,
  read_ct integer,
  enqueued_at timestamp with time zone,
  vt timestamp with time zone,
  message jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.msg_id,
    m.read_ct,
    m.enqueued_at,
    m.vt,
    m.message
  FROM pgmq.read(queue_name, vt_timeout, 1) m;
END;
$$;

-- pgmq_archive
CREATE OR REPLACE FUNCTION public.pgmq_archive(
  queue_name text,
  msg_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pgmq.archive(queue_name, msg_id);
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- pgmq_nack
CREATE OR REPLACE FUNCTION public.pgmq_nack(
  queue_name text,
  msg_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pgmq.nack(queue_name, msg_id);
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- ============================================
-- Проверка: Убедитесь, что все функции обновлены
-- ============================================
-- Выполните для проверки:
-- SELECT 
--   p.proname as function_name,
--   pg_get_functiondef(p.oid) LIKE '%SET search_path%' as has_search_path
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'update_updated_at_column',
--     'handle_new_user',
--     'calculate_checkup_scores',
--     'calculate_parent_scores',
--     'calculate_family_scores',
--     'complete_assessment',
--     'get_active_assessment',
--     'is_admin',
--     'is_staff',
--     'queue_email_task',
--     'queue_report_generation',
--     'queue_payment_processing',
--     'send_appointment_reminders',
--     'update_appointment_statuses',
--     'handle_completed_checkup',
--     'handle_new_appointment',
--     'handle_payment_status_change',
--     'pgmq_read',
--     'pgmq_archive',
--     'pgmq_nack'
--   )
-- ORDER BY p.proname;


