// Хуки для работы с консультациями через React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAppointmentTypes,
  getAppointmentType,
  getAppointments,
  getAppointment,
  getUpcomingAppointments,
  getAppointmentsWithType,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from '@/lib/appointmentStorage';
import type { Database } from '@/lib/supabase';
import { toast } from 'sonner';

type AppointmentType = Database['public']['Tables']['appointment_types']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'];

/**
 * Хук для получения всех типов консультаций
 */
export function useAppointmentTypes() {
  return useQuery<AppointmentType[]>({
    queryKey: ['appointment-types'],
    queryFn: getAppointmentTypes,
    staleTime: 10 * 60 * 1000, // 10 минут - типы консультаций редко меняются
    gcTime: 30 * 60 * 1000, // 30 минут
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения типа консультации по ID
 */
export function useAppointmentType(typeId: string | null) {
  return useQuery<AppointmentType | null>({
    queryKey: ['appointment-type', typeId],
    queryFn: () => {
      if (!typeId) return Promise.resolve(null);
      return getAppointmentType(typeId);
    },
    enabled: !!typeId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения всех консультаций пользователя
 */
export function useAppointments() {
  const { user } = useAuth();

  return useQuery<Appointment[]>({
    queryKey: ['appointments', user?.id],
    queryFn: getAppointments,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения консультаций с информацией о типе
 */
export function useAppointmentsWithType() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments-with-type', user?.id],
    queryFn: getAppointmentsWithType,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения предстоящих консультаций
 */
export function useUpcomingAppointments() {
  const { user } = useAuth();

  return useQuery<Appointment[]>({
    queryKey: ['upcoming-appointments', user?.id],
    queryFn: getUpcomingAppointments,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 минута - предстоящие консультации меняются чаще
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения консультации по ID
 */
export function useAppointment(appointmentId: string | null) {
  return useQuery<Appointment | null>({
    queryKey: ['appointment', appointmentId],
    queryFn: () => {
      if (!appointmentId) return Promise.resolve(null);
      return getAppointment(appointmentId);
    },
    enabled: !!appointmentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для создания консультации
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      appointmentTypeId,
      scheduledAt,
      profileId,
      notes,
    }: {
      appointmentTypeId: string;
      scheduledAt: string;
      profileId?: string | null;
      notes?: string;
    }) => createAppointment(appointmentTypeId, scheduledAt, profileId, notes),
    onSuccess: () => {
      // Инвалидируем кеш консультаций
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['appointments-with-type', user?.id] });
      toast.success('Консультация успешно записана');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при записи на консультацию: ${error.message}`);
    },
  });
}

/**
 * Хук для обновления консультации
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      appointmentId,
      updates,
    }: {
      appointmentId: string;
      updates: Parameters<typeof updateAppointment>[1];
    }) => updateAppointment(appointmentId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['appointments-with-type', user?.id] });
      toast.success('Консультация обновлена');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при обновлении консультации: ${error.message}`);
    },
  });
}

/**
 * Хук для отмены консультации
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['appointments-with-type', user?.id] });
      toast.success('Консультация отменена');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при отмене консультации: ${error.message}`);
    },
  });
}

