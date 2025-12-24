import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search,
  Video,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Filter,
  ExternalLink,
} from 'lucide-react';

// Типы данных
type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

interface Session {
  id: string;
  clientEmail: string;
  clientPhone?: string;
  clientName?: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  status: SessionStatus;
  appointmentTypeName: string;
  videoRoomUrl?: string;
  durationMinutes?: number;
  notes?: string;
  hasRecording: boolean;
  hasNotes: boolean;
}

export default function SpecialistSessions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState('upcoming');

  // Заглушка для данных (потом заменим на реальные из API)
  const sessions: Session[] = [];

  // Фильтрация
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.clientPhone?.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;

    const now = new Date();
    const sessionDate = new Date(session.scheduledAt);

    if (activeTab === 'upcoming') {
      return matchesSearch && matchesStatus && sessionDate >= now && session.status === 'scheduled';
    } else if (activeTab === 'past') {
      return matchesSearch && matchesStatus && (sessionDate < now || session.status === 'completed');
    } else {
      return matchesSearch && matchesStatus;
    }
  });

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Запланировано</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-500">Идёт сейчас</Badge>;
      case 'completed':
        return <Badge variant="secondary">Завершено</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Отменено</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Не явился</Badge>;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins} мин`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      }),
      time: date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      full: date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  // Статистика
  const stats = {
    upcoming: sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduledAt) >= new Date()).length,
    completed: sessions.filter(s => s.status === 'completed').length,
    total: sessions.length,
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Сессии</h1>
          <p className="text-muted-foreground">
            История и управление консультациями
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Предстоящие</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Проведено</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сессий</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Табы и фильтры */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="upcoming">
                  Предстоящие
                  {stats.upcoming > 0 && (
                    <Badge variant="secondary" className="ml-2">{stats.upcoming}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="past">Прошедшие</TabsTrigger>
                <TabsTrigger value="all">Все</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по клиенту..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="scheduled">Запланировано</SelectItem>
                    <SelectItem value="in_progress">Идёт</SelectItem>
                    <SelectItem value="completed">Завершено</SelectItem>
                    <SelectItem value="cancelled">Отменено</SelectItem>
                    <SelectItem value="no_show">Не явился</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Video className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Пока нет сессий</p>
                  <p className="text-sm mt-1">
                    Сессии появятся когда координатор назначит вам клиентов
                  </p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Сессии не найдены по заданным фильтрам</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Дата и время</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Длительность</TableHead>
                      <TableHead>Материалы</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => {
                      const { date, time } = formatDateTime(session.scheduledAt);
                      const canStartSession = session.status === 'scheduled' && session.videoRoomUrl;
                      const isUpcoming = new Date(session.scheduledAt) > new Date();

                      return (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {(session.clientName?.[0] || session.clientEmail[0]).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {session.clientName || session.clientEmail}
                                </p>
                                {session.clientPhone && (
                                  <p className="text-sm text-muted-foreground">
                                    {session.clientPhone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{date}</p>
                                <p className="text-sm text-muted-foreground">{time}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm">{session.appointmentTypeName}</span>
                          </TableCell>

                          <TableCell>{getStatusBadge(session.status)}</TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDuration(session.durationMinutes)}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {session.hasRecording && (
                                <Badge variant="outline" className="text-xs">
                                  <PlayCircle className="h-3 w-3 mr-1" />
                                  Запись
                                </Badge>
                              )}
                              {session.hasNotes && (
                                <Badge variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Заметки
                                </Badge>
                              )}
                              {!session.hasRecording && !session.hasNotes && (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canStartSession && isUpcoming && (
                                <Button size="sm" asChild>
                                  <a
                                    href={session.videoRoomUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Video className="mr-2 h-4 w-4" />
                                    Начать
                                  </a>
                                </Button>
                              )}

                              {session.status === 'in_progress' && session.videoRoomUrl && (
                                <Button size="sm" variant="default" className="bg-green-500 hover:bg-green-600" asChild>
                                  <a
                                    href={session.videoRoomUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Video className="mr-2 h-4 w-4" />
                                    Вернуться
                                  </a>
                                </Button>
                              )}

                              {session.status === 'completed' && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link to={`/specialist/sessions/${session.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Детали
                                  </Link>
                                </Button>
                              )}

                              {session.status !== 'completed' && session.status !== 'in_progress' && !isUpcoming && (
                                <Button size="sm" variant="ghost" asChild>
                                  <Link to={`/specialist/sessions/${session.id}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Подсказка */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Video className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Как работают сессии</h3>
              <p className="text-sm text-blue-700 mt-1">
                Координатор назначает клиентов и создаёт расписание консультаций.
                За 5 минут до начала сессии вы можете присоединиться к видеокомнате.
                После завершения сессии вы сможете добавить заметки и просмотреть историю.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
