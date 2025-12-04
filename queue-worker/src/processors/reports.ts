import { readFromQueue, archiveTask, returnTaskToQueue } from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import {
  shouldRetry,
  getCurrentAttemptCount,
  type QueueTask,
  DEFAULT_RETRY_CONFIG,
} from '../utils/retry.js';

const MAX_RETRY_ATTEMPTS = parseInt(process.env.MAX_REPORT_RETRY_ATTEMPTS || '3', 10);

export async function processReportQueue(maxTasks: number = 5): Promise<number> {
  let processed = 0;

  for (let i = 0; i < maxTasks; i++) {
    const task = await readFromQueue('report_generation_queue', 5);

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

    try {
      const reportData = task.msg as {
        assessment_id: string;
        user_id: string;
        report_type: string;
      };

      const attemptCount = getCurrentAttemptCount(queueTask);

      logger.info(
        `Processing report generation (attempt ${attemptCount}/${MAX_RETRY_ATTEMPTS}): ${reportData.assessment_id}`
      );

      // TODO: Реализуйте генерацию PDF отчета
      // const pdfBuffer = await generatePDFReport(reportData.assessment_id);
      // await saveReportToStorage(reportData.assessment_id, pdfBuffer);

      logger.info(`Report generated for assessment ${reportData.assessment_id}`);
      await archiveTask('report_generation_queue', task.msg_id);
      processed++;
    } catch (error) {
      logger.error(`Error processing report task ${task.msg_id} (attempt ${attemptCount}):`, error);

      // Проверяем, можно ли повторить попытку
      if (shouldRetry(queueTask, { ...DEFAULT_RETRY_CONFIG, maxAttempts: MAX_RETRY_ATTEMPTS })) {
        await returnTaskToQueue('report_generation_queue', task.msg_id);
        const nextAttempt = attemptCount + 1;
        logger.warn(
          `Report task ${task.msg_id} will retry (attempt ${nextAttempt}/${MAX_RETRY_ATTEMPTS})`
        );
      } else {
        // Превышен лимит попыток - архивируем
        await archiveTask('report_generation_queue', task.msg_id);
        logger.error(
          `Report task ${task.msg_id} failed after ${attemptCount} attempts. Task archived.`
        );
        processed++;
      }
    }
  }

  return processed;
}






