import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { paymentsRouter } from './routes/payments.js';
import { webhookRouter } from './routes/webhook.js';
import { jitsiWebhookRouter } from './routes/jitsi-webhook.js';
import { logger } from '../utils/logger.js';

export function createApiServer() {
  const app = express();
  const PORT = process.env.API_PORT || 3001;

  // CORS настройки
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin: frontendUrl,
      credentials: true,
    })
  );

  // Body parser
  app.use(express.json());

  // Debug: логируем ВСЕ запросы
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`[REQUEST] ${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'balansity-api' });
  });

  // API роуты
  logger.info('Registering routes...');
  logger.info(`paymentsRouter type: ${typeof paymentsRouter}`);
  logger.info(`jitsiWebhookRouter type: ${typeof jitsiWebhookRouter}`);
  logger.info(`webhookRouter type: ${typeof webhookRouter}`);

  app.use('/api/payments', paymentsRouter);
  app.use('/api/webhook/jitsi', jitsiWebhookRouter);
  app.use('/api/webhook', webhookRouter);

  logger.info('Routes registered successfully');

  // Обработка 404
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Обработка ошибок
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Запуск сервера
  const server = app.listen(PORT, () => {
    logger.info(`API Server running on port ${PORT}`);
    logger.info(`Frontend URL: ${frontendUrl}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down API server...');
    server.close(() => {
      logger.info('API server closed');
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}






