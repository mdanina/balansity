import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function AdminHeader() {
  const { adminUser, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Админ-панель</h1>
            {adminUser && (
              <span className="text-sm text-muted-foreground">
                {adminUser.email} ({adminUser.role})
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}





