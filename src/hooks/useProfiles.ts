// Хук для работы с профилями через React Query
import { useQuery } from '@tanstack/react-query';
import { getProfiles } from '@/lib/profileStorage';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfiles() {
  const { user } = useAuth();

  return useQuery<Profile[]>({
    queryKey: ['profiles', user?.id],
    queryFn: getProfiles,
    enabled: !!user, // Запрос только если пользователь авторизован
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
    gcTime: 10 * 60 * 1000, // 10 минут - данные в кеше (было cacheTime в v4)
    retry: 2, // Повторить при ошибке 2 раза
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    refetchOnMount: true, // Обновляем данные при монтировании компонента
  });
}

