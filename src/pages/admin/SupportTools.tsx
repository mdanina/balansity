import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Search, User } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function SupportTools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['support-users', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, email, phone, created_at')
        .or(`email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.length > 2,
  });

  const { data: userData } = useQuery({
    queryKey: ['support-user-data', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;

      const [userResult, profilesResult, assessmentsResult, appointmentsResult] = await Promise.all([
        supabase.from('users').select('*').eq('id', selectedUserId).single(),
        supabase.from('profiles').select('*').eq('user_id', selectedUserId),
        supabase
          .from('assessments')
          .select('*, profile:profiles!inner(user_id)')
          .eq('profile.user_id', selectedUserId)
          .limit(10),
        supabase.from('appointments').select('*').eq('user_id', selectedUserId).limit(10),
      ]);

      return {
        user: userResult.data,
        profiles: profilesResult.data || [],
        assessments: assessmentsResult.data || [],
        appointments: appointmentsResult.data || [],
      };
    },
    enabled: !!selectedUserId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Инструменты поддержки</h1>
        <p className="text-muted-foreground mt-1">
          Быстрый доступ к данным пользователей
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск пользователя</CardTitle>
          <CardDescription>Найдите пользователя для просмотра его данных</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по email или телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {users && users.length > 0 && (
            <div className="space-y-2">
              {users.map((user) => (
                <Button
                  key={user.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {user.email || user.phone || user.id}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {userData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Информация о пользователе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p>{userData.user?.email || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Телефон</Label>
                <p>{userData.user?.phone || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Регион</Label>
                <p>{userData.user?.region || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Роль</Label>
                <p>{userData.user?.role || 'user'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Профили ({userData.profiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userData.profiles.map((profile: any) => (
                  <div key={profile.id} className="p-2 border rounded">
                    <p className="font-medium">
                      {profile.first_name} {profile.last_name || ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{profile.type}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Оценки ({userData.assessments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userData.assessments.map((assessment: any) => (
                  <div key={assessment.id} className="p-2 border rounded">
                    <p className="font-medium">{assessment.assessment_type}</p>
                    <p className="text-xs text-muted-foreground">{assessment.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Консультации ({userData.appointments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userData.appointments.map((appointment: any) => (
                  <div key={appointment.id} className="p-2 border rounded">
                    <p className="font-medium">
                      {new Date(appointment.scheduled_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{appointment.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

