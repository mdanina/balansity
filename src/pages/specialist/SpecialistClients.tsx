/**
 * Страница списка клиентов специалиста
 * Использует RPC функцию get_specialist_clients() для получения назначенных клиентов
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Calendar,
  Users,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Тип данных клиента из RPC функции get_specialist_clients()
interface SpecialistClient {
  assignment_id: string;
  client_user_id: string;
  client_email: string | null;
  client_phone: string | null;
  client_region: string | null;
  assignment_type: 'primary' | 'consultant' | 'temporary';
  assignment_status: string;
  assigned_at: string;
  notes: string | null;
  last_appointment_at: string | null;
  next_appointment_at: string | null;
  total_appointments: number;
  completed_appointments: number;
  // Добавляем профиль клиента (загружаем отдельно)
  profile?: {
    first_name: string;
    last_name: string | null;
  };
}

export default function SpecialistClients() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clients, setClients] = useState<SpecialistClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Загружаем клиентов
  const loadClients = async () => {
    try {
      setIsRefreshing(true);

      // Вызываем RPC функцию
      const { data: clientsData, error: clientsError } = await supabase
        .rpc('get_specialist_clients');

      if (clientsError) {
        throw clientsError;
      }

      if (!clientsData || clientsData.length === 0) {
        setClients([]);
        return;
      }

      // Загружаем профили клиентов
      const clientUserIds = clientsData.map((c: SpecialistClient) => c.client_user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', clientUserIds);

      // Объединяем данные
      const clientsWithProfiles = clientsData.map((client: SpecialistClient) => {
        const profile = profilesData?.find(p => p.user_id === client.client_user_id);
        return {
          ...client,
          profile: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
          } : undefined,
        };
      });

      setClients(clientsWithProfiles);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список клиентов',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Фильтрация клиентов
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter((client) => {
      const name = client.profile
        ? `${client.profile.first_name} ${client.profile.last_name || ''}`.toLowerCase()
        : '';
      return (
        name.includes(query) ||
        client.client_email?.toLowerCase().includes(query) ||
        client.client_phone?.includes(query) ||
        client.client_region?.toLowerCase().includes(query)
      );
    });
  }, [clients, searchQuery]);

  // Получить имя клиента
  const getClientName = (client: SpecialistClient) => {
    if (client.profile) {
      const { first_name, last_name } = client.profile;
      return last_name ? `${first_name} ${last_name}` : first_name;
    }
    return client.client_email || 'Клиент';
  };

  // Получить инициалы клиента
  const getClientInitials = (client: SpecialistClient) => {
    if (client.profile) {
      const first = client.profile.first_name?.[0] || '';
      const last = client.profile.last_name?.[0] || '';
      return (first + last).toUpperCase() || '??';
    }
    return (client.client_email?.[0] || '?').toUpperCase();
  };

  // Бейдж типа назначения
  const getAssignmentBadge = (type: SpecialistClient['assignment_type']) => {
    switch (type) {
      case 'primary':
        return <Badge>Основной</Badge>;
      case 'consultant':
        return <Badge variant="secondary">Консультант</Badge>;
      case 'temporary':
        return <Badge variant="outline">Временный</Badge>;
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Форматирование относительной даты
  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'Нет данных';

    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  // Переход к клиенту
  const handleClientClick = (clientUserId: string) => {
    navigate(`/specialist/clients/${clientUserId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Мои клиенты</h1>
          <p className="text-muted-foreground">
            Клиенты, назначенные вам координатором
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadClients}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Всего клиентов</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Консультаций проведено</span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((sum, c) => sum + (c.completed_appointments || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Запланировано</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.next_appointment_at).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Поиск и таблица */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, email или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Пока нет назначенных клиентов</p>
              <p className="text-sm mt-1">
                Координатор назначит вам клиентов после установочных встреч
              </p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Клиенты не найдены по запросу "{searchQuery}"</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="hidden md:table-cell">Консультации</TableHead>
                  <TableHead className="hidden lg:table-cell">Последняя встреча</TableHead>
                  <TableHead>Следующая встреча</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.assignment_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleClientClick(client.client_user_id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {getClientInitials(client)}
                        </div>
                        <div>
                          <p className="font-medium">{getClientName(client)}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.client_email || client.client_phone || ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getAssignmentBadge(client.assignment_type)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-medium">{client.completed_appointments}</span>
                      <span className="text-muted-foreground"> / {client.total_appointments}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatRelativeDate(client.last_appointment_at)}
                    </TableCell>
                    <TableCell>
                      {client.next_appointment_at ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                          {formatDate(client.next_appointment_at)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Не запланировано</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientClick(client.client_user_id);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Footer с подсчетом */}
          {clients.length > 0 && (
            <div className="pt-4 border-t mt-4 text-center text-sm text-muted-foreground">
              {searchQuery
                ? `Найдено: ${filteredClients.length} из ${clients.length}`
                : `Всего: ${clients.length} ${clients.length === 1 ? 'клиент' : clients.length < 5 ? 'клиента' : 'клиентов'}`
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
