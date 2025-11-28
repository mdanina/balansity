// Утилиты для работы с профилями (profiles) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';

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
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Получить все профили текущего пользователя
 */
export async function getProfiles(): Promise<Profile[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting profiles:', error);
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
    console.error('Error creating profile:', error);
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
      console.log('Updating worry_tags:', {
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
      console.error('Supabase update error:', error);
      throw error;
    }
    
    console.log('Profile update result:', {
      profileId: data.id,
      worry_tags: data.worry_tags
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
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

