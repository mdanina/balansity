/**
 * Хуки для функционала координатора
 * - Получение неназначенных записей (без специалиста)
 * - Получение списка специалистов
 * - Назначение клиента специалисту
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Тип неназначенной записи
export interface UnassignedAppointment {
  id: string;
  user_id: string;
  scheduled_at: string;
  status: string;
  appointment_type_name: string | null;
  notes: string | null;
  created_at: string;
  user_email: string | null;
  user_phone: string | null;
  profile_first_name: string | null;
  profile_last_name: string | null;
}

// Тип специалиста для выбора
export interface AvailableSpecialist {
  id: string;
  user_id: string;
  display_name: string;
  specialization_codes: string[];
  is_available: boolean;
  accepts_new_clients: boolean;
  current_clients_count: number;
  max_clients: number;
}

// Тип назначения
export interface ClientAssignment {
  id: string;
  client_user_id: string;
  specialist_id: string;
  assignment_type: 'primary' | 'consultant' | 'temporary';
  status: string;
  assigned_at: string;
  notes: string | null;
}

/**
 * Получить неназначенные записи (без специалиста)
 */
export function useUnassignedAppointments() {
  return useQuery<UnassignedAppointment[]>({
    queryKey: ['coordinator-unassigned-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          user_id,
          scheduled_at,
          status,
          notes,
          created_at,
          appointment_type:appointment_types(name),
          user:users!appointments_user_id_fkey(email, phone),
          profile:profiles(first_name, last_name)
        `)
        .is('specialist_id', null)
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        scheduled_at: item.scheduled_at,
        status: item.status,
        notes: item.notes,
        created_at: item.created_at,
        appointment_type_name: item.appointment_type?.name || null,
        user_email: item.user?.email || null,
        user_phone: item.user?.phone || null,
        profile_first_name: item.profile?.first_name || null,
        profile_last_name: item.profile?.last_name || null,
      }));
    },
    staleTime: 30 * 1000, // 30 секунд
  });
}

/**
 * Получить список доступных специалистов
 */
export function useAvailableSpecialists() {
  return useQuery<AvailableSpecialist[]>({
    queryKey: ['coordinator-available-specialists'],
    queryFn: async () => {
      // Получаем специалистов
      const { data: specialists, error: specError } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_available', true)
        .order('display_name');

      if (specError) throw specError;

      // Получаем количество активных клиентов для каждого специалиста
      const specialistIds = (specialists || []).map(s => s.id);

      const { data: assignmentCounts, error: countError } = await supabase
        .from('client_assignments')
        .select('specialist_id')
        .in('specialist_id', specialistIds)
        .eq('status', 'active');

      if (countError) throw countError;

      // Считаем клиентов по специалистам
      const countMap: Record<string, number> = {};
      (assignmentCounts || []).forEach(a => {
        countMap[a.specialist_id] = (countMap[a.specialist_id] || 0) + 1;
      });

      return (specialists || []).map(s => ({
        id: s.id,
        user_id: s.user_id,
        display_name: s.display_name,
        specialization_codes: s.specialization_codes || [],
        is_available: s.is_available,
        accepts_new_clients: s.accepts_new_clients,
        current_clients_count: countMap[s.id] || 0,
        max_clients: s.max_clients || 50,
      }));
    },
    staleTime: 60 * 1000, // 1 минута
  });
}

/**
 * Назначить клиента специалисту
 */
export function useAssignClientToSpecialist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      clientUserId,
      specialistId,
      assignmentType = 'primary',
      notes,
    }: {
      appointmentId: string;
      clientUserId: string;
      specialistId: string;
      assignmentType?: 'primary' | 'consultant' | 'temporary';
      notes?: string;
    }) => {
      // 1. Проверяем, есть ли уже активное назначение
      const { data: existingAssignment } = await supabase
        .from('client_assignments')
        .select('id')
        .eq('client_user_id', clientUserId)
        .eq('specialist_id', specialistId)
        .eq('status', 'active')
        .maybeSingle();

      // 2. Если назначения нет - создаём
      if (!existingAssignment) {
        const { data: userData } = await supabase.auth.getUser();

        const { error: assignError } = await supabase
          .from('client_assignments')
          .insert({
            client_user_id: clientUserId,
            specialist_id: specialistId,
            assignment_type: assignmentType,
            assigned_by: userData.user?.id,
            status: 'active',
            notes: notes || null,
            started_at: new Date().toISOString(),
          });

        if (assignError) throw assignError;
      }

      // 3. Обновляем запись - привязываем к специалисту
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ specialist_id: specialistId })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-unassigned-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-available-specialists'] });
      toast.success('Клиент успешно назначен специалисту');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка назначения: ${error.message}`);
    },
  });
}

/**
 * Получить все назначения (для координатора)
 */
export function useAllClientAssignments() {
  return useQuery<(ClientAssignment & {
    client_email: string | null;
    client_first_name: string | null;
    client_last_name: string | null;
    specialist_name: string | null;
  })[]>({
    queryKey: ['coordinator-all-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_assignments')
        .select(`
          *,
          client:users!client_assignments_client_user_id_fkey(email),
          client_profile:profiles!client_assignments_client_user_id_fkey(first_name, last_name),
          specialist:specialists!client_assignments_specialist_id_fkey(display_name)
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        client_user_id: item.client_user_id,
        specialist_id: item.specialist_id,
        assignment_type: item.assignment_type,
        status: item.status,
        assigned_at: item.assigned_at,
        notes: item.notes,
        client_email: item.client?.email || null,
        client_first_name: item.client_profile?.first_name || null,
        client_last_name: item.client_profile?.last_name || null,
        specialist_name: item.specialist?.display_name || null,
      }));
    },
    staleTime: 30 * 1000,
  });
}
