import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  MessageSquare,
  FileText,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Типы данных (потом переместим в отдельный файл)
interface Client {
  id: string;
  email: string;
  phone?: string;
  region?: string;
  assignmentType: 'primary' | 'consultant' | 'temporary';
  assignedAt: string;
  lastAppointmentAt?: string;
  nextAppointmentAt?: string;
  totalAppointments: number;
  completedAppointments: number;
}

export default function SpecialistClients() {
  const [searchQuery, setSearchQuery] = useState('');

  // Заглушка для данных (потом заменим на реальные из API)
  const clients: Client[] = [];

  const filteredClients = clients.filter(
    (client) =>
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery)
  );

  const getAssignmentBadge = (type: Client['assignmentType']) => {
    switch (type) {
      case 'primary':
        return <Badge>Основной</Badge>;
      case 'consultant':
        return <Badge variant="secondary">Консультант</Badge>;
      case 'temporary':
        return <Badge variant="outline">Временный</Badge>;
    }
  };

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
      </div>

      {/* Поиск */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по email или телефону..."
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
                  <TableHead>Тип назначения</TableHead>
                  <TableHead>Консультации</TableHead>
                  <TableHead>Следующая встреча</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {client.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.email}</p>
                          {client.phone && (
                            <p className="text-sm text-muted-foreground">{client.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getAssignmentBadge(client.assignmentType)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{client.completedAppointments}</span>
                      <span className="text-muted-foreground"> / {client.totalAppointments}</span>
                    </TableCell>
                    <TableCell>
                      {client.nextAppointmentAt ? (
                        <span className="text-sm">
                          {new Date(client.nextAppointmentAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Не запланировано</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Написать">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Календарь">
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Заметки">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/specialist/clients/${client.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
