// Хуки для работы с оценками через React Query
import { useQuery } from '@tanstack/react-query';
import { getCompletedAssessmentsForProfiles, getCompletedAssessment } from '@/lib/assessmentStorage';
import type { Database } from '@/lib/supabase';

type Assessment = Database['public']['Tables']['assessments']['Row'];

/**
 * Хук для получения завершенных оценок для нескольких профилей
 */
export function useAssessmentsForProfiles(
  profileIds: string[],
  assessmentType: 'checkup' | 'parent' | 'family'
) {
  return useQuery<Record<string, Assessment | null>>({
    queryKey: ['assessments', profileIds.sort().join(','), assessmentType],
    queryFn: () => getCompletedAssessmentsForProfiles(profileIds, assessmentType),
    enabled: profileIds.length > 0, // Запрос только если есть профили
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 10 * 60 * 1000, // 10 минут
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения одной завершенной оценки
 */
export function useCompletedAssessment(
  profileId: string | null,
  assessmentType: 'checkup' | 'parent' | 'family'
) {
  return useQuery<Assessment | null>({
    queryKey: ['assessment', profileId, assessmentType],
    queryFn: () => {
      if (!profileId) throw new Error('Profile ID is required');
      return getCompletedAssessment(profileId, assessmentType);
    },
    enabled: !!profileId, // Запрос только если есть profileId
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

