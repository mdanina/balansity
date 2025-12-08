-- ============================================
-- Добавление поля для отслеживания бесплатной консультации
-- ============================================

-- Добавляем поле в таблицу users для отслеживания, была ли создана бесплатная консультация
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS free_consultation_created boolean DEFAULT false;

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_free_consultation_created ON public.users(free_consultation_created);









