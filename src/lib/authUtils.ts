// Утилиты для работы с авторизацией
import type { Session } from '@supabase/supabase-js';

/**
 * Проверяет, валидна ли сессия (не истекла)
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  
  // Если expires_at не указан, считаем сессию валидной
  // (Supabase может обновлять токены автоматически)
  return !expiresAt || expiresAt >= now;
}

/**
 * Проверяет, истекла ли сессия
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  
  return expiresAt ? expiresAt < now : false;
}








