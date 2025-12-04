-- ============================================
-- Supabase Migration: Fix RLS Auth UID Performance
-- Migration: 035_fix_rls_auth_uid_performance.sql
-- ============================================
-- Исправление проблемы производительности "Auth RLS Initialization Plan"
-- Замена auth.uid() на (select auth.uid()) для оптимизации
-- 
-- Проблема: auth.uid() переоценивается для каждой строки
-- Решение: (select auth.uid()) вычисляется один раз и кэшируется
-- ============================================

-- ============================================
-- 1. Таблица users
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- Админские политики для users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    (select auth.uid()) = id OR 
    public.is_admin()
  );

-- ============================================
-- 2. Таблица profiles
-- ============================================

DROP POLICY IF EXISTS "Users can view own family profiles" ON public.profiles;
CREATE POLICY "Users can view own family profiles"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own family profiles" ON public.profiles;
CREATE POLICY "Users can insert own family profiles"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own family profiles" ON public.profiles;
CREATE POLICY "Users can update own family profiles"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own family profiles" ON public.profiles;
CREATE POLICY "Users can delete own family profiles"
  ON public.profiles FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Админские политики для profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles FOR DELETE
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

-- ============================================
-- 3. Таблица assessments
-- ============================================

DROP POLICY IF EXISTS "Users can view own family assessments" ON public.assessments;
CREATE POLICY "Users can view own family assessments"
  ON public.assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = assessments.profile_id
      AND profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own family assessments" ON public.assessments;
CREATE POLICY "Users can insert own family assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = assessments.profile_id
      AND profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own family assessments" ON public.assessments;
CREATE POLICY "Users can update own family assessments"
  ON public.assessments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = assessments.profile_id
      AND profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own family assessments" ON public.assessments;
CREATE POLICY "Users can delete own family assessments"
  ON public.assessments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = assessments.profile_id
      AND profiles.user_id = (select auth.uid())
    )
  );

-- Админские политики для assessments
DROP POLICY IF EXISTS "Admins can view all assessments" ON public.assessments;
CREATE POLICY "Admins can view all assessments"
  ON public.assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = assessments.profile_id
      AND profiles.user_id = (select auth.uid())
    ) OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update all assessments" ON public.assessments;
CREATE POLICY "Admins can update all assessments"
  ON public.assessments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = assessments.profile_id
      AND profiles.user_id = (select auth.uid())
    ) OR 
    public.is_admin()
  );

-- ============================================
-- 4. Таблица answers
-- ============================================

DROP POLICY IF EXISTS "Users can view own family answers" ON public.answers;
CREATE POLICY "Users can view own family answers"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      JOIN public.profiles ON profiles.id = assessments.profile_id
      WHERE assessments.id = answers.assessment_id
      AND profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own family answers" ON public.answers;
CREATE POLICY "Users can insert own family answers"
  ON public.answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments
      JOIN public.profiles ON profiles.id = assessments.profile_id
      WHERE assessments.id = answers.assessment_id
      AND profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own family answers" ON public.answers;
CREATE POLICY "Users can update own family answers"
  ON public.answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      JOIN public.profiles ON profiles.id = assessments.profile_id
      WHERE assessments.id = answers.assessment_id
      AND profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own family answers" ON public.answers;
CREATE POLICY "Users can delete own family answers"
  ON public.answers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      JOIN public.profiles ON profiles.id = assessments.profile_id
      WHERE assessments.id = answers.assessment_id
      AND profiles.user_id = (select auth.uid())
    )
  );

-- Админские политики для answers
DROP POLICY IF EXISTS "Admins can view all answers" ON public.answers;
CREATE POLICY "Admins can view all answers"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      JOIN public.profiles ON profiles.id = assessments.profile_id
      WHERE assessments.id = answers.assessment_id
      AND profiles.user_id = (select auth.uid())
    ) OR 
    public.is_admin()
  );

-- ============================================
-- 5. Таблица appointments
-- ============================================

DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments"
  ON public.appointments FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
CREATE POLICY "Users can delete own appointments"
  ON public.appointments FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Админские политики для appointments
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update all appointments" ON public.appointments;
CREATE POLICY "Admins can update all appointments"
  ON public.appointments FOR UPDATE
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

-- ============================================
-- 6. Таблица payments
-- ============================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments"
  ON public.payments FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Админские политики для payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;
CREATE POLICY "Admins can update all payments"
  ON public.payments FOR UPDATE
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

-- ============================================
-- 7. Таблица package_purchases
-- ============================================

DROP POLICY IF EXISTS "Users can view own package purchases" ON public.package_purchases;
CREATE POLICY "Users can view own package purchases"
  ON public.package_purchases FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own package purchases" ON public.package_purchases;
CREATE POLICY "Users can insert own package purchases"
  ON public.package_purchases FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own package purchases" ON public.package_purchases;
CREATE POLICY "Users can update own package purchases"
  ON public.package_purchases FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Админские политики для package_purchases
DROP POLICY IF EXISTS "Admins can view all package purchases" ON public.package_purchases;
CREATE POLICY "Admins can view all package purchases"
  ON public.package_purchases FOR SELECT
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update all package purchases" ON public.package_purchases;
CREATE POLICY "Admins can update all package purchases"
  ON public.package_purchases FOR UPDATE
  USING (
    (select auth.uid()) = user_id OR 
    public.is_admin()
  );

