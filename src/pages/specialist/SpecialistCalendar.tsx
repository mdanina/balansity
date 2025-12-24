import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
} from 'lucide-react';

// Типы данных
interface Appointment {
  id: string;
  clientEmail: string;
  clientPhone?: string;
  scheduledAt: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  appointmentTypeName: string;
  videoRoomUrl?: string;
  notes?: string;
}

export default function SpecialistCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Заглушка для данных
  const appointments: Appointment[] = [];

  // Навигация по датам
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Фильтруем консультации по выбранной дате
  const dayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledAt);
    return (
      aptDate.getDate() === currentDate.getDate() &&
      aptDate.getMonth() === currentDate.getMonth() &&
      aptDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge>Запланировано</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-green-500">Идёт</Badge>;
      case 'completed':
        return <Badge variant="secondary">Завершено</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Отменено</Badge>;
      case 'no_show':
        return <Badge variant="outline">Не явился</Badge>;
    }
  };

  // Генерируем слоты времени для визуализации
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i; // с 8:00 до 20:00
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="space-y-6">
      {/* Заголовок с навигацией */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Календарь</h1>
          <p className="text-muted-foreground">Ваше расписание консультаций</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isToday(currentDate) ? 'default' : 'outline'}
            onClick={goToToday}
          >
            Сегодня
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Текущая дата */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {currentDate.toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </CardTitle>
          <CardDescription>
            {dayAppointments.length === 0
              ? 'Нет запланированных консультаций'
              : `${dayAppointments.length} консультаций`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dayAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>На этот день консультаций нет</p>
              <p className="text-sm mt-1">
                Выберите другую дату или дождитесь назначения от координатора
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayAppointments
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map((appointment) => {
                  const time = new Date(appointment.scheduledAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Время */}
                      <div className="w-16 text-center">
                        <span className="text-lg font-semibold">{time}</span>
                      </div>

                      {/* Разделитель */}
                      <div className="w-1 h-16 bg-primary rounded-full" />

                      {/* Информация о клиенте */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {appointment.clientEmail[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{appointment.clientEmail}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.appointmentTypeName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Статус и действия */}
                      <div className="flex items-center gap-3">
                        {getStatusBadge(appointment.status)}
                        {appointment.videoRoomUrl && appointment.status === 'scheduled' && (
                          <Button size="sm" asChild>
                            <a
                              href={appointment.videoRoomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Начать
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Временная шкала (упрощённая) */}
      <Card>
        <CardHeader>
          <CardTitle>Рабочий день</CardTitle>
          <CardDescription>Обзор дня по часам</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1">
            {timeSlots.map((slot) => {
              const hasAppointment = dayAppointments.some((apt) => {
                const aptHour = new Date(apt.scheduledAt).getHours();
                return aptHour === parseInt(slot);
              });

              return (
                <div
                  key={slot}
                  className={`p-2 text-center text-xs rounded ${
                    hasAppointment
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-muted-foreground'
                  }`}
                  title={slot}
                >
                  {slot.split(':')[0]}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
