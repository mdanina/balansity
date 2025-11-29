// Утилиты для работы с консультациями (appointments) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';
import { getCurrentUser } from './profileStorage';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
type AppointmentType = Database['public']['Tables']['appointment_types']['Row'];

// ============================================
// Работа с типами консультаций
// ============================================

/**
 * Получить все активные типы консультаций
 */
export async function getAppointmentTypes(): Promise<AppointmentType[]> {
  try {
    const { data, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('is_active', true)
      .order('duration_minutes', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting appointment types:', error);
    throw error;
  }
}

/**
 * Получить тип консультации по ID
 */
export async function getAppointmentType(typeId: string): Promise<AppointmentType | null> {
  try {
    const { data, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('id', typeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting appointment type:', error);
    return null;
  }
}

// ============================================
// Работа с консультациями
// ============================================

/**
 * Получить все консультации текущего пользователя
 */
export async function getAppointments(): Promise<Appointment[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting appointments:', error);
    throw error;
  }
}

/**
 * Получить консультацию по ID
 */
export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting appointment:', error);
    return null;
  }
}

/**
 * Создать запись на консультацию
 */
export async function createAppointment(
  appointmentTypeId: string,
  scheduledAt: string,
  profileId?: string | null,
  notes?: string
): Promise<Appointment> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const appointmentData: AppointmentInsert = {
      user_id: user.id,
      appointment_type_id: appointmentTypeId,
      scheduled_at: scheduledAt,
      profile_id: profileId || null,
      status: 'scheduled',
      notes: notes || null,
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error creating appointment:', error);
    throw error;
  }
}

/**
 * Обновить консультацию
 */
export async function updateAppointment(
  appointmentId: string,
  updates: AppointmentUpdate
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error updating appointment:', error);
    throw error;
  }
}

/**
 * Отменить консультацию
 */
export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  return updateAppointment(appointmentId, { status: 'cancelled' });
}

/**
 * Получить предстоящие консультации
 */
export async function getUpcomingAppointments(): Promise<Appointment[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting upcoming appointments:', error);
    throw error;
  }
}

/**
 * Получить консультации с информацией о типе
 */
export async function getAppointmentsWithType(): Promise<(Appointment & { appointment_type: AppointmentType })[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(*)
      `)
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: false });

    if (error) throw error;

    // Преобразуем данные для удобства
    return (data || []).map((appointment: any) => ({
      ...appointment,
      appointment_type: appointment.appointment_type as AppointmentType,
    }));
  } catch (error) {
    logger.error('Error getting appointments with type:', error);
    throw error;
  }
}

/**
 * Создать бесплатную консультацию после первого чекапа
 * Вызывается автоматически после завершения первого чекапа
 */
export async function createFreeConsultationAfterFirstCheckup(): Promise<Appointment | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Проверяем, была ли уже создана бесплатная консультация
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('free_consultation_created')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    if (userData?.free_consultation_created) {
      logger.info('Free consultation already created for user');
      return null;
    }

    // Проверяем, есть ли у пользователя завершенные чекапы
    // Получаем все профили пользователя
    const { getProfiles } = await import('./profileStorage');
    const profiles = await getProfiles();
    const childProfiles = profiles.filter(p => p.type === 'child');

    if (childProfiles.length === 0) {
      logger.info('No child profiles found, skipping free consultation creation');
      return null;
    }

    // Проверяем, есть ли хотя бы один завершенный чекап
    const { getCompletedAssessmentsForProfiles } = await import('./assessmentStorage');
    const profileIds = childProfiles.map(p => p.id);
    const completedAssessments = await getCompletedAssessmentsForProfiles(profileIds, 'checkup');
    
    const hasCompletedCheckup = Object.values(completedAssessments).some(
      assessment => assessment?.status === 'completed'
    );

    if (!hasCompletedCheckup) {
      logger.info('No completed checkups found yet, skipping free consultation creation');
      return null;
    }

    // Находим тип консультации "Первичная встреча"
    const { data: appointmentType, error: typeError } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('name', 'Первичная встреча')
      .eq('is_active', true)
      .single();

    if (typeError || !appointmentType) {
      logger.warn('Первичная встреча appointment type not found');
      return null;
    }

    // Создаем консультацию без даты (пользователь выберет позже)
    // Устанавливаем scheduled_at на неделю вперед как placeholder
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 7);
    scheduledAt.setHours(10, 0, 0, 0);

    const appointmentData: AppointmentInsert = {
      user_id: user.id,
      appointment_type_id: appointmentType.id,
      scheduled_at: scheduledAt.toISOString(),
      status: 'scheduled',
      profile_id: null, // Для родителя
      notes: 'Бесплатная консультация после первого чекапа',
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) throw appointmentError;

    // Отмечаем, что бесплатная консультация создана
    const { error: updateError } = await supabase
      .from('users')
      .update({ free_consultation_created: true })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Error updating free_consultation_created flag:', updateError);
      // Не бросаем ошибку, т.к. консультация уже создана
    }

    logger.info('Free consultation created successfully');
    return appointment;
  } catch (error) {
    logger.error('Error creating free consultation:', error);
    // Не бросаем ошибку, чтобы не прерывать процесс завершения чекапа
    return null;
  }
}

/**
 * Проверить, доступна ли бесплатная консультация
 */
export async function hasFreeConsultationAvailable(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('free_consultation_created')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Error checking free consultation:', error);
      return false;
    }

    return !userData?.free_consultation_created;
  } catch (error) {
    logger.error('Error checking free consultation availability:', error);
    return false;
  }
}

