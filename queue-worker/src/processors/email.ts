import { readFromQueue, archiveTask, returnTaskToQueue } from '../services/supabase.js';
import { emailService } from '../services/email.js';
import { logger } from '../utils/logger.js';

export async function processEmailQueue(maxTasks: number = 10): Promise<number> {
  let processed = 0;

  for (let i = 0; i < maxTasks; i++) {
    const task = await readFromQueue('email_queue', 5);

    if (!task) {
      break; // Нет задач
    }

    try {
      const emailData = task.msg as {
        to: string;
        subject: string;
        template: string;
        variables: Record<string, any>;
      };

      logger.info(`Processing email task: ${emailData.to} - ${emailData.subject}`);

      const success = await emailService.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
        variables: emailData.variables || {},
      });

      if (success) {
        await archiveTask('email_queue', task.msg_id);
        processed++;
        logger.info(`Email sent successfully to ${emailData.to}`);
      } else {
        // Возвращаем задачу в очередь для повторной попытки
        await returnTaskToQueue('email_queue', task.msg_id);
        logger.warn(`Failed to send email to ${emailData.to}, returned to queue`);
      }
    } catch (error) {
      logger.error(`Error processing email task ${task.msg_id}:`, error);
      // Возвращаем задачу в очередь
      await returnTaskToQueue('email_queue', task.msg_id);
    }
  }

  return processed;
}

