import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Функции для работы с очередями через RPC обёртки
export async function readFromQueue(queueName: string, timeoutSeconds: number = 5) {
  try {
    const { data, error } = await supabase.rpc('pgmq_read', {
      queue_name: queueName,
      vt_timeout: timeoutSeconds
    });

    if (error) {
      logger.error(`Error reading from queue ${queueName}:`, error);
      return null;
    }

    // pgmq_read возвращает таблицу, берем первый элемент
    if (data && Array.isArray(data) && data.length > 0) {
      return {
        msg_id: data[0].msg_id,
        read_ct: data[0].read_ct,
        enqueued_at: data[0].enqueued_at,
        vt: data[0].vt,
        msg: data[0].message
      };
    }

    return null;
  } catch (error) {
    logger.error(`Exception reading from queue ${queueName}:`, error);
    return null;
  }
}

export async function archiveTask(queueName: string, msgId: number) {
  try {
    const { data, error } = await supabase.rpc('pgmq_archive', {
      queue_name: queueName,
      msg_id: msgId
    });

    if (error) {
      logger.error(`Error archiving task ${msgId} from ${queueName}:`, error);
      return false;
    }

    return data === true;
  } catch (error) {
    logger.error(`Exception archiving task ${msgId} from ${queueName}:`, error);
    return false;
  }
}

export async function returnTaskToQueue(queueName: string, msgId: number) {
  try {
    const { data, error } = await supabase.rpc('pgmq_nack', {
      queue_name: queueName,
      msg_id: msgId
    });

    if (error) {
      logger.error(`Error returning task ${msgId} to ${queueName}:`, error);
      return false;
    }

    return data === true;
  } catch (error) {
    logger.error(`Exception returning task ${msgId} to ${queueName}:`, error);
    return false;
  }
}

