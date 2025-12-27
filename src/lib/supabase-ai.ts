/**
 * API для работы с AI-анализом сессий
 * Функции для работы с шаблонами, клиническими заметками и секциями
 */

import { supabase } from './supabase';
import type {
  NoteBlockTemplate,
  ClinicalNoteTemplate,
  GeneratedClinicalNote,
  GeneratedSection,
  GenerationProgress,
  GenerateRequest,
} from '@/types/ai.types';

// URL backend сервиса для AI endpoints
const AI_API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Получить заголовки для аутентификации
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Необходима авторизация');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

// ============================================================================
// Блоки и шаблоны
// ============================================================================

/**
 * Получить список доступных блоков шаблонов
 */
export async function getBlockTemplates(): Promise<NoteBlockTemplate[]> {
  const { data, error } = await supabase
    .from('note_block_templates')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Получить список шаблонов клинических заметок
 */
export async function getNoteTemplates(): Promise<ClinicalNoteTemplate[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('clinical_note_templates')
    .select('*')
    .eq('is_active', true)
    .or(`is_system.eq.true,user_id.eq.${user?.id},user_id.is.null`)
    .order('is_default', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Обновить порядок блоков в шаблоне клинической заметки
 */
export async function updateNoteTemplateBlockOrder(
  templateId: string,
  blockTemplateIds: string[]
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { data: template, error: fetchError } = await supabase
    .from('clinical_note_templates')
    .select('is_system, user_id')
    .eq('id', templateId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!template) throw new Error('Шаблон не найден');
  if (template.is_system) throw new Error('Системные шаблоны нельзя редактировать');
  if (template.user_id !== user.id) throw new Error('Вы можете редактировать только свои шаблоны');

  const { error } = await supabase
    .from('clinical_note_templates')
    .update({ block_template_ids: blockTemplateIds })
    .eq('id', templateId);

  if (error) throw new Error(error.message);
}

/**
 * Добавить блок в шаблон клинической заметки
 */
export async function addBlockToTemplate(
  templateId: string,
  blockTemplateId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { data: template, error: fetchError } = await supabase
    .from('clinical_note_templates')
    .select('block_template_ids, is_system, user_id')
    .eq('id', templateId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!template) throw new Error('Шаблон не найден');
  if (template.is_system) throw new Error('Системные шаблоны нельзя редактировать');
  if (template.user_id !== user.id) throw new Error('Вы можете редактировать только свои шаблоны');

  if (template.block_template_ids.includes(blockTemplateId)) {
    throw new Error('Блок уже добавлен в шаблон');
  }

  const newBlockIds = [...template.block_template_ids, blockTemplateId];

  const { error } = await supabase
    .from('clinical_note_templates')
    .update({ block_template_ids: newBlockIds })
    .eq('id', templateId);

  if (error) throw new Error(error.message);
}

/**
 * Удалить блок из шаблона клинической заметки
 */
export async function removeBlockFromTemplate(
  templateId: string,
  blockTemplateId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { data: template, error: fetchError } = await supabase
    .from('clinical_note_templates')
    .select('block_template_ids, is_system, user_id')
    .eq('id', templateId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!template) throw new Error('Шаблон не найден');
  if (template.is_system) throw new Error('Системные шаблоны нельзя редактировать');
  if (template.user_id !== user.id) throw new Error('Вы можете редактировать только свои шаблоны');

  const newBlockIds = template.block_template_ids.filter(
    (id: string) => id !== blockTemplateId
  );

  const { error } = await supabase
    .from('clinical_note_templates')
    .update({ block_template_ids: newBlockIds })
    .eq('id', templateId);

  if (error) throw new Error(error.message);
}

/**
 * Создать новый шаблон клинической заметки
 */
export async function createNoteTemplate(
  name: string,
  nameEn: string | null,
  description: string | null,
  blockTemplateIds: string[],
  isDefault: boolean = false
): Promise<ClinicalNoteTemplate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Если устанавливаем как шаблон по умолчанию, снимаем флаг с других
  if (isDefault) {
    await supabase
      .from('clinical_note_templates')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('clinical_note_templates')
    .insert({
      user_id: user.id,
      name,
      name_en: nameEn,
      description,
      block_template_ids: blockTemplateIds,
      is_default: isDefault,
      is_system: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ClinicalNoteTemplate;
}

// ============================================================================
// Клинические заметки
// ============================================================================

/**
 * Создать новую клиническую заметку
 */
export async function createClinicalNote(
  request: GenerateRequest
): Promise<GeneratedClinicalNote> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем шаблон для создания секций
  const { data: template, error: templateError } = await supabase
    .from('clinical_note_templates')
    .select('*, blocks:note_block_templates(*)')
    .eq('id', request.template_id)
    .single();

  if (templateError) throw new Error(templateError.message);
  if (!template) throw new Error('Шаблон не найден');

  // Получаем блоки в правильном порядке
  const blockIds = template.block_template_ids as string[];
  const { data: blocks } = await supabase
    .from('note_block_templates')
    .select('*')
    .in('id', blockIds);

  const orderedBlocks = blockIds
    .map(id => blocks?.find(b => b.id === id))
    .filter(Boolean) as NoteBlockTemplate[];

  // Создаем клиническую заметку
  const { data: clinicalNote, error: noteError } = await supabase
    .from('clinical_notes')
    .insert({
      appointment_id: request.appointment_id || null,
      user_id: user.id,
      client_user_id: request.client_user_id || null,
      template_id: request.template_id,
      title: 'Клиническая заметка',
      note_type: 'session_note',
      source_transcript: request.transcript || null,
      source_notes: request.notes || null,
      generation_status: 'draft',
      status: 'draft',
    })
    .select()
    .single();

  if (noteError) throw new Error(noteError.message);

  // Создаем секции
  const sectionsToInsert = orderedBlocks.map((block, index) => ({
    clinical_note_id: clinicalNote.id,
    block_template_id: block.id,
    name: block.name,
    slug: block.slug,
    position: index,
    generation_status: 'pending',
  }));

  const { error: sectionsError } = await supabase
    .from('clinical_note_sections')
    .insert(sectionsToInsert);

  if (sectionsError) throw new Error(sectionsError.message);

  // Возвращаем заметку с секциями
  return getClinicalNote(clinicalNote.id);
}

/**
 * Запустить генерацию клинической заметки через AI API
 * Если AI_API_URL не настроен, только создает заметку без генерации
 */
export async function generateClinicalNote(
  request: GenerateRequest
): Promise<{ clinical_note_id: string; status: string; sections_count: number }> {
  // Сначала создаем заметку
  const clinicalNote = await createClinicalNote(request);

  // Если есть AI API, запускаем генерацию
  if (AI_API_URL) {
    try {
      const response = await fetch(`${AI_API_URL}/api/ai/generate`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          clinical_note_id: clinicalNote.id,
          source_type: request.source_type,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        console.error('AI generation error:', error);
        // Не бросаем ошибку, заметка уже создана
      }
    } catch (error) {
      console.error('AI API error:', error);
      // Не бросаем ошибку, заметка уже создана
    }
  }

  return {
    clinical_note_id: clinicalNote.id,
    status: AI_API_URL ? 'generating' : 'draft',
    sections_count: clinicalNote.sections?.length || 0,
  };
}

/**
 * Получить статус генерации клинической заметки
 */
export async function getGenerationStatus(
  clinicalNoteId: string
): Promise<GenerationProgress> {
  const { data: note, error: noteError } = await supabase
    .from('clinical_notes')
    .select('id, generation_status')
    .eq('id', clinicalNoteId)
    .single();

  if (noteError) throw new Error(noteError.message);

  const { data: sections, error: sectionsError } = await supabase
    .from('clinical_note_sections')
    .select('id, name, generation_status')
    .eq('clinical_note_id', clinicalNoteId)
    .order('position', { ascending: true });

  if (sectionsError) throw new Error(sectionsError.message);

  const sectionsList = sections || [];
  const completed = sectionsList.filter(s => s.generation_status === 'completed').length;
  const failed = sectionsList.filter(s => s.generation_status === 'failed').length;

  return {
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
  };
}

/**
 * Получить клиническую заметку с секциями
 */
export async function getClinicalNote(
  clinicalNoteId: string
): Promise<GeneratedClinicalNote> {
  const { data, error } = await supabase
    .from('clinical_notes')
    .select(`
      *,
      sections:clinical_note_sections (
        *,
        block_template:note_block_templates (*)
      ),
      template:clinical_note_templates (*)
    `)
    .eq('id', clinicalNoteId)
    .is('deleted_at', null)
    .single();

  if (error) throw new Error(error.message);
  return data as GeneratedClinicalNote;
}

/**
 * Получить клинические заметки для консультации
 */
export async function getClinicalNotesForAppointment(
  appointmentId: string
): Promise<GeneratedClinicalNote[]> {
  const { data, error } = await supabase
    .from('clinical_notes')
    .select(`
      *,
      sections:clinical_note_sections (
        *,
        block_template:note_block_templates (*)
      ),
      template:clinical_note_templates (*)
    `)
    .eq('appointment_id', appointmentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as GeneratedClinicalNote[];
}

/**
 * Получить клинические заметки для клиента
 */
export async function getClinicalNotesForClient(
  clientUserId: string
): Promise<GeneratedClinicalNote[]> {
  const { data, error } = await supabase
    .from('clinical_notes')
    .select(`
      *,
      sections:clinical_note_sections (
        *,
        block_template:note_block_templates (*)
      ),
      template:clinical_note_templates (*)
    `)
    .eq('client_user_id', clientUserId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as GeneratedClinicalNote[];
}

/**
 * Получить все клинические заметки текущего пользователя
 */
export async function getMyClinicalNotes(): Promise<GeneratedClinicalNote[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { data, error } = await supabase
    .from('clinical_notes')
    .select(`
      *,
      sections:clinical_note_sections (
        *,
        block_template:note_block_templates (*)
      ),
      template:clinical_note_templates (*)
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as GeneratedClinicalNote[];
}

/**
 * Обновить контент секции (ручное редактирование)
 */
export async function updateSectionContent(
  sectionId: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('clinical_note_sections')
    .update({
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', sectionId);

  if (error) throw new Error(error.message);
}

/**
 * Обновить AI контент секции
 */
export async function updateSectionAIContent(
  sectionId: string,
  aiContent: string
): Promise<void> {
  const { error } = await supabase
    .from('clinical_note_sections')
    .update({
      ai_content: aiContent,
      ai_generated_at: new Date().toISOString(),
      generation_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', sectionId);

  if (error) throw new Error(error.message);
}

/**
 * Обновить транскрипт клинической заметки
 */
export async function updateClinicalNoteTranscript(
  clinicalNoteId: string,
  transcript: string
): Promise<void> {
  const { error } = await supabase
    .from('clinical_notes')
    .update({
      source_transcript: transcript,
      updated_at: new Date().toISOString()
    })
    .eq('id', clinicalNoteId);

  if (error) throw new Error(error.message);
}

/**
 * Обновить заметки специалиста
 */
export async function updateClinicalNoteNotes(
  clinicalNoteId: string,
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from('clinical_notes')
    .update({
      source_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', clinicalNoteId);

  if (error) throw new Error(error.message);
}

/**
 * Финализировать клиническую заметку
 */
export async function finalizeClinicalNote(
  clinicalNoteId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { data: note, error: fetchError } = await supabase
    .from('clinical_notes')
    .select('id, status, user_id')
    .eq('id', clinicalNoteId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!note) throw new Error('Заметка не найдена');
  if (note.user_id !== user.id) throw new Error('Вы можете сохранять только свои заметки');
  if (note.status === 'finalized' || note.status === 'signed') {
    throw new Error('Заметка уже сохранена');
  }

  const { error } = await supabase
    .from('clinical_notes')
    .update({
      status: 'finalized',
      updated_at: new Date().toISOString()
    })
    .eq('id', clinicalNoteId);

  if (error) throw new Error(error.message);
}

/**
 * Soft delete клинической заметки
 */
export async function deleteClinicalNote(
  clinicalNoteId: string
): Promise<void> {
  const { error } = await supabase
    .from('clinical_notes')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', clinicalNoteId);

  if (error) throw new Error(error.message);
}

/**
 * Перегенерировать секцию через AI API
 */
export async function regenerateSection(
  sectionId: string,
  customPrompt?: string
): Promise<{ section_id: string; status: string; ai_content: string }> {
  if (!AI_API_URL) {
    throw new Error('AI сервис не настроен');
  }

  const response = await fetch(
    `${AI_API_URL}/api/ai/regenerate-section/${sectionId}`,
    {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ custom_prompt: customPrompt }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}
