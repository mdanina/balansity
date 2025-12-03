import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AdminAssessment {
  id: string;
  profile_id: string | null;
  assessment_type: 'checkup' | 'parent' | 'family';
  status: 'in_progress' | 'completed' | 'abandoned';
  is_paid: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  results_summary: any;
  profile?: {
    first_name: string;
    last_name: string | null;
    type: string;
  };
  user?: {
    email: string | null;
  };
}

export function useAdminAssessments() {
  return useQuery<AdminAssessment[]>({
    queryKey: ['admin-assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          profile:profiles(id, first_name, last_name, type, user_id),
          user:users!profiles_user_id_fkey(id, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Преобразуем данные для удобства
      return (data || []).map((item: any) => ({
        ...item,
        profile: item.profile?.[0] || item.profile,
        user: item.user?.[0] || item.user,
      })) as AdminAssessment[];
    },
  });
}







