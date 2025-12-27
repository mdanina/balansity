/**
 * Authentication Middleware
 * Проверка JWT токена из Supabase Auth
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../services/supabase.js';
import { logger } from '../../utils/logger.js';

/**
 * Middleware для проверки Bearer token
 * Добавляет userId в request
 */
export async function verifyAuthToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Верифицируем токен через Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn(`Auth failed: ${error?.message || 'No user found'}`);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Добавляем userId в request
    (req as any).userId = user.id;
    (req as any).userEmail = user.email;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware для опциональной аутентификации
 * Не блокирует запрос, но добавляет userId если токен валидный
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        (req as any).userId = user.id;
        (req as any).userEmail = user.email;
      }
    }

    next();
  } catch (error) {
    // Игнорируем ошибки, просто продолжаем без userId
    next();
  }
}

/**
 * Middleware для проверки админских прав
 */
export async function verifyAdminToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Сначала проверяем обычную авторизацию
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Проверяем роль пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    (req as any).userId = user.id;
    (req as any).userEmail = user.email;
    (req as any).isAdmin = true;

    next();
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
