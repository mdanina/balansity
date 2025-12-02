import { readFromQueue, archiveTask, returnTaskToQueue } from '../services/supabase.js';
import { logger } from '../utils/logger.js';

export async function processReportQueue(maxTasks: number = 5): Promise<number> {
  let processed = 0;

  for (let i = 0; i < maxTasks; i++) {
    const task = await readFromQueue('report_generation_queue', 5);

    if (!task) {
      break;
    }

    try {
      const reportData = task.msg as {
        assessment_id: string;
        user_id: string;
        report_type: string;
      };

      logger.info(`Processing report generation: ${reportData.assessment_id}`);

      // TODO: Реализуйте генерацию PDF отчета
      // const pdfBuffer = await generatePDFReport(reportData.assessment_id);
      // await saveReportToStorage(reportData.assessment_id, pdfBuffer);

      logger.info(`Report generated for assessment ${reportData.assessment_id}`);
      await archiveTask('report_generation_queue', task.msg_id);
      processed++;
    } catch (error) {
      logger.error(`Error processing report task ${task.msg_id}:`, error);
      await returnTaskToQueue('report_generation_queue', task.msg_id);
    }
  }

  return processed;
}




