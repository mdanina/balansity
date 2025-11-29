// Страница входа
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Если пользователь уже авторизован, редиректим на dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (data: LoginInput) => {
    try {
      const { error } = await handleApiError(
        () => signIn(data.email, data.password),
        'Ошибка при входе'
      );

      if (error) {
        toast.error(error.message || 'Ошибка при входе');
        return;
      }

      toast.success('Вход выполнен успешно!');
      
      // Проверяем, заполнен ли профиль пользователя
      const { getCurrentUserData } = await import('@/lib/userStorage');
      const { getProfiles } = await import('@/lib/profileStorage');
      
      try {
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
      } catch (profileError) {
        logger.error('Error loading user profile:', profileError);
        // Продолжаем на dashboard даже если ошибка загрузки профиля
        navigate('/dashboard');
      }
    } catch (err) {
      logger.error('Login exception:', err);
      // Ошибка уже обработана в handleApiError
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-2xl font-serif font-bold text-primary">Balansity</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Вход в систему</h1>
            <p className="mt-2 text-muted-foreground">
              Войдите в свой аккаунт для продолжения
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your@email.com"
                className="h-12"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="h-12"
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-12 w-full"
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
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

