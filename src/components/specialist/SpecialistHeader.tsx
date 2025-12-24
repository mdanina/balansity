import { useNavigate } from 'react-router-dom';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Bell } from 'lucide-react';

export function SpecialistHeader() {
  const { specialistUser, signOut } = useSpecialistAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/specialist/login');
  };

  const displayName = specialistUser?.specialist?.display_name || specialistUser?.email || 'Специалист';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Лого */}
        <div className="flex items-center gap-4">
          <a href="/specialist" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-lg">Balansity</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Специалист
            </span>
          </a>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-4">
          {/* Уведомления */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {/* Бейдж с количеством */}
            {/* <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              3
            </span> */}
          </Button>

          {/* Профиль */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={specialistUser?.specialist?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-medium">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/specialist/profile')}>
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/specialist/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
