// Supabase клиент для работы с базой данных
import { createClient } from '@supabase/supabase-js';

// Эти значения должны быть в переменных окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL и Anon Key должны быть установлены в переменных окружения');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Типы для базы данных
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          region: string | null;
          marketing_consent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          region?: string | null;
          marketing_consent?: boolean;
        };
        Update: {
          email?: string | null;
          phone?: string | null;
          region?: string | null;
          marketing_consent?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          type: 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other';
          first_name: string;
          last_name: string | null;
          dob: string | null;
          gender: 'male' | 'female' | 'other' | null;
          pronouns: string | null;
          worry_tags: string[] | null;
          referral: string | null;
          seeking_care: 'yes' | 'no' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other';
          first_name: string;
          last_name?: string | null;
          dob?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          pronouns?: string | null;
          worry_tags?: string[] | null;
          referral?: string | null;
          seeking_care?: 'yes' | 'no' | null;
        };
        Update: {
          type?: 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other';
          first_name?: string;
          last_name?: string | null;
          dob?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          pronouns?: string | null;
          worry_tags?: string[] | null;
          referral?: string | null;
          seeking_care?: 'yes' | 'no' | null;
        };
      };
      assessments: {
        Row: {
          id: string;
          profile_id: string;
          assessment_type: 'checkup' | 'parent' | 'family';
          status: 'in_progress' | 'completed' | 'abandoned';
          current_step: number;
          total_steps: number | null;
          is_paid: boolean;
          payment_id: string | null;
          results_summary: Record<string, any> | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          assessment_type: 'checkup' | 'parent' | 'family';
          status?: 'in_progress' | 'completed' | 'abandoned';
          current_step?: number;
          total_steps?: number | null;
          is_paid?: boolean;
          payment_id?: string | null;
          results_summary?: Record<string, any> | null;
        };
        Update: {
          status?: 'in_progress' | 'completed' | 'abandoned';
          current_step?: number;
          total_steps?: number | null;
          is_paid?: boolean;
          payment_id?: string | null;
          results_summary?: Record<string, any> | null;
        };
      };
      answers: {
        Row: {
          id: number;
          assessment_id: string;
          question_code: string;
          question_id: number;
          category: string | null;
          value: number;
          answer_type: string | null;
          step_number: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          assessment_id: string;
          question_code: string;
          question_id: number;
          category?: string | null;
          value: number;
          answer_type?: string | null;
          step_number?: number | null;
        };
        Update: {
          question_code?: string;
          question_id?: number;
          category?: string | null;
          value?: number;
          answer_type?: string | null;
          step_number?: number | null;
        };
      };
    };
    Functions: {
      get_active_assessment: {
        Args: {
          p_profile_id: string;
          p_assessment_type: string;
        };
        Returns: string;
      };
      complete_assessment: {
        Args: {
          assessment_uuid: string;
        };
        Returns: Record<string, any>;
      };
      calculate_checkup_scores: {
        Args: {
          assessment_uuid: string;
        };
        Returns: Record<string, any>;
      };
    };
  };
}

