/**
 * Страница профиля специалиста
 * Редактирование личной информации и публичного профиля
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  Camera,
  Loader2,
  Save,
  Globe,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { supabase } from '@/lib/supabase';

// Специализации
const SPECIALIZATIONS = [
  { code: 'child_psychology', label: 'Детская психология' },
  { code: 'family_therapy', label: 'Семейная терапия' },
  { code: 'cbt', label: 'КПТ' },
  { code: 'trauma', label: 'Работа с травмой' },
  { code: 'anxiety', label: 'Тревожные расстройства' },
  { code: 'depression', label: 'Депрессия' },
  { code: 'adhd', label: 'СДВГ' },
  { code: 'autism', label: 'Аутизм' },
  { code: 'eating_disorders', label: 'Расстройства питания' },
  { code: 'parenting', label: 'Родительство' },
];

export default function SpecialistProfile() {
  const { toast } = useToast();
  const { specialistUser, refreshSpecialistProfile } = useSpecialistAuth();
  const specialist = specialistUser?.specialist;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Форма профиля
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [acceptsNewClients, setAcceptsNewClients] = useState(true);

  // Загрузка данных профиля
  useEffect(() => {
    if (specialist) {
      setDisplayName(specialist.display_name || '');
      setBio(specialist.bio || '');
      setExperienceYears(specialist.experience_years || '');
      setSelectedSpecializations(specialist.specialization_codes || []);
      setIsAvailable(specialist.is_available);
      setAcceptsNewClients(specialist.accepts_new_clients);
    }
  }, [specialist]);

  // Переключение специализации
  const toggleSpecialization = (code: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  // Сохранение профиля
  const handleSave = async () => {
    if (!specialist) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('specialists')
        .update({
          display_name: displayName,
          bio: bio || null,
          experience_years: experienceYears || null,
          specialization_codes: selectedSpecializations,
          is_available: isAvailable,
          accepts_new_clients: acceptsNewClients,
          updated_at: new Date().toISOString(),
        })
        .eq('id', specialist.id);

      if (error) throw error;

      // Обновляем данные в контексте
      await refreshSpecialistProfile();

      toast({
        title: 'Профиль обновлён',
        description: 'Изменения успешно сохранены',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Получить инициалы
  const getInitials = () => {
    if (displayName) {
      const parts = displayName.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return specialistUser?.email?.[0]?.toUpperCase() || '?';
  };

  if (!specialist) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Мой профиль</h1>
        <p className="text-muted-foreground">
          Управление личной информацией и публичным профилем
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Боковая панель - Аватар и статус */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={specialist.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  disabled
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <h2 className="mt-4 text-xl font-semibold">
                {displayName || specialistUser?.email}
              </h2>
              <p className="text-sm text-muted-foreground">
                {specialistUser?.email}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant={isAvailable ? 'default' : 'secondary'}>
                  {isAvailable ? 'Доступен' : 'Не в сети'}
                </Badge>
                {acceptsNewClients && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    Принимает клиентов
                  </Badge>
                )}
              </div>

              <Separator className="my-4" />

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>Статус онлайн</span>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Новые клиенты</span>
                  </div>
                  <Switch
                    checked={acceptsNewClients}
                    onCheckedChange={setAcceptsNewClients}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Основная форма */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Информация профиля</CardTitle>
            <CardDescription>
              Эта информация будет отображаться клиентам
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Имя */}
            <div className="space-y-2">
              <Label htmlFor="display-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Отображаемое имя
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Как вас будут видеть клиенты"
              />
            </div>

            {/* О себе */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                О себе
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о своём опыте, подходе к работе, образовании..."
                rows={4}
              />
            </div>

            {/* Опыт работы */}
            <div className="space-y-2">
              <Label htmlFor="experience" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Опыт работы (лет)
              </Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Количество лет опыта"
                className="w-32"
              />
            </div>

            {/* Специализации */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Специализации
              </Label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((spec) => (
                  <Badge
                    key={spec.code}
                    variant={selectedSpecializations.includes(spec.code) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSpecialization(spec.code)}
                  >
                    {spec.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Контактная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Контактная информация</CardTitle>
          <CardDescription>
            Информация из вашего аккаунта (только для чтения)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{specialistUser?.email || 'Не указан'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium">Не указан</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
