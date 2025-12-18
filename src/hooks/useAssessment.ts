// Хук для работы с оценками (assessments)
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCurrentProfile } from '@/contexts/ProfileContext';
import { getProfiles } from '@/lib/profileStorage';
import { logger } from '@/lib/logger';
import {
  getOrCreateAssessmentFull,
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
  const queryClient = useQueryClient();
  const [actualProfileId, setActualProfileId] = useState<string | null>(null);
  const [profileIdDetermined, setProfileIdDetermined] = useState(false); // Флаг: profileId определён

  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedAnswers, setSavedAnswers] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // Определяем правильный profileId: для parent/family используем профиль родителя
  useEffect(() => {
    let cancelled = false;

    async function determineProfileId() {
      const inputProfileId = providedProfileId || params.profileId || currentProfileId;

      // Для parent и family оценок всегда используем профиль родителя
      if (assessmentType === 'parent' || assessmentType === 'family') {
        try {
          const profiles = await getProfiles();
          if (cancelled) return;

          const parent = profiles.find(p => p.type === 'parent');
          if (parent) {
            setActualProfileId(parent.id);
            setProfileIdDetermined(true);
            return;
          }
        } catch (error) {
          logger.error('Error loading profiles:', error);
          // Если ошибка, используем переданный profileId
          if (!cancelled) {
            setActualProfileId(inputProfileId || null);
            setProfileIdDetermined(true);
          }
          return;
        }
      }

      // Для checkup используем переданный profileId (профиль ребенка)
      if (!cancelled) {
        setActualProfileId(inputProfileId || null);
        setProfileIdDetermined(true);
      }
    }

    determineProfileId();

    return () => {
      cancelled = true;
    };
  }, [providedProfileId, params.profileId, currentProfileId, assessmentType]);

  // Инициализация: получение или создание оценки
  useEffect(() => {
    async function init() {
      // Ждём пока profileId будет определён
      if (!profileIdDetermined) {
        console.log('[DEBUG] useAssessment: waiting for profileId to be determined');
        return;
      }

      if (!actualProfileId) {
        logger.warn('Profile ID not found');
        setLoading(false);
        return;
      }

      const profileId = actualProfileId;

      try {
        setLoading(true);
        console.log('[DEBUG] useAssessment init for profileId:', profileId, 'type:', assessmentType);

        // Получаем или создаем активную оценку (оптимизировано: 1 запрос вместо 2)
        const { id, assessment } = await getOrCreateAssessmentFull(profileId, assessmentType, totalSteps);
        console.log('[DEBUG] Got assessment:', { id, current_step: assessment.current_step, status: assessment.status, created_at: assessment.created_at });

        setAssessmentId(id);
        setCurrentStep(assessment.current_step || 1);

        // Загружаем сохраненные ответы
        const answers = await getAnswers(assessment.id);
        console.log('[DEBUG] Loaded answers count:', answers.length);

        const answersMap = new Map<number, number>();
        answers.forEach(answer => {
          answersMap.set(answer.question_id, answer.value);
        });
        setSavedAnswers(answersMap);
      } catch (error) {
        logger.error('Error initializing assessment:', error);
        toast.error('Ошибка при загрузке оценки. Попробуйте обновить страницу.');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [actualProfileId, profileIdDetermined, assessmentType, totalSteps]);

  // Сохранение ответа с оптимистичным обновлением UI
  const saveAnswerToDb = async (
    questionId: number,
    questionCode: string,
    category: string,
    value: number,
    answerType: string | undefined,
    stepNumber: number
  ) => {
    // DEBUG: используем console.log напрямую, т.к. logger отключен в production
    console.log('[DEBUG] saveAnswerToDb called:', { assessmentId, questionId, value, stepNumber, loading });

    if (!assessmentId) {
      console.warn('[DEBUG] Assessment ID not available - answer will NOT be saved!');
      return;
    }

    // ОПТИМИСТИЧНОЕ обновление UI - обновляем сразу, не дожидаясь ответа сервера
    const previousValue = savedAnswers.get(questionId);
    const previousStep = currentStep;
    
    setSavedAnswers(prev => new Map(prev).set(questionId, value));
    setCurrentStep(stepNumber);

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
      await updateAssessmentStep(assessmentId, stepNumber);
      
      // Успех - состояние уже обновлено оптимистично
    } catch (error) {
      // ОТКАТ при ошибке - восстанавливаем предыдущее состояние
      logger.error('Error saving answer:', error);
      
      setSavedAnswers(prev => {
        const newMap = new Map(prev);
        if (previousValue !== undefined) {
          newMap.set(questionId, previousValue);
        } else {
          newMap.delete(questionId);
        }
        return newMap;
      });
      
      setCurrentStep(previousStep);
      
      toast.error('Ошибка при сохранении ответа. Попробуйте еще раз.');
      throw error; // Пробрасываем для обработки в компоненте
    }
  };

  // Завершение оценки
  const complete = async () => {
    if (!assessmentId || !actualProfileId) {
      logger.warn('Assessment ID or Profile ID not available');
      return null;
    }

    try {
      const results = await completeAssessment(assessmentId);

      // Инвалидируем кеш React Query для обновления данных в Dashboard и ResultsReportNew
      // invalidateQueries автоматически триггерит refetch для активных запросов
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          // Инвалидируем все запросы связанные с assessments и profiles
          return ['assessments', 'active-assessments', 'profiles'].includes(key) ||
                 // Также инвалидируем конкретную оценку для этого профиля
                 (key === 'assessment' && query.queryKey[1] === actualProfileId);
        }
      });

      toast.success('Оценка завершена!');
      return results;
    } catch (error) {
      logger.error('Error completing assessment:', error);
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

