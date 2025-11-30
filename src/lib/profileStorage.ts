// Утилиты для работы с профилями (profiles) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface FamilyMemberInput {
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  relationship: 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other';
  sex?: 'male' | 'female' | 'other';
  pronouns?: string;
  referral?: string;
  seekingCare?: 'yes' | 'no';
  worryTags?: string[];
}

/**
 * Получить текущего пользователя
 */
export async function getCurrentUser() {
  // Используем getSession вместо getUser для более надежной работы
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

/**
 * Получить все профили текущего пользователя
 * @param userId - ID пользователя (опционально, если не указан, будет получен из сессии)
 */
export async function getProfiles(userId?: string): Promise<Profile[]> {
  try {
    let user;
    if (userId) {
      // Если userId передан, используем его
      user = { id: userId } as any;
    } else {
      // Иначе получаем из сессии
      user = await getCurrentUser();
    }
    
    if (!user) {
      logger.warn('getProfiles: User not authenticated');
      throw new Error('User not authenticated');
    }

    logger.log('getProfiles: Fetching profiles for user:', user.id);
    logger.log('getProfiles: Supabase client initialized:', !!supabase);

    const startTime = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    const duration = Date.now() - startTime;
    
    logger.log(`getProfiles: Query completed in ${duration}ms`);

    if (error) {
      logger.error('getProfiles: Supabase error:', error);
      logger.error('getProfiles: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    logger.log('getProfiles: Query completed. Data:', data);
    logger.log('getProfiles: Successfully loaded', data?.length || 0, 'profiles');
    
    if (data && data.length > 0) {
      logger.log('getProfiles: Profile IDs:', data.map(p => p.id));
    } else {
      logger.warn('getProfiles: No profiles found for user:', user.id);
    }
    
    return data || [];
  } catch (error) {
    logger.error('Error getting profiles:', error);
    throw error;
  }
}

/**
 * Получить профиль по ID
 */
export async function getProfile(profileId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
}

/**
 * Создать новый профиль
 */
export async function createProfile(member: FamilyMemberInput): Promise<Profile> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const profileData: ProfileInsert = {
      user_id: user.id,
      type: member.relationship,
      first_name: member.firstName,
      last_name: member.lastName || null,
      dob: member.dateOfBirth || null,
      gender: member.sex || null,
      pronouns: member.pronouns || null,
      referral: member.referral || null,
      seeking_care: member.seekingCare || null,
      worry_tags: member.worryTags || null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error creating profile:', error);
    throw error;
  }
}

/**
 * Обновить профиль
 */
export async function updateProfile(
  profileId: string,
  updates: Partial<FamilyMemberInput>
): Promise<Profile> {
  try {
    const updateData: ProfileUpdate = {};

    if (updates.firstName) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName || null;
    if (updates.dateOfBirth) updateData.dob = updates.dateOfBirth;
    if (updates.relationship) updateData.type = updates.relationship;
    if (updates.sex) updateData.gender = updates.sex;
    if (updates.pronouns !== undefined) updateData.pronouns = updates.pronouns || null;
    if (updates.referral !== undefined) updateData.referral = updates.referral || null;
    if (updates.seekingCare) updateData.seeking_care = updates.seekingCare;
    // worryTags может быть массивом (даже пустым) или undefined
    if (updates.worryTags !== undefined) {
      updateData.worry_tags = updates.worryTags.length > 0 ? updates.worryTags : null;
      logger.log('Updating worry_tags:', {
        profileId,
        worryTags: updates.worryTags,
        updateData: updateData.worry_tags
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      logger.error('Supabase update error:', error);
      throw error;
    }
    
    logger.log('Profile update result:', {
      profileId: data.id,
      worry_tags: data.worry_tags
    });

    return data;
  } catch (error) {
    logger.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Удалить профиль
 */
export async function deleteProfile(profileId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

/**
 * Вычислить возраст из даты рождения
 */
export function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

