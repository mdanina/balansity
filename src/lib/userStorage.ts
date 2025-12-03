// Утилиты для работы с данными пользователя (users) в Supabase
import { supabase } from './supabase';
import { getCurrentUser } from './profileStorage';

export interface UserData {
  email?: string;
  phone?: string;
  region?: string;
  marketing_consent?: boolean;
}

/**
 * Получить данные текущего пользователя
 */
export async function getCurrentUserData(): Promise<UserData | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Пользователь не найден - это нормально для нового пользователя
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Обновить данные пользователя
 */
export async function updateUserData(updates: UserData): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

/**
 * Создать или обновить данные пользователя
 */
export async function upsertUserData(data: UserData): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || data.email,
        ...data,
      }, {
        onConflict: 'id',
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error upserting user data:', error);
    throw error;
  }
}










