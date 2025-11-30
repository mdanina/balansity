import { useState } from 'react';
import { useAdminAssessments } from '@/hooks/admin/useAdminAssessments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function AssessmentsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: assessments, isLoading } = useAdminAssessments();

  const filteredAssessments = assessments?.filter((assessment) => {
    const matchesSearch =
      assessment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    const matchesType = typeFilter === 'all' || assessment.assessment_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управление оценками</h1>
        <p className="text-muted-foreground mt-1">
          Всего оценок: {assessments?.length || 0}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по ID, имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="in_progress">В процессе</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
                <SelectItem value="abandoned">Брошено</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="checkup">Чекап</SelectItem>
                <SelectItem value="parent">Родитель</SelectItem>
                <SelectItem value="family">Семья</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список оценок</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Профиль</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Оплачено</TableHead>
                <TableHead>Начато</TableHead>
                <TableHead>Завершено</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments?.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-mono text-xs">
                    {assessment.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{assessment.assessment_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {assessment.profile
                      ? `${assessment.profile.first_name} ${assessment.profile.last_name || ''}`.trim()
                      : '—'}
                  </TableCell>
                  <TableCell>{assessment.user?.email || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        assessment.status === 'completed'
                          ? 'default'
                          : assessment.status === 'in_progress'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {assessment.status === 'completed'
                        ? 'Завершено'
                        : assessment.status === 'in_progress'
                        ? 'В процессе'
                        : 'Брошено'}
                    </Badge>
                  </TableCell>
                  <TableCell>{assessment.is_paid ? 'Да' : 'Нет'}</TableCell>
                  <TableCell>
                    {format(new Date(assessment.started_at), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {assessment.completed_at
                      ? format(new Date(assessment.completed_at), 'dd.MM.yyyy HH:mm')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

