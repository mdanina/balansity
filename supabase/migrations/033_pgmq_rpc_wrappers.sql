-- ============================================
-- Supabase Migration: PGMQ RPC Wrappers
-- ============================================
-- Создание RPC функций-обёрток для работы с pgmq через Supabase API
-- 
-- Эти функции позволяют вызывать pgmq.read, pgmq.archive, pgmq.nack через RPC

SET search_path = public;

-- Функция для чтения сообщений из очереди
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для архивирования сообщения
CREATE OR REPLACE FUNCTION public.pgmq_archive(
  queue_name text,
  msg_id bigint
)
RETURNS boolean AS $$
BEGIN
  PERFORM pgmq.archive(queue_name, msg_id);
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для возврата сообщения в очередь (nack)
CREATE OR REPLACE FUNCTION public.pgmq_nack(
  queue_name text,
  msg_id bigint
)
RETURNS boolean AS $$
BEGIN
  PERFORM pgmq.nack(queue_name, msg_id);
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарии для документации
COMMENT ON FUNCTION public.pgmq_read IS 'Чтение сообщения из очереди pgmq через RPC';
COMMENT ON FUNCTION public.pgmq_archive IS 'Архивирование обработанного сообщения';
COMMENT ON FUNCTION public.pgmq_nack IS 'Возврат сообщения в очередь для повторной обработки';

