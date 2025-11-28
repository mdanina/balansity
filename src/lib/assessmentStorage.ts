// Утилиты для работы с оценками (assessments) и ответами (answers) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';

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
    console.error('Error getting/creating assessment:', error);
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
    console.error('Error getting active assessment:', error);
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
    console.error('Error updating assessment step:', error);
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
    console.error('Error saving answer:', error);
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
    console.error('Error getting answers:', error);
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
    console.error('Error getting answer:', error);
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
    console.error('Error completing assessment:', error);
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
    console.error('Error getting assessment results:', error);
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
    console.error('Error getting assessments for profile:', error);
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
    console.error('Error getting completed assessment:', error);
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
    console.error('Error recalculating assessment results:', error);
    return null;
  }
}
