import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, adminUser, loading, isStaff, loadUserData } = useAdminAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) {
        navigate('/admin/login', { replace: true });
        setIsChecking(false);
        return;
      }

      // Если данные пользователя еще не загружены, загружаем их
      if (!adminUser && user) {
        await loadUserData(user.id);
      }

      setIsChecking(false);
    }

    if (!loading) {
      checkAdminAccess();
    }
  }, [user, adminUser, loading, navigate, loadUserData]);

  useEffect(() => {
    if (!isChecking && !loading) {
      if (!user || !adminUser || !isStaff) {
        navigate('/admin/login', { replace: true });
      }
    }
  }, [user, adminUser, isStaff, loading, isChecking, navigate]);

  if (loading || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || !adminUser || !isStaff) {
    return null; // Редирект уже произошел
  }

  return <>{children}</>;
}

