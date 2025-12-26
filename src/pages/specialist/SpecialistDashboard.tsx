/**
 * Дашборд специалиста
 * Показывает статистику, сегодняшние консультации и быстрые действия
 */

import { useState, useEffect } from 'react';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Calendar,
  Clock,
  Video,
  ArrowRight,
  CheckCircle2,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface TodayAppointment {
  id: string;
  scheduled_at: string;
  status: string;
  video_room_url: string | null;
  client_email: string | null;
  client_phone: string | null;
  appointment_type_name: string | null;
  profile?: {
    first_name: string;
    last_name: string | null;
  };
}

interface DashboardStats {
  activeClients: number;
  todayAppointments: number;
  weekAppointments: number;
  completedThisMonth: number;
}

export default function SpecialistDashboard() {
  const { specialistUser } = useSpecialistAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    completedThisMonth: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const displayName = specialistUser?.specialist?.display_name || 'Специалист';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Загружаем количество клиентов
      const { data: clientsData } = await supabase.rpc('get_specialist_clients');
      const activeClients = clientsData?.length || 0;

      // Даты для фильтрации
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const weekEnd = new Date(todayStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Загружаем консультации на сегодня
      const { data: todayData } = await supabase.rpc('get_specialist_appointments', {
        p_from_date: todayStart.toISOString(),
        p_to_date: todayEnd.toISOString(),
      });

      // Загружаем профили клиентов для сегодняшних консультаций
      let todayWithProfiles: TodayAppointment[] = [];
      if (todayData && todayData.length > 0) {
        const clientIds = todayData.map((a: any) => a.client_user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', clientIds);

        todayWithProfiles = todayData.map((appointment: any) => {
          const profile = profilesData?.find(p => p.user_id === appointment.client_user_id);
          return {
            ...appointment,
            profile: profile ? {
              first_name: profile.first_name,
              last_name: profile.last_name,
            } : undefined,
          };
        });
      }

      setTodayAppointments(todayWithProfiles);

      // Загружаем консультации на неделю
      const { data: weekData } = await supabase.rpc('get_specialist_appointments', {
        p_from_date: todayStart.toISOString(),
        p_to_date: weekEnd.toISOString(),
      });

      // Загружаем завершённые за месяц (через прямой запрос)
      const specialistId = specialistUser?.specialist?.id;
      let completedThisMonth = 0;
      if (specialistId) {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('specialist_id', specialistId)
          .eq('status', 'completed')
          .gte('scheduled_at', monthStart.toISOString());
        completedThisMonth = count || 0;
      }

      setStats({
        activeClients,
        todayAppointments: todayData?.length || 0,
        weekAppointments: weekData?.length || 0,
        completedThisMonth,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Получить имя клиента
  const getClientName = (appointment: TodayAppointment) => {
    if (appointment.profile) {
      const { first_name, last_name } = appointment.profile;
      return last_name ? `${first_name} ${last_name}` : first_name;
    }
    return appointment.client_email || 'Клиент';
  };

  // Получить инициалы
  const getInitials = (appointment: TodayAppointment) => {
    if (appointment.profile) {
      const first = appointment.profile.first_name?.[0] || '';
      const last = appointment.profile.last_name?.[0] || '';
      return (first + last).toUpperCase() || '??';
    }
    return (appointment.client_email?.[0] || '?').toUpperCase();
  };

  // Форматирование времени
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Статус бейдж
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Запланировано</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">Идёт</Badge>;
      case 'completed':
        return <Badge variant="default">Завершено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Добро пожаловать, {displayName}!</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <Button asChild>
          <Link to="/specialist/calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Открыть календарь
          </Link>
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные клиенты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Назначено вам
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Консультаций запланировано
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">На этой неделе</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Консультаций всего
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">За месяц</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Завершено
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Сегодняшние консультации */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Сегодняшние консультации</CardTitle>
              <CardDescription>Ваше расписание на сегодня</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link to="/specialist/calendar">
                Все консультации
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>На сегодня консультаций нет</p>
              <p className="text-sm mt-1">
                Новые клиенты будут назначены координатором
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {getInitials(appointment)}
                    </div>
                    <div>
                      <p className="font-medium">{getClientName(appointment)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(appointment.scheduled_at)}
                        {appointment.appointment_type_name && ` • ${appointment.appointment_type_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(appointment.status)}
                    {appointment.video_room_url && appointment.status !== 'completed' && (
                      <Button size="sm" asChild>
                        <a href={appointment.video_room_url} target="_blank" rel="noopener noreferrer">
                          <Video className="mr-2 h-4 w-4" />
                          Начать
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/specialist/sessions/${appointment.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Быстрые действия */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link to="/specialist/clients">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Мои клиенты
              </CardTitle>
              <CardDescription>
                Просмотр списка назначенных клиентов
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link to="/specialist/sessions">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Сессии
              </CardTitle>
              <CardDescription>
                История и записи сессий
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link to="/specialist/ai-analysis">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Анализ
              </CardTitle>
              <CardDescription>
                Создание клинических заметок
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
