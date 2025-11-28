// Компонент для защиты маршрутов (требует авторизации)
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, session } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Проверяем, что есть и user, и валидная сессия
  if (!user || !session) {
    return <Navigate to="/login" replace />;
  }

  // Дополнительная проверка: если сессия истекла, редиректим на логин
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  if (expiresAt && expiresAt < now) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

