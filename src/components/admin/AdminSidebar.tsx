import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Settings,
  MessageSquare,
  UserPlus,
} from 'lucide-react';

const navigation = [
  { name: 'Дэшборд', href: '/admin', icon: LayoutDashboard },
  { name: 'Пользователи', href: '/admin/users', icon: Users },
  { name: 'Оценки', href: '/admin/assessments', icon: FileText },
  { name: 'Консультации', href: '/admin/appointments', icon: Calendar },
  { name: 'Назначения', href: '/admin/assignments', icon: UserPlus },
  { name: 'Платежи', href: '/admin/payments', icon: CreditCard },
  { name: 'Контент', href: '/admin/content', icon: Settings },
  { name: 'Блог', href: '/admin/blog', icon: FileText },
  { name: 'Поддержка', href: '/admin/support', icon: MessageSquare },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-background">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}








