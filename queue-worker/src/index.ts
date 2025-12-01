import 'dotenv/config';
import { processEmailQueue } from './processors/email.js';
import { processReportQueue } from './processors/reports.js';
import { processPaymentQueue } from './processors/payments.js';
import { logger } from './utils/logger.js';

const WORKER_INTERVAL_MS = parseInt(process.env.WORKER_INTERVAL_MS || '5000');
const MAX_TASKS_PER_CYCLE = parseInt(process.env.MAX_TASKS_PER_CYCLE || '10');

async function processQueues() {
  try {
    logger.info('Starting queue processing cycle...');

    const [emailsProcessed, reportsProcessed, paymentsProcessed] = await Promise.all([
      processEmailQueue(MAX_TASKS_PER_CYCLE),
      processReportQueue(5), // Отчеты обрабатываем меньше
      processPaymentQueue(MAX_TASKS_PER_CYCLE),
    ]);

    if (emailsProcessed > 0 || reportsProcessed > 0 || paymentsProcessed > 0) {
      logger.info(
        `Processed: ${emailsProcessed} emails, ${reportsProcessed} reports, ${paymentsProcessed} payments`
      );
    }
  } catch (error) {
    logger.error('Error in queue processing cycle:', error);
  }
}

// Запускаем обработку очередей
logger.info('Queue Worker started');
logger.info(`Interval: ${WORKER_INTERVAL_MS}ms`);
logger.info(`Max tasks per cycle: ${MAX_TASKS_PER_CYCLE}`);

// Первый запуск сразу
processQueues();

// Затем каждые N миллисекунд
setInterval(processQueues, WORKER_INTERVAL_MS);

// Обработка завершения процесса
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});



