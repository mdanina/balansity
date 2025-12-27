/**
 * OpenAI Service для генерации клинических заметок
 * Адаптировано из PsiPilot для Balansity
 */

import { logger } from '../utils/logger.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const MAX_RETRIES = 4;
const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Проверяет, является ли ошибка повторяемой
 */
function isRetryableError(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Задержка на указанное количество миллисекунд
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Вызов OpenAI API с retry логикой
 */
async function callOpenAI(
  messages: OpenAIMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY не настроен');
  }

  const { temperature = 0.7, maxTokens = 2000 } = options;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`OpenAI API error (attempt ${attempt + 1}): ${response.status} - ${errorBody}`);

        if (!isRetryableError(response.status)) {
          throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
        }

        if (attempt < MAX_RETRIES) {
          const delayMs = RETRY_DELAYS[attempt] || 8000;
          logger.info(`Retrying in ${delayMs}ms...`);
          await delay(delayMs);
          continue;
        }
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI API');
      }

      logger.info(`OpenAI generation successful. Tokens used: ${data.usage?.total_tokens || 'unknown'}`);
      return data.choices[0].message.content;

    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      const delayMs = RETRY_DELAYS[attempt] || 8000;
      logger.warn(`OpenAI request failed (attempt ${attempt + 1}), retrying in ${delayMs}ms...`);
      await delay(delayMs);
    }
  }

  throw new Error('Max retries exceeded for OpenAI API');
}

/**
 * Генерирует контент для секции клинической заметки
 */
export async function generateBlockContent(
  systemPrompt: string,
  transcript: string,
  notes?: string,
  customPrompt?: string
): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: buildUserPrompt(transcript, notes, customPrompt),
    },
  ];

  return callOpenAI(messages, { temperature: 0.7, maxTokens: 1500 });
}

/**
 * Генерирует краткое резюме кейса
 */
export async function generateCaseSummary(
  transcript: string,
  notes?: string
): Promise<string> {
  const systemPrompt = `Ты — опытный психолог. Создай краткое резюме терапевтической сессии.
Включи:
- Основные темы обсуждения
- Ключевые инсайты клиента
- Прогресс по целям терапии
- Рекомендации на следующую сессию

Пиши профессионально, от третьего лица. Длина: 3-5 абзацев.`;

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: buildUserPrompt(transcript, notes) },
  ];

  return callOpenAI(messages, { temperature: 0.7, maxTokens: 2000 });
}

/**
 * Генерирует полное резюме по всем сессиям клиента
 */
export async function generatePatientSummary(
  sessionsData: Array<{ transcript?: string; notes?: string; date: string }>
): Promise<string> {
  const systemPrompt = `Ты — опытный психолог. Создай комплексное резюме по всем сессиям клиента.

Структура резюме:
1. Общая информация о клиенте
2. История обращения и динамика
3. Основные темы и паттерны
4. Достигнутый прогресс
5. Текущий статус
6. Рекомендации по продолжению работы

Пиши профессионально, структурированно, от третьего лица.`;

  const sessionsText = sessionsData
    .map((s, i) => `--- Сессия ${i + 1} (${s.date}) ---\n${s.transcript || ''}\n${s.notes ? `Заметки: ${s.notes}` : ''}`)
    .join('\n\n');

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Материалы сессий:\n\n${sessionsText}` },
  ];

  return callOpenAI(messages, { temperature: 0.7, maxTokens: 3000 });
}

/**
 * Формирует промпт пользователя
 */
function buildUserPrompt(transcript: string, notes?: string, customPrompt?: string): string {
  let prompt = '';

  if (transcript) {
    prompt += `Транскрипт сессии:\n${transcript}\n\n`;
  }

  if (notes) {
    prompt += `Заметки специалиста:\n${notes}\n\n`;
  }

  if (customPrompt) {
    prompt += `Дополнительные инструкции:\n${customPrompt}\n\n`;
  }

  if (!prompt) {
    throw new Error('Необходим транскрипт или заметки для генерации');
  }

  return prompt.trim();
}

/**
 * Проверяет доступность OpenAI API
 */
export async function checkOpenAIHealth(): Promise<{ available: boolean; model: string; error?: string }> {
  if (!OPENAI_API_KEY) {
    return { available: false, model: OPENAI_MODEL, error: 'API key not configured' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    return {
      available: response.ok,
      model: OPENAI_MODEL,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      available: false,
      model: OPENAI_MODEL,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
