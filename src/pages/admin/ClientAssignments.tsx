/**
 * Страница админки для назначения клиентов специалистам
 * - Показывает записи без назначенного специалиста
 * - Позволяет выбрать специалиста и назначить клиента
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Calendar,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import {
  useUnassignedAppointments,
  useAvailableSpecialists,
  useAssignClientToSpecialist,
  useAllClientAssignments,
  UnassignedAppointment,
  AvailableSpecialist,
} from '@/hooks/admin/useCoordinatorAssignments';

export default function ClientAssignments() {
  const [selectedAppointment, setSelectedAppointment] = useState<UnassignedAppointment | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'primary' | 'consultant' | 'temporary'>('primary');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    data: unassignedAppointments,
    isLoading: isLoadingAppointments,
    refetch: refetchAppointments,
  } = useUnassignedAppointments();

  const {
    data: specialists,
    isLoading: isLoadingSpecialists,
  } = useAvailableSpecialists();

  const {
    data: allAssignments,
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments,
  } = useAllClientAssignments();

  const assignMutation = useAssignClientToSpecialist();

  // Открыть диалог назначения
  const handleAssignClick = (appointment: UnassignedAppointment) => {
    setSelectedAppointment(appointment);
    setSelectedSpecialist('');
    setAssignmentType('primary');
    setAssignmentNotes('');
    setIsDialogOpen(true);
  };

  // Выполнить назначение
  const handleAssign = async () => {
    if (!selectedAppointment || !selectedSpecialist) return;

    await assignMutation.mutateAsync({
      appointmentId: selectedAppointment.id,
      clientUserId: selectedAppointment.user_id,
      specialistId: selectedSpecialist,
      assignmentType,
      notes: assignmentNotes || undefined,
    });

    setIsDialogOpen(false);
    setSelectedAppointment(null);
  };

  // Получить имя клиента
  const getClientName = (appointment: UnassignedAppointment) => {
    if (appointment.profile_first_name) {
      return appointment.profile_last_name
        ? `${appointment.profile_first_name} ${appointment.profile_last_name}`
        : appointment.profile_first_name;
    }
    return appointment.user_email || 'Клиент';
  };

  // Форматирование даты
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: ru });
  };

  // Бейдж загрузки специалиста
  const getSpecialistLoadBadge = (specialist: AvailableSpecialist) => {
    const loadPercent = (specialist.current_clients_count / specialist.max_clients) * 100;
    if (loadPercent >= 90) {
      return <Badge variant="destructive">Загружен</Badge>;
    }
    if (loadPercent >= 70) {
      return <Badge variant="secondary">Почти загружен</Badge>;
    }
    return <Badge variant="default">Свободен</Badge>;
  };

  if (isLoadingAppointments || isLoadingSpecialists) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Назначение клиентов</h1>
          <p className="text-muted-foreground mt-1">
            Привязка клиентов к специалистам
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            refetchAppointments();
            refetchAssignments();
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают назначения</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">записей без специалиста</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доступные специалисты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {specialists?.filter(s => s.accepts_new_clients).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">принимают новых клиентов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего назначений</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allAssignments?.filter(a => a.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">активных назначений</p>
          </CardContent>
        </Card>
      </div>

      {/* Табы */}
      <Tabs defaultValue="unassigned">
        <TabsList>
          <TabsTrigger value="unassigned">
            Без специалиста ({unassignedAppointments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Все назначения
          </TabsTrigger>
          <TabsTrigger value="specialists">
            Специалисты
          </TabsTrigger>
        </TabsList>

        {/* Записи без специалиста */}
        <TabsContent value="unassigned">
          <Card>
            <CardHeader>
              <CardTitle>Записи ожидающие назначения</CardTitle>
              <CardDescription>
                Клиенты, которые записались на консультацию, но ещё не привязаны к специалисту
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!unassignedAppointments || unassignedAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Все записи назначены специалистам</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Дата и время</TableHead>
                      <TableHead>Тип консультации</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getClientName(appointment)}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.user_email || appointment.user_phone || '—'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateTime(appointment.scheduled_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.appointment_type_name || 'Не указан'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={appointment.status === 'scheduled' ? 'secondary' : 'default'}>
                            {appointment.status === 'scheduled' ? 'Запланировано' : 'В процессе'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAssignClick(appointment)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Назначить
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Все назначения */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>История назначений</CardTitle>
              <CardDescription>
                Все назначения клиентов специалистам
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments ? (
                <Skeleton className="h-32" />
              ) : !allAssignments || allAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Пока нет назначений</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Специалист</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата назначения</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {assignment.client_first_name
                                ? `${assignment.client_first_name} ${assignment.client_last_name || ''}`
                                : assignment.client_email || 'Клиент'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.client_email || '—'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.specialist_name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {assignment.assignment_type === 'primary'
                              ? 'Основной'
                              : assignment.assignment_type === 'consultant'
                              ? 'Консультант'
                              : 'Временный'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={assignment.status === 'active' ? 'default' : 'secondary'}
                          >
                            {assignment.status === 'active'
                              ? 'Активно'
                              : assignment.status === 'completed'
                              ? 'Завершено'
                              : assignment.status === 'paused'
                              ? 'Приостановлено'
                              : 'Отменено'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(assignment.assigned_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Специалисты */}
        <TabsContent value="specialists">
          <Card>
            <CardHeader>
              <CardTitle>Доступные специалисты</CardTitle>
              <CardDescription>
                Список специалистов и их загрузка
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!specialists || specialists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Нет доступных специалистов</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Специалист</TableHead>
                      <TableHead>Специализации</TableHead>
                      <TableHead>Клиенты</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Загрузка</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialists.map((specialist) => (
                      <TableRow key={specialist.id}>
                        <TableCell className="font-medium">
                          {specialist.display_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {specialist.specialization_codes.slice(0, 2).map((code) => (
                              <Badge key={code} variant="outline" className="text-xs">
                                {code}
                              </Badge>
                            ))}
                            {specialist.specialization_codes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{specialist.specialization_codes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {specialist.current_clients_count} / {specialist.max_clients}
                        </TableCell>
                        <TableCell>
                          {specialist.accepts_new_clients ? (
                            <Badge variant="default">Принимает</Badge>
                          ) : (
                            <Badge variant="secondary">Не принимает</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getSpecialistLoadBadge(specialist)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог назначения */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить специалиста</DialogTitle>
            <DialogDescription>
              Выберите специалиста для клиента{' '}
              <strong>{selectedAppointment && getClientName(selectedAppointment)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Специалист</Label>
              <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите специалиста" />
                </SelectTrigger>
                <SelectContent>
                  {specialists?.filter(s => s.accepts_new_clients).map((specialist) => (
                    <SelectItem key={specialist.id} value={specialist.id}>
                      <div className="flex items-center gap-2">
                        <span>{specialist.display_name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({specialist.current_clients_count}/{specialist.max_clients})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Тип назначения</Label>
              <Select
                value={assignmentType}
                onValueChange={(v) => setAssignmentType(v as typeof assignmentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Основной специалист</SelectItem>
                  <SelectItem value="consultant">Консультант</SelectItem>
                  <SelectItem value="temporary">Временный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Заметки (опционально)</Label>
              <Textarea
                placeholder="Дополнительная информация о назначении..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedSpecialist || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Назначение...' : 'Назначить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
