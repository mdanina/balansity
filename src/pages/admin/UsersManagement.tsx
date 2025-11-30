import { useState } from 'react';
import { useAdminUsers, useUpdateUser } from '@/hooks/admin/useAdminUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    email: string;
    phone: string;
    region: string;
    role: string;
    marketing_consent: boolean;
  } | null>(null);

  const { data: users, isLoading } = useAdminUsers();
  const updateUser = useUpdateUser();

  const filteredUsers = users?.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user: any) => {
    setEditingUser(user.id);
    setEditForm({
      email: user.email || '',
      phone: user.phone || '',
      region: user.region || '',
      role: user.role || 'user',
      marketing_consent: user.marketing_consent || false,
    });
  };

  const handleSave = async () => {
    if (!editingUser || !editForm) return;

    await updateUser.mutateAsync({
      id: editingUser,
      updates: {
        email: editForm.email || null,
        phone: editForm.phone || null,
        region: editForm.region || null,
        role: editForm.role as any,
        marketing_consent: editForm.marketing_consent,
      },
    });

    setEditingUser(null);
    setEditForm(null);
  };

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
        <h1 className="text-3xl font-bold">Управление пользователями</h1>
        <p className="text-muted-foreground mt-1">
          Всего пользователей: {users?.length || 0}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск пользователей</CardTitle>
          <CardDescription>Найдите пользователя по email, телефону или ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Регион</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Маркетинг</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email || '—'}</TableCell>
                  <TableCell>{user.phone || '—'}</TableCell>
                  <TableCell>{user.region || '—'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'support'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{user.marketing_consent ? 'Да' : 'Нет'}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Редактировать пользователя</DialogTitle>
                          <DialogDescription>
                            Измените данные пользователя
                          </DialogDescription>
                        </DialogHeader>
                        {editForm && (
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Email</Label>
                              <Input
                                value={editForm.email}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, email: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label>Телефон</Label>
                              <Input
                                value={editForm.phone}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, phone: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label>Регион</Label>
                              <Input
                                value={editForm.region}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, region: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label>Роль</Label>
                              <Select
                                value={editForm.role}
                                onValueChange={(value) =>
                                  setEditForm({ ...editForm, role: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Пользователь</SelectItem>
                                  <SelectItem value="support">Поддержка</SelectItem>
                                  <SelectItem value="admin">Администратор</SelectItem>
                                  <SelectItem value="super_admin">Супер-администратор</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="marketing"
                                checked={editForm.marketing_consent}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    marketing_consent: e.target.checked,
                                  })
                                }
                              />
                              <Label htmlFor="marketing">Согласие на маркетинг</Label>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingUser(null);
                              setEditForm(null);
                            }}
                          >
                            Отмена
                          </Button>
                          <Button onClick={handleSave} disabled={updateUser.isPending}>
                            {updateUser.isPending ? 'Сохранение...' : 'Сохранить'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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

