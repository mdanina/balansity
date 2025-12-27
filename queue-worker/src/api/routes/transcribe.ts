/**
 * Transcription API Routes
 * Эндпоинты для транскрибации аудио через AssemblyAI
 */

import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import {
  initiateTranscription,
  syncTranscriptionStatus,
  handleAssemblyAIWebhook,
  getRecordingTranscript,
  checkAssemblyAIHealth,
} from '../../services/transcription.js';
import { verifyAuthToken } from '../middleware/auth.js';

export const transcribeRouter = Router();

/**
 * POST /api/transcribe
 * Инициирует транскрибацию аудио записи
 */
transcribeRouter.post('/', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const { recording_id } = req.body;
    const userId = (req as any).userId;

    if (!recording_id) {
      return res.status(400).json({ error: 'recording_id is required' });
    }

    const result = await initiateTranscription(recording_id, userId);

    res.json({
      success: true,
      data: {
        recording_id,
        transcript_id: result.transcriptId,
        status: result.status,
      },
    });
  } catch (error) {
    logger.error('Transcription initiation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to initiate transcription',
    });
  }
});

/**
 * POST /api/transcribe/:recordingId/sync
 * Синхронизирует статус транскрибации с AssemblyAI
 */
transcribeRouter.post('/:recordingId/sync', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    const userId = (req as any).userId;

    const result = await syncTranscriptionStatus(recordingId, userId);

    res.json({
      success: true,
      data: {
        recording_id: recordingId,
        status: result.status,
        text: result.text,
        synced: result.synced,
      },
    });
  } catch (error) {
    logger.error('Transcription sync error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to sync transcription status',
    });
  }
});

/**
 * GET /api/transcribe/:recordingId/status
 * Получает текущий статус транскрибации
 */
transcribeRouter.get('/:recordingId/status', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    const userId = (req as any).userId;

    const result = await getRecordingTranscript(recordingId, userId);

    res.json({
      success: true,
      data: {
        recording_id: recordingId,
        status: result.status,
        has_text: !!result.text,
      },
    });
  } catch (error) {
    logger.error('Transcription status error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transcription status',
    });
  }
});

/**
 * GET /api/transcribe/:recordingId/text
 * Получает текст транскрипции
 */
transcribeRouter.get('/:recordingId/text', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    const userId = (req as any).userId;

    const result = await getRecordingTranscript(recordingId, userId);

    if (!result.text) {
      return res.status(404).json({
        error: 'Transcription not available',
        status: result.status,
      });
    }

    res.json({
      success: true,
      data: {
        recording_id: recordingId,
        status: result.status,
        text: result.text,
      },
    });
  } catch (error) {
    logger.error('Get transcription text error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transcription text',
    });
  }
});

/**
 * GET /api/transcribe/health
 * Проверяет доступность AssemblyAI API
 */
transcribeRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await checkAssemblyAIHealth();

    res.json({
      service: 'assemblyai',
      available: health.available,
      error: health.error,
    });
  } catch (error) {
    res.status(500).json({
      service: 'assemblyai',
      available: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

/**
 * POST /api/webhook/assemblyai
 * Webhook для получения результатов от AssemblyAI
 */
export const assemblyAIWebhookRouter = Router();

assemblyAIWebhookRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { transcript_id, status, text, utterances, error } = req.body;

    if (!transcript_id) {
      logger.warn('AssemblyAI webhook received without transcript_id');
      return res.status(400).json({ error: 'transcript_id is required' });
    }

    const result = await handleAssemblyAIWebhook(
      transcript_id,
      status,
      text,
      utterances,
      error
    );

    res.json({
      success: true,
      recording_id: result.recordingId,
      updated: result.updated,
    });
  } catch (error) {
    logger.error('AssemblyAI webhook error:', error);
    // Всегда возвращаем 200 для webhooks, чтобы AssemblyAI не повторял запрос
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed',
    });
  }
});
