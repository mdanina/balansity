// Страница регистрации
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerSchema, type RegisterInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import logoOtters from '@/assets/logo-otters.png';

export default function Register() {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  // Если пользователь уже авторизован, редиректим на dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (data: RegisterInput) => {
    try {
      const result = await handleApiError(
        () => signUp(data.email, data.password),
        'Ошибка при регистрации'
      );
      
      const { data: signUpData, error } = result;

      // Если пользователь создан, даже если есть ошибка (например, email confirmation)
      if (signUpData?.user) {
        logger.log('User created successfully');
        toast.success('Регистрация успешна! Заполните ваш профиль.');
        navigate('/profile');
        return;
      }

      // Если ошибка и пользователь не создан
      if (error) {
        // Проверяем, не является ли ошибка связанной с email confirmation
        const isEmailError = 
          error.message?.toLowerCase().includes('email') ||
          error.message?.toLowerCase().includes('confirmation');

        if (isEmailError) {
          // Пытаемся войти сразу - возможно пользователь уже существует
          try {
            const signInResult = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password,
            });

            if (signInResult.data?.user) {
              toast.success('Регистрация успешна! Заполните ваш профиль.');
              navigate('/profile');
              return;
            }
          } catch (signInError) {
            logger.error('Error signing in after registration:', signInError);
          }
        }

        toast.error(error.message || 'Ошибка при регистрации');
      } else {
        toast.error('Не удалось создать пользователя');
      }
    } catch (err: unknown) {
      logger.error('Registration exception:', err);
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
              <img src={logoOtters} alt="Little Otter" className="h-12 w-12" />
              <span className="text-2xl font-bold text-primary">Little Otter</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Регистрация</h1>
            <p className="mt-2 text-muted-foreground">
              Создайте аккаунт для начала работы
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
              <p className="text-xs text-muted-foreground">
                Минимум 6 символов
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className="h-12"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-12 w-full"
            >
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
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

