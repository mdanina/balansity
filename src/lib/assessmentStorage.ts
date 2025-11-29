// Утилиты для работы с оценками (assessments) и ответами (answers) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';

type Assessment = Database['public']['Tables']['assessments']['Row'];
type AssessmentInsert = Database['public']['Tables']['assessments']['Insert'];
type AssessmentUpdate = Database['public']['Tables']['assessments']['Update'];
type Answer = Database['public']['Tables']['answers']['Row'];
type AnswerInsert = Database['public']['Tables']['answers']['Insert'];

export interface AnswerData {
  questionId: number;
  questionCode: string;
  category: string;
  value: number;
  answerType?: string;
  stepNumber: number;
}

// ============================================
// Работа с оценками (Assessments)
// ============================================

/**
 * Получить или создать активную оценку для профиля
 */
export async function getOrCreateAssessment(
  profileId: string,
  assessmentType: 'checkup' | 'parent' | 'family',
  totalSteps?: number
): Promise<string> {
  try {
    // Вызываем функцию для получения/создания активной оценки
    const { data, error } = await supabase.rpc('get_active_assessment', {
      p_profile_id: profileId,
      p_assessment_type: assessmentType,
    });

    if (error) throw error;

    const assessmentId = data as string;

    // Обновляем total_steps если нужно
    if (totalSteps) {
      await supabase
        .from('assessments')
        .update({ total_steps: totalSteps })
        .eq('id', assessmentId);
    }

    return assessmentId;
  } catch (error) {
    logger.error('Error getting/creating assessment:', error);
    throw error;
  }
}

/**
 * Получить активную оценку
 */
export async function getActiveAssessment(
  profileId: string,
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Assessment | null> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('profile_id', profileId)
      .eq('assessment_type', assessmentType)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error getting active assessment:', error);
    return null;
  }
}

/**
 * Обновить текущий шаг оценки
 */
export async function updateAssessmentStep(
  assessmentId: string,
  currentStep: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('assessments')
      .update({ current_step: currentStep, updated_at: new Date().toISOString() })
      .eq('id', assessmentId);

    if (error) throw error;
  } catch (error) {
    logger.error('Error updating assessment step:', error);
    throw error;
  }
}

/**
 * Сохранить ответ на вопрос
 */
export async function saveAnswer(
  assessmentId: string,
  answer: AnswerData
): Promise<void> {
  try {
    const answerData: AnswerInsert = {
      assessment_id: assessmentId,
      question_code: answer.questionCode,
      question_id: answer.questionId,
      category: answer.category,
      value: answer.value,
      answer_type: answer.answerType || null,
      step_number: answer.stepNumber,
    };

    // Используем upsert для обновления существующего ответа или создания нового
    const { error } = await supabase
      .from('answers')
      .upsert(answerData, {
        onConflict: 'assessment_id,question_id',
      });

    if (error) throw error;
  } catch (error) {
    logger.error('Error saving answer:', error);
    throw error;
  }
}

/**
 * Получить все ответы для оценки
 */
export async function getAnswers(assessmentId: string): Promise<Answer[]> {
  try {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('question_id', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting answers:', error);
    throw error;
  }
}

/**
 * Получить ответ на конкретный вопрос
 */
export async function getAnswer(
  assessmentId: string,
  questionId: number
): Promise<Answer | null> {
  try {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting answer:', error);
    return null;
  }
}

/**
 * Завершить оценку и рассчитать результаты
 */
export async function completeAssessment(assessmentId: string): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.rpc('complete_assessment', {
      assessment_uuid: assessmentId,
    });

    if (error) throw error;

    return data as Record<string, any>;
  } catch (error) {
    logger.error('Error completing assessment:', error);
    throw error;
  }
}

/**
 * Получить результаты оценки
 */
export async function getAssessmentResults(assessmentId: string): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('results_summary, is_paid')
      .eq('id', assessmentId)
      .single();

    if (error) throw error;

    return {
      results: data.results_summary,
      isPaid: data.is_paid,
    };
  } catch (error) {
    logger.error('Error getting assessment results:', error);
    return null;
  }
}

/**
 * Получить все оценки для профиля
 */
export async function getAssessmentsForProfile(profileId: string): Promise<Assessment[]> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting assessments for profile:', error);
    throw error;
  }
}

/**
 * Получить завершенную оценку определенного типа
 */
export async function getCompletedAssessment(
  profileId: string,
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Assessment | null> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('profile_id', profileId)
      .eq('assessment_type', assessmentType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error getting completed assessment:', error);
    return null;
  }
}

/**
 * Пересчитать результаты для завершенной оценки
 */
export async function recalculateAssessmentResults(assessmentId: string): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase.rpc('complete_assessment', {
      assessment_uuid: assessmentId,
    });

    if (error) throw error;

    return data as Record<string, any>;
  } catch (error) {
    logger.error('Error recalculating assessment results:', error);
    return null;
  }
}

/**
 * Получить завершенные оценки для нескольких профилей одним запросом
 * КРИТИЧНО: Исправляет N+1 проблему
 * 
 * @param profileIds - Массив ID профилей
 * @param assessmentType - Тип оценки
 * @returns Map где ключ - profile_id, значение - Assessment или null
 */
export async function getCompletedAssessmentsForProfiles(
  profileIds: string[],
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Record<string, Assessment | null>> {
  if (profileIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .in('profile_id', profileIds)
      .eq('assessment_type', assessmentType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) throw error;

    // Группируем по profile_id, берем последнюю завершенную оценку для каждого профиля
    const assessmentMap = data?.reduce((acc, assessment) => {
      const existing = acc[assessment.profile_id];
      
      // Если еще нет оценки для этого профиля, или эта новее - сохраняем
      if (!existing || 
          (!existing.completed_at && assessment.completed_at) ||
          (existing.completed_at && assessment.completed_at &&
           new Date(assessment.completed_at) > new Date(existing.completed_at))) {
        acc[assessment.profile_id] = assessment;
      }
      return acc;
    }, {} as Record<string, Assessment>) || {};

    // Возвращаем Map со всеми профилями (null для тех, у кого нет оценок)
    const result: Record<string, Assessment | null> = {};
    for (const profileId of profileIds) {
      result[profileId] = assessmentMap[profileId] || null;
    }

    return result;
  } catch (error) {
    logger.error('Error getting assessments for profiles:', error);
    throw error;
  }
}

/**
 * Получить активные оценки для нескольких профилей одним запросом
 * 
 * @param profileIds - Массив ID профилей
 * @param assessmentType - Тип оценки
 * @returns Map где ключ - profile_id, значение - Assessment или null
 */
export async function getActiveAssessmentsForProfiles(
  profileIds: string[],
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Record<string, Assessment | null>> {
  if (profileIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .in('profile_id', profileIds)
      .eq('assessment_type', assessmentType)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Группируем по profile_id, берем последнюю активную оценку для каждого профиля
    const assessmentMap = data?.reduce((acc, assessment) => {
      const existing = acc[assessment.profile_id];
      
      // Если еще нет оценки для этого профиля, или эта новее - сохраняем
      if (!existing || 
          (!existing.created_at && assessment.created_at) ||
          (existing.created_at && assessment.created_at &&
           new Date(assessment.created_at) > new Date(existing.created_at))) {
        acc[assessment.profile_id] = assessment;
      }
      return acc;
    }, {} as Record<string, Assessment>) || {};

    // Возвращаем Map со всеми профилями (null для тех, у кого нет активных оценок)
    const result: Record<string, Assessment | null> = {};
    for (const profileId of profileIds) {
      result[profileId] = assessmentMap[profileId] || null;
    }

    return result;
  } catch (error) {
    logger.error('Error getting active assessments for profiles:', error);
    throw error;
  }
}
