-- ============================================
-- Supabase Migration: Setup Queues
-- ============================================
-- Настройка очередей для фоновой обработки задач
-- 
-- Требует установленного расширения pgmq (обычно уже включено при установке Queues интеграции)

-- Устанавливаем схему по умолчанию
SET search_path = public;

-- ============================================
-- 1. Включаем расширение pgmq (если еще не включено)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgmq;

-- ============================================
-- 2. Создаем очереди для различных типов задач
-- ============================================

-- Очередь для отправки email
-- Используется для: подтверждений, напоминаний, уведомлений
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'email_queue'
  ) THEN
    PERFORM pgmq.create('email_queue');
  END IF;
END $$;

-- Очередь для генерации отчетов
-- Используется для: PDF отчетов, экспорта данных
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'report_generation_queue'
  ) THEN
    PERFORM pgmq.create('report_generation_queue');
  END IF;
END $$;

-- Очередь для обработки платежей
-- Используется для: асинхронной обработки платежей, обновления статусов
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'payment_processing_queue'
  ) THEN
    PERFORM pgmq.create('payment_processing_queue');
  END IF;
END $$;

-- Очередь для аналитики
-- Используется для: обновления статистики, метрик
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'analytics_queue'
  ) THEN
    PERFORM pgmq.create('analytics_queue');
  END IF;
END $$;

-- ============================================
-- 3. Вспомогательные функции для работы с очередями
-- ============================================

-- Функция для добавления задачи в очередь email
CREATE OR REPLACE FUNCTION public.queue_email_task(
  p_to text,
  p_subject text,
  p_template text,
  p_variables jsonb DEFAULT '{}'::jsonb,
  p_priority int DEFAULT 0
)
RETURNS bigint AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для добавления задачи генерации отчета
CREATE OR REPLACE FUNCTION public.queue_report_generation(
  p_assessment_id uuid,
  p_user_id uuid,
  p_report_type text DEFAULT 'pdf'
)
RETURNS bigint AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для добавления задачи обработки платежа
CREATE OR REPLACE FUNCTION public.queue_payment_processing(
  p_payment_id uuid,
  p_action text -- 'verify', 'refund', 'update_status'
)
RETURNS bigint AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Проверка: Просмотр созданных очередей
-- ============================================
-- Выполните для проверки:
-- SELECT * FROM pgmq.list_queues();

