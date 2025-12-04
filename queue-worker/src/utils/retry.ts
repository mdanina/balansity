/**
 * Retry utility with exponential backoff for queue tasks
 * Prevents infinite retry loops by tracking attempt count
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 60 seconds
  backoffMultiplier: 2,
};

export interface TaskMetadata {
  attempt_count?: number;
  first_attempt_at?: string;
  last_attempt_at?: string;
  next_retry_at?: string;
}

export interface QueueTask {
  msg_id: number;
  read_ct: number; // PGMQ built-in read count (starts from 0)
  enqueued_at: string;
  vt: string;
  msg: any;
}

/**
 * Calculate delay for next retry attempt using exponential backoff
 */
export function calculateRetryDelay(attemptCount: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attemptCount - 1),
    config.maxDelayMs
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay; // 0-30% jitter
  return Math.floor(delay + jitter);
}

/**
 * Get current attempt count from task
 * Uses read_ct from pgmq (which is 0-indexed) + 1 for current attempt
 */
export function getCurrentAttemptCount(task: QueueTask): number {
  // read_ct is 0-indexed (0 = first read, 1 = second read, etc.)
  // So current attempt = read_ct + 1
  return task.read_ct + 1;
}

/**
 * Check if task should be retried based on read_ct
 */
export function shouldRetry(task: QueueTask, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  const attemptCount = getCurrentAttemptCount(task);
  return attemptCount < config.maxAttempts;
}

/**
 * Get next attempt count (for logging)
 */
export function getNextAttemptCount(task: QueueTask): number {
  return getCurrentAttemptCount(task) + 1;
}

/**
 * Create updated metadata for retry (for logging and tracking)
 * Note: read_ct is managed by pgmq automatically
 */
export function createRetryMetadata(
  task: QueueTask,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): TaskMetadata {
  const attemptCount = getCurrentAttemptCount(task);
  const now = new Date().toISOString();
  const delay = calculateRetryDelay(attemptCount, config);
  const nextRetryAt = new Date(Date.now() + delay).toISOString();

  // Try to preserve existing metadata from message
  const existingMetadata = (task.msg as any)?.metadata || {};

  return {
    attempt_count: attemptCount,
    first_attempt_at: existingMetadata.first_attempt_at || task.enqueued_at,
    last_attempt_at: now,
    next_retry_at: nextRetryAt,
  };
}

/**
 * Check if task has exceeded max retries and should be archived/failed
 */
export function hasExceededMaxRetries(task: QueueTask, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  const attemptCount = getCurrentAttemptCount(task);
  return attemptCount >= config.maxAttempts;
}

