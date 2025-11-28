// Страница регистрации
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logoOtters from '@/assets/logo-otters.png';

export default function Register() {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Если пользователь уже авторизован, редиректим на dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password);
      const { data, error } = result;

      console.log('Registration result:', { data, error });

      // Если есть ошибка
      if (error) {
        console.error('Registration error:', error);
        
        // Проверяем, создан ли пользователь несмотря на ошибку
        if (data?.user) {
          console.log('User created despite error, proceeding...');
          toast.success('Регистрация успешна! Заполните ваш профиль.');
          navigate('/profile');
          return;
        }
        
        // Если ошибка связана с email, но пользователь может быть создан
        const emailError = error.message?.toLowerCase().includes('email') || 
                          error.message?.toLowerCase().includes('confirmation') ||
                          error.message?.toLowerCase().includes('sending');
        
        if (emailError) {
          // Попробуем войти, если пользователь был создан
          console.log('Email error detected, trying to sign in...');
          // Попробуем войти через 1 секунду
          setTimeout(async () => {
            const signInResult = await supabase.auth.signInWithPassword({ email, password });
            if (signInResult.data?.user) {
              toast.success('Регистрация успешна! Заполните ваш профиль.');
              navigate('/profile');
            } else {
              toast.error('Ошибка при регистрации: ' + (error.message || 'Не удалось создать пользователя'));
              setLoading(false);
            }
          }, 1000);
          return;
        }
        
        toast.error(error.message || 'Ошибка при регистрации');
        setLoading(false);
      } else {
        // Нет ошибки - проверяем данные
        if (data?.user) {
          console.log('User created successfully');
          toast.success('Регистрация успешна! Заполните ваш профиль.');
          navigate('/profile');
        } else {
          console.error('No user in response');
          toast.error('Ошибка при создании пользователя');
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Registration exception:', err);
      toast.error(err.message || 'Неожиданная ошибка при регистрации');
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-foreground">Регистрация</h1>
            <p className="mt-2 text-muted-foreground">
              Создайте аккаунт для начала работы
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
                minLength={6}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Минимум 6 символов
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

