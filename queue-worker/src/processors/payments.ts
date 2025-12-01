import { readFromQueue, archiveTask, returnTaskToQueue } from '../services/supabase.js';
import { logger } from '../utils/logger.js';

export async function processPaymentQueue(maxTasks: number = 10): Promise<number> {
  let processed = 0;

  for (let i = 0; i < maxTasks; i++) {
    const task = await readFromQueue('payment_processing_queue', 5);

    if (!task) {
      break;
    }

    try {
      const paymentData = task.msg as {
        payment_id: string;
        action: string;
      };

      logger.info(`Processing payment task: ${paymentData.payment_id} - ${paymentData.action}`);

      // TODO: Реализуйте обработку платежей
      // await processPayment(paymentData.payment_id, paymentData.action);

      await archiveTask('payment_processing_queue', task.msg_id);
      processed++;
    } catch (error) {
      logger.error(`Error processing payment task ${task.msg_id}:`, error);
      await returnTaskToQueue('payment_processing_queue', task.msg_id);
    }
  }

  return processed;
}


