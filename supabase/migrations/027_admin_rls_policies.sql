-- ============================================
-- Supabase Migration: Admin RLS Policies
-- ============================================
-- RLS политики для админов и поддержки

-- ============================================
-- 1. Таблица users - политики для админов
-- ============================================

-- Админы могут видеть всех пользователей
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id OR 
    public.is_admin()
  );

-- Админы могут обновлять всех пользователей (включая роли)
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Админы могут видеть все профили
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- Админы могут обновлять все профили
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- Админы могут удалять профили (с осторожностью)
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles FOR DELETE
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- ============================================
-- 2. Таблица assessments - политики для админов
-- ============================================

-- Админы могут видеть все оценки
DROP POLICY IF EXISTS "Admins can view all assessments" ON public.assessments;
CREATE POLICY "Admins can view all assessments"
  ON public.assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = assessments.profile_id
      AND profiles.user_id = auth.uid()
    ) OR 
    public.is_admin()
  );

-- Админы могут обновлять все оценки
DROP POLICY IF EXISTS "Admins can update all assessments" ON public.assessments;
CREATE POLICY "Admins can update all assessments"
  ON public.assessments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = assessments.profile_id
      AND profiles.user_id = auth.uid()
    ) OR 
    public.is_admin()
  );

-- ============================================
-- 3. Таблица answers - политики для админов
-- ============================================

-- Админы могут видеть все ответы
DROP POLICY IF EXISTS "Admins can view all answers" ON public.answers;
CREATE POLICY "Admins can view all answers"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      JOIN public.profiles ON profiles.id = assessments.profile_id
      WHERE assessments.id = answers.assessment_id
      AND profiles.user_id = auth.uid()
    ) OR 
    public.is_admin()
  );

-- ============================================
-- 4. Таблица appointments - политики для админов
-- ============================================

-- Админы могут видеть все консультации
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- Админы могут обновлять все консультации
DROP POLICY IF EXISTS "Admins can update all appointments" ON public.appointments;
CREATE POLICY "Admins can update all appointments"
  ON public.appointments FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- ============================================
-- 5. Таблица payments - политики для админов
-- ============================================

-- Админы могут видеть все платежи
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- Админы могут обновлять все платежи
DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;
CREATE POLICY "Admins can update all payments"
  ON public.payments FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- ============================================
-- 6. Таблица appointment_types - политики для админов
-- ============================================

-- Админы могут управлять типами консультаций
DROP POLICY IF EXISTS "Admins can manage appointment types" ON public.appointment_types;
CREATE POLICY "Admins can manage appointment types"
  ON public.appointment_types FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 7. Таблица packages - политики для админов
-- ============================================

-- Админы могут управлять пакетами
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 8. Таблица package_purchases - политики для админов
-- ============================================

-- Админы могут видеть все покупки пакетов
DROP POLICY IF EXISTS "Admins can view all package purchases" ON public.package_purchases;
CREATE POLICY "Admins can view all package purchases"
  ON public.package_purchases FOR SELECT
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- Админы могут обновлять покупки пакетов
DROP POLICY IF EXISTS "Admins can update all package purchases" ON public.package_purchases;
CREATE POLICY "Admins can update all package purchases"
  ON public.package_purchases FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );










