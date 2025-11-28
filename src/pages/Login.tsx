// Страница входа
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logoOtters from '@/assets/logo-otters.png';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || 'Ошибка при входе');
      setLoading(false);
    } else {
      toast.success('Вход выполнен успешно!');
      // Проверяем, заполнен ли профиль пользователя
      const { getCurrentUserData } = await import('@/lib/userStorage');
      const { getProfiles } = await import('@/lib/profileStorage');
      
      const userData = await getCurrentUserData();
      const profiles = await getProfiles();
      const parentProfile = profiles.find(p => p.type === 'parent');
      
      // Если профиль не заполнен или нет профиля родителя, идем на страницу профиля
      if (!userData || !userData.phone || !parentProfile) {
        navigate('/profile');
      } else if (!userData.region) {
        // Если регион не заполнен, идем на выбор региона
        navigate('/region');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={logoOtters} alt="Little Otter" className="h-12 w-12" />
              <span className="text-2xl font-bold text-primary">Little Otter</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Вход в систему</h1>
            <p className="mt-2 text-muted-foreground">
              Войдите в свой аккаунт для продолжения
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 w-full"
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

