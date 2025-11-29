// Система логирования для проекта
// Отключает логи в production, но всегда показывает ошибки

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

interface LogLevel {
  log: 'log';
  info: 'info';
  warn: 'warn';
  error: 'error';
}

class Logger {
  private shouldLog(level: keyof LogLevel): boolean {
    if (level === 'error') return true; // Всегда логируем ошибки
    return isDev && !isTest;
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log('[LOG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    console.error('[ERROR]', ...args);
    // TODO: Здесь можно добавить отправку в Sentry/другой сервис
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(args[0]);
    // }
  }
}

export const logger = new Logger();



