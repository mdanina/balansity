/**
 * AssemblyAI Transcription Service
 * Адаптировано из PsiPilot для Balansity
 */

import { logger } from '../utils/logger.js';
import { supabase } from './supabase.js';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '';
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

interface TranscriptResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  utterances?: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
  }>;
  error?: string;
}

interface RecordingData {
  id: string;
  file_path: string;
  transcript_id?: string;
  transcript_status?: string;
  user_id: string;
  appointment_id?: string;
}

/**
 * Инициирует транскрибацию аудио файла
 */
export async function initiateTranscription(
  recordingId: string,
  userId: string
): Promise<{ transcriptId: string; status: string }> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLYAI_API_KEY не настроен');
  }

  // Получаем данные записи
  const { data: recording, error: fetchError } = await supabase
    .from('recordings')
    .select('id, file_path, user_id, appointment_id')
    .eq('id', recordingId)
    .single();

  if (fetchError || !recording) {
    throw new Error(`Запись не найдена: ${recordingId}`);
  }

  // Проверяем права доступа
  if (recording.user_id !== userId) {
    throw new Error('Нет доступа к этой записи');
  }

  // Генерируем signed URL для аудио файла
  const { data: signedUrlData, error: urlError } = await supabase
    .storage
    .from('recordings')
    .createSignedUrl(recording.file_path, 3600); // 1 час

  if (urlError || !signedUrlData?.signedUrl) {
    throw new Error(`Не удалось получить URL файла: ${urlError?.message}`);
  }

  // Отправляем запрос на транскрибацию
  const transcriptResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: 'POST',
    headers: {
      'Authorization': ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: signedUrlData.signedUrl,
      language_code: 'ru',
      speaker_labels: true,
      webhook_url: WEBHOOK_URL ? `${WEBHOOK_URL}/api/webhook/assemblyai` : undefined,
    }),
  });

  if (!transcriptResponse.ok) {
    const errorText = await transcriptResponse.text();
    throw new Error(`AssemblyAI error: ${transcriptResponse.status} - ${errorText}`);
  }

  const transcriptData: TranscriptResponse = await transcriptResponse.json();

  // Сохраняем transcript_id в записи
  const { error: updateError } = await supabase
    .from('recordings')
    .update({
      transcript_id: transcriptData.id,
      transcript_status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordingId);

  if (updateError) {
    logger.error(`Failed to update recording with transcript_id: ${updateError.message}`);
  }

  logger.info(`Transcription initiated for recording ${recordingId}, transcript_id: ${transcriptData.id}`);

  return {
    transcriptId: transcriptData.id,
    status: transcriptData.status,
  };
}

/**
 * Проверяет статус транскрибации и синхронизирует результат
 */
export async function syncTranscriptionStatus(
  recordingId: string,
  userId: string
): Promise<{ status: string; text?: string; synced: boolean }> {
  // Получаем данные записи
  const { data: recording, error: fetchError } = await supabase
    .from('recordings')
    .select('id, transcript_id, transcript_status, transcript, user_id')
    .eq('id', recordingId)
    .single();

  if (fetchError || !recording) {
    throw new Error(`Запись не найдена: ${recordingId}`);
  }

  if (recording.user_id !== userId) {
    throw new Error('Нет доступа к этой записи');
  }

  if (!recording.transcript_id) {
    return { status: 'not_started', synced: false };
  }

  // Если уже завершено, возвращаем кешированный результат
  if (recording.transcript_status === 'completed' && recording.transcript) {
    return {
      status: 'completed',
      text: recording.transcript,
      synced: false,
    };
  }

  // Запрашиваем статус у AssemblyAI
  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${recording.transcript_id}`, {
    headers: {
      'Authorization': ASSEMBLYAI_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`AssemblyAI status check failed: ${response.status}`);
  }

  const data: TranscriptResponse = await response.json();

  // Обновляем статус в базе
  if (data.status === 'completed' && data.text) {
    const formattedText = formatTranscriptWithSpeakers(data);

    await supabase
      .from('recordings')
      .update({
        transcript_status: 'completed',
        transcript: formattedText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordingId);

    return {
      status: 'completed',
      text: formattedText,
      synced: true,
    };
  }

  if (data.status === 'error') {
    await supabase
      .from('recordings')
      .update({
        transcript_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordingId);

    return {
      status: 'error',
      synced: true,
    };
  }

  return {
    status: data.status,
    synced: true,
  };
}

/**
 * Обрабатывает webhook от AssemblyAI
 */
export async function handleAssemblyAIWebhook(
  transcriptId: string,
  status: string,
  text?: string,
  utterances?: Array<{ speaker: string; text: string; start: number; end: number }>,
  error?: string
): Promise<{ recordingId: string; updated: boolean }> {
  logger.info(`AssemblyAI webhook received: ${transcriptId}, status: ${status}`);

  // Находим запись по transcript_id
  const { data: recording, error: fetchError } = await supabase
    .from('recordings')
    .select('id')
    .eq('transcript_id', transcriptId)
    .single();

  if (fetchError || !recording) {
    logger.warn(`Recording not found for transcript_id: ${transcriptId}`);
    return { recordingId: '', updated: false };
  }

  if (status === 'completed' && text) {
    const formattedText = utterances
      ? formatUtterances(utterances)
      : text;

    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        transcript_status: 'completed',
        transcript: formattedText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recording.id);

    if (updateError) {
      logger.error(`Failed to update transcription: ${updateError.message}`);
      return { recordingId: recording.id, updated: false };
    }

    logger.info(`Transcription completed for recording ${recording.id}`);
    return { recordingId: recording.id, updated: true };
  }

  if (status === 'error') {
    await supabase
      .from('recordings')
      .update({
        transcript_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recording.id);

    return { recordingId: recording.id, updated: true };
  }

  return { recordingId: recording.id, updated: false };
}

/**
 * Форматирует транскрипт с метками спикеров
 */
function formatTranscriptWithSpeakers(data: TranscriptResponse): string {
  if (!data.utterances || data.utterances.length === 0) {
    return data.text || '';
  }

  return formatUtterances(data.utterances);
}

/**
 * Форматирует utterances в читаемый текст
 */
function formatUtterances(
  utterances: Array<{ speaker: string; text: string; start: number; end: number }>
): string {
  const speakerLabels: Record<string, string> = {
    'A': 'Специалист',
    'B': 'Клиент',
    'C': 'Участник 3',
    'D': 'Участник 4',
  };

  return utterances
    .map(u => {
      const label = speakerLabels[u.speaker] || `Спикер ${u.speaker}`;
      return `${label}: ${u.text}`;
    })
    .join('\n\n');
}

/**
 * Получает транскрипт записи
 */
export async function getRecordingTranscript(
  recordingId: string,
  userId: string
): Promise<{ text: string | null; status: string }> {
  const { data: recording, error } = await supabase
    .from('recordings')
    .select('transcript, transcript_status, user_id')
    .eq('id', recordingId)
    .single();

  if (error || !recording) {
    throw new Error(`Запись не найдена: ${recordingId}`);
  }

  if (recording.user_id !== userId) {
    throw new Error('Нет доступа к этой записи');
  }

  return {
    text: recording.transcript,
    status: recording.transcript_status || 'pending',
  };
}

/**
 * Проверяет доступность AssemblyAI API
 */
export async function checkAssemblyAIHealth(): Promise<{ available: boolean; error?: string }> {
  if (!ASSEMBLYAI_API_KEY) {
    return { available: false, error: 'API key not configured' };
  }

  try {
    const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: 'GET',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
      },
    });

    // AssemblyAI returns 200 for list endpoint
    return {
      available: response.ok || response.status === 401, // 401 means key is there but invalid
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
