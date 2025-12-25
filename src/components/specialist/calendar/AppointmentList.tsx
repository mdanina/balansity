/**
 * Компонент списка консультаций с временными слотами
 * Адаптировано из PsiPilot AppointmentList
 */

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, Video, Users, Trash2, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppointmentWithDetails, Client } from '@/lib/supabase-appointments';
import { getClientName } from '@/lib/supabase-appointments';

interface AppointmentListProps {
  appointments: AppointmentWithDetails[];
  clients: Client[];
  selectedDate: Date;
  onDelete?: (appointmentId: string) => void;
  onCreateAtTime?: (time: string) => void;
}

export function AppointmentList({
  appointments,
  clients,
  selectedDate,
  onDelete,
  onCreateAtTime,
}: AppointmentListProps) {
  const navigate = useNavigate();

  // Генерируем временные слоты (08:00 - 22:00, интервал 30 минут)
  const timeSlots: string[] = [];
  for (let hour = 8; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  // Группируем консультации по времени
  const appointmentsByTime = new Map<string, AppointmentWithDetails[]>();
  appointments.forEach((appointment) => {
    if (appointment.scheduled_at) {
      const appointmentDate = new Date(appointment.scheduled_at);
      const timeKey = format(appointmentDate, 'HH:mm');
      if (!appointmentsByTime.has(timeKey)) {
        appointmentsByTime.set(timeKey, []);
      }
      appointmentsByTime.get(timeKey)!.push(appointment);
    }
  });

  const getClientForAppointment = (appointment: AppointmentWithDetails): Client | null => {
    return clients.find(c => c.id === appointment.user_id) || null;
  };

  const getAppointmentEndTime = (appointment: AppointmentWithDetails) => {
    if (!appointment.scheduled_at) return '';
    const start = new Date(appointment.scheduled_at);
    const duration = appointment.duration_minutes || 60;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    return format(end, 'HH:mm', { locale: ru });
  };

  const handleAppointmentClick = (appointmentId: string) => {
    navigate(`/specialist/sessions/${appointmentId}`);
  };

  return (
    <div className="space-y-1">
      {timeSlots.map((timeSlot) => {
        const isFullHour = timeSlot.endsWith(':00');
        const slotAppointments = appointmentsByTime.get(timeSlot) || [];
        const hasAppointments = slotAppointments.length > 0;

        return (
          <div
            key={timeSlot}
            className={cn(
              'flex items-start gap-3 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors',
              isFullHour && 'border-t border-border'
            )}
          >
            <div
              className={cn(
                'w-14 text-sm font-medium text-muted-foreground flex-shrink-0',
                isFullHour && 'font-semibold'
              )}
            >
              {timeSlot}
            </div>

            <div className="flex-1 space-y-2">
              {hasAppointments ? (
                slotAppointments.map((appointment) => {
                  const endTime = getAppointmentEndTime(appointment);
                  const formatType = appointment.meeting_format;
                  const client = getClientForAppointment(appointment);
                  const clientName = appointment.profile
                    ? (appointment.profile.last_name
                        ? `${appointment.profile.first_name} ${appointment.profile.last_name}`
                        : appointment.profile.first_name)
                    : getClientName(client);

                  return (
                    <div
                      key={appointment.id}
                      className={cn(
                        'p-3 rounded-md border bg-card cursor-pointer transition-colors hover:bg-accent/30',
                        formatType === 'online' && 'border-border bg-muted/30',
                        formatType === 'in_person' && 'border-primary/30 bg-primary/5',
                        !formatType && 'border-border bg-muted/50'
                      )}
                      onClick={() => handleAppointmentClick(appointment.id)}
                      title="Кликните для открытия анализа сессии"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {formatType === 'online' ? (
                              <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            ) : formatType === 'in_person' ? (
                              <Users className="w-4 h-4 text-primary flex-shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm">
                              {clientName}
                            </span>
                            {(appointment.recurring_pattern || appointment.parent_appointment_id) && (
                              <Repeat className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                            {formatType && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-xs border',
                                  formatType === 'online' && 'bg-muted text-muted-foreground border-border',
                                  formatType === 'in_person' && 'bg-primary/10 text-primary border-primary/20'
                                )}
                              >
                                {formatType === 'online' ? 'Онлайн' : 'Очно'}
                              </Badge>
                            )}
                          </div>
                          {appointment.appointment_type && (
                            <p className="text-xs text-muted-foreground">
                              {appointment.appointment_type.name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {timeSlot} - {endTime} ({appointment.duration_minutes || 60} мин.)
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(appointment.id);
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                onCreateAtTime && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateAtTime(timeSlot)}
                    className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
                  >
                    + Добавить встречу
                  </Button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
