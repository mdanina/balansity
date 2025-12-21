import { readFromQueue, archiveTask, returnTaskToQueue } from '../services/supabase.js';
import { emailService } from '../services/email.js';
import { logger } from '../utils/logger.js';
import {
  shouldRetry,
  hasExceededMaxRetries,
  getCurrentAttemptCount,
  type QueueTask,
  DEFAULT_RETRY_CONFIG,
} from '../utils/retry.js';

const MAX_RETRY_ATTEMPTS = parseInt(process.env.MAX_EMAIL_RETRY_ATTEMPTS || '5', 10);

export async function processEmailQueue(maxTasks: number = 10): Promise<number> {
  let processed = 0;

  for (let i = 0; i < maxTasks; i++) {
    const task = await readFromQueue('email_queue', 5);

    if (!task) {
      break; // Нет задач
    }

    // Convert to QueueTask format
    // Данные из pgmq приходят как строки, не как Date объекты
    const queueTask: QueueTask = {
      msg_id: task.msg_id,
      read_ct: task.read_ct,
      enqueued_at: typeof task.enqueued_at === 'string'
        ? task.enqueued_at
        : task.enqueued_at?.toISOString?.() || new Date().toISOString(),
      vt: typeof task.vt === 'string'
        ? task.vt
        : task.vt?.toISOString?.() || new Date().toISOString(),
      msg: task.msg,
    };

    const attemptCount = getCurrentAttemptCount(queueTask);

    try {
      const taskData = task.msg as {
        to: string;
        subject: string;
        template: string;
        variables: Record<string, any>;
      };

      logger.info(
        `Processing email task (attempt ${attemptCount}/${MAX_RETRY_ATTEMPTS}): ${taskData.to} - ${taskData.subject}`
      );

      const success = await emailService.sendEmail({
        to: taskData.to,
        subject: taskData.subject,
        template: taskData.template,
        variables: taskData.variables || {},
      });

      if (success) {
        await archiveTask('email_queue', task.msg_id);
        processed++;
        logger.info(`Email sent successfully to ${taskData.to}`);
      } else {
        // Проверяем, можно ли повторить попытку
        if (shouldRetry(queueTask, { ...DEFAULT_RETRY_CONFIG, maxAttempts: MAX_RETRY_ATTEMPTS })) {
          await returnTaskToQueue('email_queue', task.msg_id);
          const nextAttempt = attemptCount + 1;
          logger.warn(
            `Failed to send email to ${taskData.to}, will retry (attempt ${nextAttempt}/${MAX_RETRY_ATTEMPTS})`
          );
        } else {
          // Превышен лимит попыток - архивируем как неудачную
          await archiveTask('email_queue', task.msg_id);
          logger.error(
            `Email to ${taskData.to} failed after ${attemptCount} attempts. Task archived.`
          );
          processed++; // Считаем как обработанную (хоть и неудачно)
        }
      }
    } catch (error) {
      const taskData = task.msg as {
        to?: string;
      };

      logger.error(`Error processing email task ${task.msg_id} (attempt ${attemptCount}):`, error);

      // Проверяем, можно ли повторить попытку
      if (shouldRetry(queueTask, { ...DEFAULT_RETRY_CONFIG, maxAttempts: MAX_RETRY_ATTEMPTS })) {
        await returnTaskToQueue('email_queue', task.msg_id);
        const nextAttempt = attemptCount + 1;
        logger.warn(
          `Email task ${task.msg_id} will retry (attempt ${nextAttempt}/${MAX_RETRY_ATTEMPTS})`
        );
      } else {
        // Превышен лимит попыток - архивируем как неудачную
        await archiveTask('email_queue', task.msg_id);
        logger.error(
          `Email task ${task.msg_id} failed after ${attemptCount} attempts. Task archived.`
        );
        processed++; // Считаем как обработанную (хоть и неудачно)
      }
    }
  }

  return processed;
}






