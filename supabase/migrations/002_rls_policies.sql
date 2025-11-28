-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Политики безопасности для защиты данных пользователей

-- ============================================
-- 0. Создаем индексы для оптимизации RLS политик
-- ============================================
-- Эти индексы оптимизируют JOIN операции в RLS политиках для таблиц answers и assessments
CREATE INDEX IF NOT EXISTS idx_assessments_composite ON public.assessments(id, profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_composite ON public.profiles(id, user_id);

-- ============================================
-- 1. Включаем RLS для всех таблиц
-- ============================================
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.answers enable row level security;

-- ============================================
-- 2. Таблица users
-- ============================================
-- Пользователь может видеть и редактировать только свой профиль
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ============================================
-- 3. Таблица profiles
-- ============================================
-- Пользователь может видеть только профили своей семьи
create policy "Users can view own family profiles"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Пользователь может создавать профили только для своей семьи
create policy "Users can insert own family profiles"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Пользователь может обновлять только профили своей семьи
create policy "Users can update own family profiles"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Пользователь может удалять только профили своей семьи
create policy "Users can delete own family profiles"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- ============================================
-- 4. Таблица assessments
-- ============================================
-- Пользователь может видеть только оценки своей семьи
create policy "Users can view own family assessments"
  on public.assessments for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = assessments.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Пользователь может создавать оценки только для своей семьи
create policy "Users can insert own family assessments"
  on public.assessments for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = assessments.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Пользователь может обновлять только оценки своей семьи
create policy "Users can update own family assessments"
  on public.assessments for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = assessments.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Пользователь может удалять только оценки своей семьи
create policy "Users can delete own family assessments"
  on public.assessments for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = assessments.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Таблица answers
-- ============================================
-- Пользователь может видеть только ответы своей семьи
create policy "Users can view own family answers"
  on public.answers for select
  using (
    exists (
      select 1 from public.assessments
      join public.profiles on profiles.id = assessments.profile_id
      where assessments.id = answers.assessment_id
      and profiles.user_id = auth.uid()
    )
  );

-- Пользователь может создавать ответы только для своей семьи
create policy "Users can insert own family answers"
  on public.answers for insert
  with check (
    exists (
      select 1 from public.assessments
      join public.profiles on profiles.id = assessments.profile_id
      where assessments.id = answers.assessment_id
      and profiles.user_id = auth.uid()
    )
  );

-- Пользователь может обновлять только ответы своей семьи
create policy "Users can update own family answers"
  on public.answers for update
  using (
    exists (
      select 1 from public.assessments
      join public.profiles on profiles.id = assessments.profile_id
      where assessments.id = answers.assessment_id
      and profiles.user_id = auth.uid()
    )
  );

-- Пользователь может удалять только ответы своей семьи
create policy "Users can delete own family answers"
  on public.answers for delete
  using (
    exists (
      select 1 from public.assessments
      join public.profiles on profiles.id = assessments.profile_id
      where assessments.id = answers.assessment_id
      and profiles.user_id = auth.uid()
    )
  );

