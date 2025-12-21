-- Миграция: Ограничение RLS для blog-images storage
-- Дата: 2025-12-21
-- Цель: Только админы могут загружать/удалять изображения блога

-- ============================================
-- 1. Удаляем небезопасные политики
-- ============================================

DROP POLICY IF EXISTS "blog-images insert for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "blog-images update for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "blog-images delete for authenticated" ON storage.objects;

-- ============================================
-- 2. Создаём безопасные политики только для админов
-- ============================================

-- Функция проверки админа (если ещё не существует)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- INSERT: Только админы могут загружать
CREATE POLICY "blog-images insert for admins only"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.is_admin()
  );

-- UPDATE: Только админы могут обновлять
CREATE POLICY "blog-images update for admins only"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.is_admin()
  );

-- DELETE: Только админы могут удалять
CREATE POLICY "blog-images delete for admins only"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.is_admin()
  );

-- SELECT: Публичный доступ для чтения (оставляем как есть)
-- Политика "blog-images public read" уже должна существовать

-- ============================================
-- 3. Комментарий для документации
-- ============================================

COMMENT ON POLICY "blog-images insert for admins only" ON storage.objects IS
'Только администраторы могут загружать изображения в блог';

COMMENT ON POLICY "blog-images delete for admins only" ON storage.objects IS
'Только администраторы могут удалять изображения блога';
