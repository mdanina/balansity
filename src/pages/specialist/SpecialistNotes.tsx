/**
 * Страница всех заметок специалиста
 * Показывает заметки сессий, сгруппированные по клиентам
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Search,
  User,
  Calendar,
  Clock,
  ChevronRight,
  MessageSquare,
  Filter,
  Brain,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { getMyClinicalNotes } from '@/lib/supabase-ai';
import type { GeneratedClinicalNote } from '@/types/ai.types';

interface NoteWithAppointment {
  id: string;
  content: string;
  source: 'manual' | 'file';
  created_at: string;
  appointment: {
    id: string;
    scheduled_at: string;
    client_user_id: string;
    client_name: string;
    client_email: string | null;
  };
}

export default function SpecialistNotes() {
  const { toast } = useToast();
  const { specialistUser } = useSpecialistAuth();

  const [sessionNotes, setSessionNotes] = useState<NoteWithAppointment[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<GeneratedClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('session');

  useEffect(() => {
    if (specialistUser?.specialist?.id) {
      loadNotes();
    }
  }, [specialistUser?.specialist?.id]);

  const loadNotes = async () => {
    if (!specialistUser?.specialist?.id) return;

    try {
      setIsLoading(true);

      // Загружаем заметки сессий с данными о консультациях и клиентах
      const { data: notesData, error: notesError } = await supabase
        .from('session_notes')
        .select(`
          id,
          content,
          source,
          created_at,
          appointment:appointments!inner (
            id,
            scheduled_at,
            user_id,
            specialist_id
          )
        `)
        .eq('appointment.specialist_id', specialistUser.specialist.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (notesError) throw notesError;

      // Получаем уникальных клиентов для дополнительных данных
      if (notesData && notesData.length > 0) {
        const clientIds = [...new Set(notesData.map((n: any) => n.appointment.user_id))];

        const { data: clientsData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', clientIds);

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', clientIds);

        const clientsMap = new Map();
        clientsData?.forEach(client => {
          const profile = profilesData?.find(p => p.user_id === client.id);
          const name = profile
            ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
            : client.email || 'Клиент';
          clientsMap.set(client.id, { name, email: client.email });
        });

        const enrichedNotes = notesData.map((note: any) => ({
          id: note.id,
          content: note.content,
          source: note.source,
          created_at: note.created_at,
          appointment: {
            id: note.appointment.id,
            scheduled_at: note.appointment.scheduled_at,
            client_user_id: note.appointment.user_id,
            client_name: clientsMap.get(note.appointment.user_id)?.name || 'Клиент',
            client_email: clientsMap.get(note.appointment.user_id)?.email || null,
          },
        }));

        setSessionNotes(enrichedNotes);
      } else {
        setSessionNotes([]);
      }

      // Загружаем AI-заметки
      try {
        const aiNotes = await getMyClinicalNotes();
        setClinicalNotes(aiNotes);
      } catch {
        console.log('No clinical notes found');
        setClinicalNotes([]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заметки',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Фильтрация заметок по поиску
  const filteredSessionNotes = sessionNotes.filter((note) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.content.toLowerCase().includes(query) ||
      note.appointment.client_name.toLowerCase().includes(query)
    );
  });

  const filteredClinicalNotes = clinicalNotes.filter((note) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query);
  });

  // Группировка заметок сессий по клиентам
  const groupedByClient = filteredSessionNotes.reduce((acc, note) => {
    const clientId = note.appointment.client_user_id;
    if (!acc[clientId]) {
      acc[clientId] = {
        clientName: note.appointment.client_name,
        clientEmail: note.appointment.client_email,
        notes: [],
      };
    }
    acc[clientId].notes.push(note);
    return acc;
  }, {} as Record<string, { clientName: string; clientEmail: string | null; notes: NoteWithAppointment[] }>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Заметки</h1>
          <p className="text-muted-foreground">
            Все ваши заметки и AI-генерированные клинические записи
          </p>
        </div>
        <Button asChild>
          <Link to="/specialist/ai-analysis">
            <Brain className="mr-2 h-4 w-4" />
            Создать AI-заметку
          </Link>
        </Button>
      </div>

      {/* Поиск */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по заметкам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Табы */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="session" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Заметки сессий
            {sessionNotes.length > 0 && (
              <Badge variant="secondary" className="ml-1">{sessionNotes.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="clinical" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI-заметки
            {clinicalNotes.length > 0 && (
              <Badge variant="secondary" className="ml-1">{clinicalNotes.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Заметки сессий */}
        <TabsContent value="session" className="space-y-6">
          {Object.keys(groupedByClient).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Нет заметок</p>
                <p className="text-sm mt-1">
                  {searchQuery
                    ? 'По вашему запросу ничего не найдено'
                    : 'Начните создавать заметки во время сессий'}
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByClient).map(([clientId, { clientName, notes }]) => (
              <Card key={clientId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{clientName}</CardTitle>
                        <CardDescription>{notes.length} заметок</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/specialist/clients/${clientId}`}>
                        Профиль клиента
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateTime(note.appointment.scheduled_at)}</span>
                          <Badge variant="outline" className="text-xs">
                            {note.source === 'manual' ? 'Ручная' : 'Из файла'}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/specialist/sessions/${note.appointment.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <p className="text-sm line-clamp-2">{note.content}</p>
                    </div>
                  ))}
                  {notes.length > 3 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to={`/specialist/clients/${clientId}`}>
                        Показать все {notes.length} заметок
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* AI-заметки */}
        <TabsContent value="clinical" className="space-y-4">
          {filteredClinicalNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Нет AI-заметок</p>
                <p className="text-sm mt-1">
                  {searchQuery
                    ? 'По вашему запросу ничего не найдено'
                    : 'Создайте первую клиническую заметку с помощью AI'}
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/specialist/ai-analysis">
                    <Brain className="mr-2 h-4 w-4" />
                    Создать заметку
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredClinicalNotes.map((note) => (
                <Card
                  key={note.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Brain className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{note.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(note.created_at)}
                            {note.sections && (
                              <> • {note.sections.length} секций</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={note.status === 'finalized' ? 'default' : 'outline'}>
                          {note.status === 'finalized' ? 'Сохранено' :
                           note.status === 'draft' ? 'Черновик' : note.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
