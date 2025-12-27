/**
 * AI Generation API Routes
 * Эндпоинты для генерации клинических заметок через OpenAI
 */

import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../services/supabase.js';
import {
  generateBlockContent,
  generateCaseSummary,
  generatePatientSummary,
  checkOpenAIHealth,
} from '../../services/openai.js';
import { verifyAuthToken } from '../middleware/auth.js';

export const aiRouter = Router();

/**
 * GET /api/ai/block-templates
 * Получает список доступных шаблонов блоков
 */
aiRouter.get('/block-templates', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('note_block_templates')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get block templates error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get block templates',
    });
  }
});

/**
 * GET /api/ai/note-templates
 * Получает список шаблонов клинических заметок
 */
aiRouter.get('/note-templates', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data, error } = await supabase
      .from('clinical_note_templates')
      .select('*')
      .eq('is_active', true)
      .or(`is_system.eq.true,user_id.eq.${userId},user_id.is.null`)
      .order('is_default', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get note templates error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get note templates',
    });
  }
});

/**
 * POST /api/ai/generate
 * Запускает генерацию клинической заметки
 */
aiRouter.post('/generate', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { clinical_note_id, source_type } = req.body;

    if (!clinical_note_id) {
      return res.status(400).json({ error: 'clinical_note_id is required' });
    }

    // Получаем клиническую заметку с секциями
    const { data: clinicalNote, error: noteError } = await supabase
      .from('clinical_notes')
      .select(`
        *,
        sections:clinical_note_sections (
          *,
          block_template:note_block_templates (*)
        )
      `)
      .eq('id', clinical_note_id)
      .eq('user_id', userId)
      .single();

    if (noteError || !clinicalNote) {
      return res.status(404).json({ error: 'Clinical note not found' });
    }

    // Обновляем статус на generating
    await supabase
      .from('clinical_notes')
      .update({ generation_status: 'generating' })
      .eq('id', clinical_note_id);

    // Запускаем генерацию в фоне
    generateSectionsInBackground(clinical_note_id, clinicalNote, source_type);

    res.json({
      success: true,
      data: {
        clinical_note_id,
        status: 'generating',
        sections_count: clinicalNote.sections?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Generate clinical note error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start generation',
    });
  }
});

/**
 * Генерирует секции в фоновом режиме
 */
async function generateSectionsInBackground(
  clinicalNoteId: string,
  clinicalNote: any,
  sourceType: 'transcript' | 'notes' | 'combined'
): Promise<void> {
  const sections = clinicalNote.sections || [];
  let completedCount = 0;
  let failedCount = 0;

  for (const section of sections) {
    try {
      // Обновляем статус секции
      await supabase
        .from('clinical_note_sections')
        .update({ generation_status: 'generating' })
        .eq('id', section.id);

      // Получаем system prompt из шаблона блока
      const systemPrompt = section.block_template?.system_prompt;
      if (!systemPrompt) {
        throw new Error('No system prompt for block template');
      }

      // Определяем источник данных
      let transcript = '';
      let notes = '';

      if (sourceType === 'transcript' || sourceType === 'combined') {
        transcript = clinicalNote.source_transcript || '';
      }
      if (sourceType === 'notes' || sourceType === 'combined') {
        notes = clinicalNote.source_notes || '';
      }

      if (!transcript && !notes) {
        throw new Error('No source data for generation');
      }

      // Генерируем контент
      const aiContent = await generateBlockContent(systemPrompt, transcript, notes);

      // Сохраняем результат
      await supabase
        .from('clinical_note_sections')
        .update({
          ai_content: aiContent,
          ai_generated_at: new Date().toISOString(),
          generation_status: 'completed',
        })
        .eq('id', section.id);

      completedCount++;
      logger.info(`Section ${section.id} generated successfully`);

    } catch (error) {
      failedCount++;
      logger.error(`Section ${section.id} generation failed:`, error);

      await supabase
        .from('clinical_note_sections')
        .update({
          generation_status: 'failed',
          generation_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', section.id);
    }
  }

  // Обновляем финальный статус заметки
  const finalStatus = failedCount === sections.length ? 'failed' : 'completed';
  await supabase
    .from('clinical_notes')
    .update({
      generation_status: finalStatus,
      ai_generated_at: new Date().toISOString(),
    })
    .eq('id', clinicalNoteId);

  logger.info(`Clinical note ${clinicalNoteId} generation finished: ${completedCount} completed, ${failedCount} failed`);
}

/**
 * GET /api/ai/generate/:clinicalNoteId/status
 * Получает статус генерации
 */
aiRouter.get('/generate/:clinicalNoteId/status', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const { clinicalNoteId } = req.params;
    const userId = (req as any).userId;

    const { data: note, error: noteError } = await supabase
      .from('clinical_notes')
      .select('id, generation_status, user_id')
      .eq('id', clinicalNoteId)
      .single();

    if (noteError || !note) {
      return res.status(404).json({ error: 'Clinical note not found' });
    }

    if (note.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: sections, error: sectionsError } = await supabase
      .from('clinical_note_sections')
      .select('id, name, generation_status')
      .eq('clinical_note_id', clinicalNoteId)
      .order('position', { ascending: true });

    if (sectionsError) throw sectionsError;

    const sectionsList = sections || [];
    const completed = sectionsList.filter(s => s.generation_status === 'completed').length;
    const failed = sectionsList.filter(s => s.generation_status === 'failed').length;

    res.json({
      success: true,
      data: {
        clinical_note_id: clinicalNoteId,
        status: note.generation_status,
        progress: {
          total: sectionsList.length,
          completed,
          failed,
        },
        sections: sectionsList.map(s => ({
          id: s.id,
          name: s.name,
          status: s.generation_status,
        })),
      },
    });
  } catch (error) {
    logger.error('Get generation status error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get generation status',
    });
  }
});

/**
 * POST /api/ai/regenerate-section/:sectionId
 * Перегенерирует отдельную секцию
 */
aiRouter.post('/regenerate-section/:sectionId', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { custom_prompt } = req.body;
    const userId = (req as any).userId;

    // Получаем секцию с клинической заметкой и шаблоном
    const { data: section, error: sectionError } = await supabase
      .from('clinical_note_sections')
      .select(`
        *,
        clinical_note:clinical_notes (*),
        block_template:note_block_templates (*)
      `)
      .eq('id', sectionId)
      .single();

    if (sectionError || !section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    if (section.clinical_note.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Обновляем статус
    await supabase
      .from('clinical_note_sections')
      .update({ generation_status: 'generating' })
      .eq('id', sectionId);

    // Генерируем контент
    const systemPrompt = section.block_template?.system_prompt;
    if (!systemPrompt) {
      throw new Error('No system prompt for block template');
    }

    const transcript = section.clinical_note.source_transcript || '';
    const notes = section.clinical_note.source_notes || '';

    const aiContent = await generateBlockContent(systemPrompt, transcript, notes, custom_prompt);

    // Сохраняем результат
    await supabase
      .from('clinical_note_sections')
      .update({
        ai_content: aiContent,
        ai_generated_at: new Date().toISOString(),
        generation_status: 'completed',
        generation_error: null,
      })
      .eq('id', sectionId);

    res.json({
      success: true,
      data: {
        section_id: sectionId,
        status: 'completed',
        ai_content: aiContent,
      },
    });
  } catch (error) {
    logger.error('Regenerate section error:', error);

    // Обновляем статус ошибки
    const { sectionId } = req.params;
    await supabase
      .from('clinical_note_sections')
      .update({
        generation_status: 'failed',
        generation_error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', sectionId);

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to regenerate section',
    });
  }
});

/**
 * POST /api/ai/case-summary
 * Генерирует резюме сессии
 */
aiRouter.post('/case-summary', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const { transcript, notes } = req.body;

    if (!transcript && !notes) {
      return res.status(400).json({ error: 'transcript or notes required' });
    }

    const summary = await generateCaseSummary(transcript || '', notes);

    res.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    logger.error('Generate case summary error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate summary',
    });
  }
});

/**
 * POST /api/ai/patient-summary
 * Генерирует комплексное резюме по всем сессиям клиента
 */
aiRouter.post('/patient-summary', verifyAuthToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { client_user_id } = req.body;

    if (!client_user_id) {
      return res.status(400).json({ error: 'client_user_id required' });
    }

    // Получаем все клинические заметки для клиента
    const { data: notes, error } = await supabase
      .from('clinical_notes')
      .select('source_transcript, source_notes, created_at')
      .eq('user_id', userId)
      .eq('client_user_id', client_user_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!notes || notes.length === 0) {
      return res.status(404).json({ error: 'No sessions found for this client' });
    }

    const sessionsData = notes.map(n => ({
      transcript: n.source_transcript,
      notes: n.source_notes,
      date: new Date(n.created_at).toLocaleDateString('ru-RU'),
    }));

    const summary = await generatePatientSummary(sessionsData);

    res.json({
      success: true,
      data: {
        summary,
        sessions_count: notes.length,
      },
    });
  } catch (error) {
    logger.error('Generate patient summary error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate patient summary',
    });
  }
});

/**
 * GET /api/ai/health
 * Проверяет доступность OpenAI API
 */
aiRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await checkOpenAIHealth();

    res.json({
      service: 'openai',
      available: health.available,
      model: health.model,
      error: health.error,
    });
  } catch (error) {
    res.status(500).json({
      service: 'openai',
      available: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});
