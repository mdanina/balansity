// Контекст для управления авторизацией
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { isSessionExpired, isSessionValid } from '@/lib/authUtils';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isInitialized = false;
    let timeoutId: NodeJS.Timeout | null = null;

    // Функция для обновления состояния сессии
    const updateSession = (newSession: Session | null) => {
      if (!mounted) return;
      
      if (newSession) {
        if (isSessionExpired(newSession)) {
          logger.warn('Session expired, clearing...');
          supabase.auth.signOut();
          setSession(null);
          setUser(null);
          // Clear Sentry user context (async)
          import('@/lib/sentry').then(({ setSentryUser }) => {
            setSentryUser(null).catch(() => {});
          }).catch(() => {});
        } else {
          setSession(newSession);
          const currentUser = newSession.user ?? null;
          setUser(currentUser);
          // Set user in Sentry for error tracking (async, don't block)
          if (currentUser) {
            import('@/lib/sentry').then(({ setSentryUser }) => {
              setSentryUser({
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.user_metadata?.name || currentUser.email,
              }).catch(() => {
                // Silently fail if Sentry is not installed
              });
            }).catch(() => {
              // Silently fail if Sentry module can't be loaded
            });
          } else {
            import('@/lib/sentry').then(({ setSentryUser }) => {
              setSentryUser(null).catch(() => {});
            }).catch(() => {});
          }
        }
      } else {
        setSession(null);
        setUser(null);
        // Clear Sentry user context (async)
        import('@/lib/sentry').then(({ setSentryUser }) => {
          setSentryUser(null).catch(() => {});
        }).catch(() => {});
      }
      
      // Устанавливаем loading в false только после первой инициализации
      if (!isInitialized) {
        isInitialized = true;
        setLoading(false);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    // Получаем текущую сессию
    const sessionPromise = supabase.auth.getSession();
    
    // Fallback таймаут - гарантированно устанавливает loading = false через 10 секунд
    // Это защита от зависания, если что-то пошло не так
    timeoutId = setTimeout(() => {
      if (!isInitialized && mounted) {
        logger.warn('Session loading timeout - forcing initialization');
        isInitialized = true;
        setLoading(false);
      }
    }, 10000);

    sessionPromise.then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        logger.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        if (!isInitialized) {
          isInitialized = true;
          setLoading(false);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        return;
      }
      
      // Если сессия null, все равно инициализируем
      if (!session && !isInitialized) {
        isInitialized = true;
        setLoading(false);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
      
      updateSession(session);
    }).catch((error) => {
      // Обработка неожиданных ошибок
      if (!mounted) return;
      logger.error('Unexpected error getting session:', error);
      setSession(null);
      setUser(null);
      if (!isInitialized) {
        isInitialized = true;
        setLoading(false);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });

    // Слушаем изменения авторизации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
      logger.log('Auth state changed:', event, newSession?.user?.email);
      
      // Обрабатываем INITIAL_SESSION - это может прийти раньше, чем getSession завершится
      if (event === 'INITIAL_SESSION') {
        if (newSession) {
          updateSession(newSession);
        } else if (!isInitialized) {
          // Если сессии нет, все равно инициализируем
          isInitialized = true;
          setLoading(false);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
        return;
      }
      
      // Если сессия истекла или была удалена, очищаем состояние
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !newSession)) {
        setSession(null);
        setUser(null);
      } else {
        updateSession(newSession);
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear Sentry user context on logout (async)
    import('@/lib/sentry').then(({ setSentryUser }) => {
      setSentryUser(null).catch(() => {});
    }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

