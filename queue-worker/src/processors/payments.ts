import { readFromQueue, archiveTask, returnTaskToQueue } from '../services/supabase.js';
import { supabase } from '../services/supabase.js';
import { verifyYooKassaPayment } from '../services/yookassa.js';
import { logger } from '../utils/logger.js';
import {
  shouldRetry,
  getCurrentAttemptCount,
  type QueueTask,
  DEFAULT_RETRY_CONFIG,
} from '../utils/retry.js';

const MAX_RETRY_ATTEMPTS = parseInt(process.env.MAX_PAYMENT_RETRY_ATTEMPTS || '5', 10);

export async function processPaymentQueue(maxTasks: number = 10): Promise<number> {
  let processed = 0;

  for (let i = 0; i < maxTasks; i++) {
    const task = await readFromQueue('payment_processing_queue', 5);

    if (!task) {
      break;
    }

    // Convert to QueueTask format
    const queueTask: QueueTask = {
      msg_id: task.msg_id,
      read_ct: task.read_ct,
      enqueued_at: task.enqueued_at.toISOString(),
      vt: task.vt.toISOString(),
      msg: task.msg,
    };

    const attemptCount = getCurrentAttemptCount(queueTask);

    try {
      const paymentData = task.msg as {
        payment_id: string;
        action: string;
      };

      logger.info(
        `Processing payment task (attempt ${attemptCount}/${MAX_RETRY_ATTEMPTS}): ${paymentData.payment_id} - ${paymentData.action}`
      );

      logger.info(`Processing payment task: ${paymentData.payment_id} - ${paymentData.action}`);

      // Получаем платеж из БД
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentData.payment_id)
        .single();

      if (paymentError || !payment) {
        logger.error(`Payment not found: ${paymentData.payment_id}`);
        await archiveTask('payment_processing_queue', task.msg_id);
        processed++;
        continue;
      }

      // Если платеж уже завершен, пропускаем
      if (payment.status === 'completed' || payment.status === 'failed' || payment.status === 'cancelled') {
        logger.info(`Payment ${paymentData.payment_id} already ${payment.status}, skipping`);
        await archiveTask('payment_processing_queue', task.msg_id);
        processed++;
        continue;
      }

      // Если это платеж ЮKassa и есть external_payment_id, проверяем статус
      if (payment.payment_method === 'yookassa' && payment.external_payment_id) {
        try {
          const yukassaData = await verifyYooKassaPayment(payment.external_payment_id);
          const yukassaStatus = yukassaData.status;

          // Обновляем статус в БД
          let newStatus = 'pending';
          if (yukassaStatus === 'succeeded') {
            newStatus = 'completed';
          } else if (yukassaStatus === 'canceled') {
            newStatus = 'failed';
          } else if (yukassaStatus === 'pending' || yukassaStatus === 'waiting_for_capture') {
            newStatus = 'processing';
          }

          await supabase
            .from('payments')
            .update({ status: newStatus })
            .eq('id', paymentData.payment_id);

          // Если платеж завершен, обновляем связанные записи
          if (newStatus === 'completed' && payment.metadata) {
            const metadata = payment.metadata as any;

            if (metadata.appointment_id) {
              await supabase
                .from('appointments')
                .update({ payment_id: payment.id })
                .eq('id', metadata.appointment_id);
              logger.info(`Updated appointment ${metadata.appointment_id} with payment ${payment.id}`);
            }

            if (metadata.package_id) {
              // Логика для пакетов (можно добавить позже)
              logger.info(`Package purchase ${metadata.package_id} completed`);
            }
          }

          logger.info(`Payment ${paymentData.payment_id} status updated to ${newStatus}`);
        } catch (error) {
          logger.error(`Error verifying payment ${paymentData.payment_id} (attempt ${attemptCount}):`, error);
          
          // Проверяем, можно ли повторить попытку
          if (shouldRetry(queueTask, { ...DEFAULT_RETRY_CONFIG, maxAttempts: MAX_RETRY_ATTEMPTS })) {
            await returnTaskToQueue('payment_processing_queue', task.msg_id);
            const nextAttempt = attemptCount + 1;
            logger.warn(
              `Payment task ${paymentData.payment_id} will retry (attempt ${nextAttempt}/${MAX_RETRY_ATTEMPTS})`
            );
          } else {
            // Превышен лимит попыток - архивируем
            await archiveTask('payment_processing_queue', task.msg_id);
            logger.error(
              `Payment task ${paymentData.payment_id} failed after ${attemptCount} attempts. Task archived.`
            );
            processed++;
          }
          continue;
        }
      }

      await archiveTask('payment_processing_queue', task.msg_id);
      processed++;
    } catch (error) {
      logger.error(`Error processing payment task ${task.msg_id} (attempt ${attemptCount}):`, error);

      // Проверяем, можно ли повторить попытку
      if (shouldRetry(queueTask, { ...DEFAULT_RETRY_CONFIG, maxAttempts: MAX_RETRY_ATTEMPTS })) {
        await returnTaskToQueue('payment_processing_queue', task.msg_id);
        const nextAttempt = attemptCount + 1;
        logger.warn(
          `Payment task ${task.msg_id} will retry (attempt ${nextAttempt}/${MAX_RETRY_ATTEMPTS})`
        );
      } else {
        // Превышен лимит попыток - архивируем
        await archiveTask('payment_processing_queue', task.msg_id);
        logger.error(
          `Payment task ${task.msg_id} failed after ${attemptCount} attempts. Task archived.`
        );
        processed++;
      }
    }
  }

  return processed;
}



