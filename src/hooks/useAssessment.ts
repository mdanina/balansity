// Хук для работы с оценками (assessments)
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useCurrentProfile } from '@/contexts/ProfileContext';
import { getProfiles } from '@/lib/profileStorage';
import {
  getOrCreateAssessment,
  getActiveAssessment,
  saveAnswer,
  updateAssessmentStep,
  getAnswers,
  completeAssessment,
} from '@/lib/assessmentStorage';
import type { AnswerData } from '@/lib/assessmentStorage';

interface UseAssessmentOptions {
  assessmentType: 'checkup' | 'parent' | 'family';
  totalSteps: number;
  profileId?: string; // Если не указан, берется из URL параметров или контекста
}

export function useAssessment({ assessmentType, totalSteps, profileId: providedProfileId }: UseAssessmentOptions) {
  const params = useParams<{ profileId?: string }>();
  const { currentProfileId } = useCurrentProfile();
  const [actualProfileId, setActualProfileId] = useState<string | null>(null);
  
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedAnswers, setSavedAnswers] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // Определяем правильный profileId: для parent/family используем профиль родителя
  useEffect(() => {
    async function determineProfileId() {
      const inputProfileId = providedProfileId || params.profileId || currentProfileId;
      
      // Для parent и family оценок всегда используем профиль родителя
      if (assessmentType === 'parent' || assessmentType === 'family') {
        try {
          const profiles = await getProfiles();
          const parent = profiles.find(p => p.type === 'parent');
          if (parent) {
            setActualProfileId(parent.id);
            return;
          }
        } catch (error) {
          console.error('Error loading profiles:', error);
        }
      }
      
      // Для checkup используем переданный profileId (профиль ребенка)
      setActualProfileId(inputProfileId || null);
    }
    
    determineProfileId();
  }, [providedProfileId, params.profileId, currentProfileId, assessmentType]);

  // Инициализация: получение или создание оценки
  useEffect(() => {
    async function init() {
      if (!actualProfileId) {
        console.warn('Profile ID not found');
        setLoading(false);
        return;
      }
      
      const profileId = actualProfileId;

      try {
        setLoading(true);
        
        // Получаем или создаем активную оценку
        const id = await getOrCreateAssessment(profileId, assessmentType, totalSteps);
        setAssessmentId(id);

        // Получаем существующую оценку для восстановления прогресса
        const assessment = await getActiveAssessment(profileId, assessmentType);
        if (assessment) {
          setCurrentStep(assessment.current_step || 1);
          
          // Загружаем сохраненные ответы
          const answers = await getAnswers(assessment.id);
          const answersMap = new Map<number, number>();
          answers.forEach(answer => {
            answersMap.set(answer.question_id, answer.value);
          });
          setSavedAnswers(answersMap);
        }
      } catch (error) {
        console.error('Error initializing assessment:', error);
        toast.error('Ошибка при загрузке оценки. Попробуйте обновить страницу.');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [actualProfileId, assessmentType, totalSteps]);

  // Сохранение ответа
  const saveAnswerToDb = async (
    questionId: number,
    questionCode: string,
    category: string,
    value: number,
    answerType: string | undefined,
    stepNumber: number
  ) => {
    if (!assessmentId) {
      console.warn('Assessment ID not available');
      return;
    }

    try {
      const answerData: AnswerData = {
        questionId,
        questionCode,
        category,
        value,
        answerType,
        stepNumber,
      };

      await saveAnswer(assessmentId, answerData);
      
      // Обновляем локальное состояние
      setSavedAnswers(prev => new Map(prev).set(questionId, value));
      
      // Обновляем текущий шаг
      await updateAssessmentStep(assessmentId, stepNumber);
      setCurrentStep(stepNumber);
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Ошибка при сохранении ответа');
    }
  };

  // Завершение оценки
  const complete = async () => {
    if (!assessmentId) {
      console.warn('Assessment ID not available');
      return null;
    }

    try {
      const results = await completeAssessment(assessmentId);
      toast.success('Оценка завершена!');
      return results;
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error('Ошибка при завершении оценки');
      return null;
    }
  };

  // Получить сохраненный ответ
  const getSavedAnswer = (questionId: number): number | null => {
    return savedAnswers.get(questionId) ?? null;
  };

  return {
    assessmentId,
    currentStep,
    savedAnswers,
    loading,
    saveAnswer: saveAnswerToDb,
    complete,
    getSavedAnswer,
  };
}

