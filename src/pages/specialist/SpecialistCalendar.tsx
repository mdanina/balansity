/**
 * Страница календаря специалиста
 * Полный перенос функционала из PsiPilot CalendarPage
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppointmentList, CreateAppointmentDialog } from '@/components/specialist/calendar';
import {
  getSpecialistAppointments,
  getSpecialistClients,
  createAppointment,
  deleteAppointment,
  deleteAllRecurringAppointments,
  type AppointmentWithDetails,
  type Client,
} from '@/lib/supabase-appointments';

export default function SpecialistCalendar() {
  const { user, specialistUser } = useSpecialistAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [defaultAppointmentDate, setDefaultAppointmentDate] = useState<Date | undefined>(undefined);
  const [defaultAppointmentTime, setDefaultAppointmentTime] = useState<string | undefined>(undefined);

  // Для удаления повторяющихся консультаций
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentWithDetails | null>(null);
  const [deleteAllRecurring, setDeleteAllRecurring] = useState(false);

  // Получаем ID специалиста
  const specialistId = specialistUser?.specialist?.id || user?.id;

  // Загружаем клиентов
  const loadClients = useCallback(async () => {
    if (!specialistId) return;

    try {
      const data = await getSpecialistClients(specialistId);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }, [specialistId]);

  // Загружаем консультации за месяц
  const loadAppointments = useCallback(async () => {
    if (!specialistId) return;

    try {
      setIsRefreshing(true);
      const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0, 23, 59, 59);

      const data = await getSpecialistAppointments(specialistId, monthStart, monthEnd);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить консультации',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [specialistId, calendarMonth, toast]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCreateAppointment = async (params: {
    userId: string;
    profileId?: string | null;
    appointmentTypeId: string;
    scheduledAt: string;
    durationMinutes: number;
    meetingFormat: 'online' | 'in_person' | null;
    recurringPattern?: 'weekly' | 'monthly' | null;
    recurringEndDate?: string | null;
    timezone?: string;
  }) => {
    if (!specialistId) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось определить специалиста',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAppointment({
        ...params,
        specialistId,
      });

      await loadAppointments();

      toast({
        title: 'Успешно',
        description: 'Консультация создана',
      });

      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать консультацию',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Проверяем, повторяющаяся ли это консультация
    const isRecurring = appointment.recurring_pattern || appointment.parent_appointment_id;

    if (isRecurring) {
      setAppointmentToDelete(appointment);
      setDeleteDialogOpen(true);
      return;
    }

    // Не повторяющаяся — удаляем сразу
    await performDelete(appointmentId, false);
  };

  const performDelete = async (appointmentId: string, deleteAll: boolean) => {
    try {
      if (deleteAll) {
        await deleteAllRecurringAppointments(appointmentId);
        toast({
          title: 'Успешно',
          description: 'Все повторяющиеся консультации удалены',
        });
      } else {
        await deleteAppointment(appointmentId);
        toast({
          title: 'Успешно',
          description: 'Консультация удалена',
        });
      }
      await loadAppointments();
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить консультацию',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAtTime = (time: string) => {
    setDefaultAppointmentDate(selectedDate);
    setDefaultAppointmentTime(time);
    setCreateDialogOpen(true);
  };

  // Фильтруем консультации для выбранной даты
  const dayAppointments = appointments.filter((appointment) => {
    if (!appointment.scheduled_at) return false;
    return isSameDay(new Date(appointment.scheduled_at), selectedDate);
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header skeleton */}
        <div className="border-b bg-background px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="lg:w-1/2 p-6 flex items-center justify-center">
            <Skeleton className="h-80 w-80" />
          </div>
          <div className="lg:w-1/2 p-6">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 sm:flex-none"
              onClick={() => {
                setDefaultAppointmentDate(selectedDate);
                setDefaultAppointmentTime(undefined);
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="sm:inline">Новая консультация</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={loadAppointments}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Calendar */}
        <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r bg-background p-4 md:p-6 flex flex-col items-center justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            className="w-fit"
            classNames={{
              months: 'flex justify-center',
              month: 'space-y-7',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-base font-semibold',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'mx-auto',
              head_cell: 'text-sm font-medium w-[61px] h-10',
              cell: 'h-[61px] w-[61px]',
              day: "h-[61px] w-[61px] text-base relative [&.has-online-appointment]:after:content-[''] [&.has-online-appointment]:after:absolute [&.has-online-appointment]:after:bottom-1.5 [&.has-online-appointment]:after:left-1/2 [&.has-online-appointment]:after:-translate-x-1/2 [&.has-online-appointment]:after:h-1 [&.has-online-appointment]:after:w-1 [&.has-online-appointment]:after:rounded-full [&.has-online-appointment]:after:bg-muted-foreground [&.has-inperson-appointment]:after:content-[''] [&.has-inperson-appointment]:after:absolute [&.has-inperson-appointment]:after:bottom-1.5 [&.has-inperson-appointment]:after:left-1/2 [&.has-inperson-appointment]:after:-translate-x-1/2 [&.has-inperson-appointment]:after:h-1 [&.has-inperson-appointment]:after:w-1 [&.has-inperson-appointment]:after:rounded-full [&.has-inperson-appointment]:after:bg-primary",
              day_selected: 'border-2 border-primary rounded-full bg-transparent text-foreground hover:border-primary hover:bg-transparent focus:border-primary focus:bg-transparent',
            }}
            modifiers={{
              hasOnlineAppointment: (date) => {
                const dayAppts = appointments.filter((apt) => {
                  if (!apt.scheduled_at) return false;
                  return isSameDay(new Date(apt.scheduled_at), date);
                });
                const hasInPerson = dayAppts.some(apt => apt.meeting_format === 'in_person');
                return !hasInPerson && dayAppts.some(apt => apt.meeting_format === 'online');
              },
              hasInPersonAppointment: (date) => {
                return appointments.some((apt) => {
                  if (!apt.scheduled_at || apt.meeting_format !== 'in_person') return false;
                  return isSameDay(new Date(apt.scheduled_at), date);
                });
              },
            }}
            modifiersClassNames={{
              hasOnlineAppointment: 'has-online-appointment',
              hasInPersonAppointment: 'has-inperson-appointment',
            }}
          />
        </div>

        {/* Right Panel - Schedule */}
        <div className="lg:w-1/2 p-4 md:p-6 flex-1 min-h-0">
          <div className="bg-card rounded-lg border border-border shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 pb-3 md:pb-4 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-3 md:pt-4">
              <AppointmentList
                appointments={dayAppointments}
                clients={clients}
                selectedDate={selectedDate}
                onDelete={handleDeleteAppointment}
                onCreateAtTime={handleCreateAtTime}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Appointment Dialog */}
      {specialistId && (
        <CreateAppointmentDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              setDefaultAppointmentDate(undefined);
              setDefaultAppointmentTime(undefined);
            }
          }}
          clients={clients}
          specialistId={specialistId}
          defaultDate={defaultAppointmentDate || selectedDate}
          defaultTime={defaultAppointmentTime}
          onCreateAppointment={handleCreateAppointment}
        />
      )}

      {/* Delete Recurring Appointment Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление повторяющейся консультации</AlertDialogTitle>
            <AlertDialogDescription>
              Эта консультация является частью повторяющейся серии. Что вы хотите сделать?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="deleteOption"
                checked={!deleteAllRecurring}
                onChange={() => setDeleteAllRecurring(false)}
                className="w-4 h-4"
              />
              <span className="text-sm">Удалить только эту консультацию</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="deleteOption"
                checked={deleteAllRecurring}
                onChange={() => setDeleteAllRecurring(true)}
                className="w-4 h-4"
              />
              <span className="text-sm">Удалить все последующие консультации</span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setAppointmentToDelete(null);
              setDeleteAllRecurring(false);
            }}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (appointmentToDelete) {
                  performDelete(appointmentToDelete.id, deleteAllRecurring);
                }
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
