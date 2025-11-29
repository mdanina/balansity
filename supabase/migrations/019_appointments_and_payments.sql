-- ============================================
-- Supabase Migration: Appointments and Payments
-- ============================================
-- Создание таблиц для функционала консультаций и оплаты сессий
-- 
-- ВАЖНО: 
-- - assessments.payment_id используется для оплаты ОТЧЕТОВ чекапов
-- - payments.id используется для оплаты КОНСУЛЬТАЦИЙ и ПАКЕТОВ
-- Это разные типы платежей, не путать!

-- ============================================
-- 1. Таблица appointment_types (Типы консультаций)
-- ============================================
create table if not exists public.appointment_types (
  id uuid default gen_random_uuid() primary key,
  name text not null, -- "Первичная встреча", "Сессия для ребенка", "Сессия для родителя"
  duration_minutes int not null, -- 30, 45, 60 минут
  price decimal(10, 2) not null, -- Цена в рублях
  description text, -- Описание типа консультации
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для appointment_types
create index if not exists idx_appointment_types_is_active on public.appointment_types(is_active);

-- ============================================
-- 2. Таблица payments (Платежи) - СОЗДАЕМ ПЕРВОЙ, т.к. на неё ссылаются другие таблицы
-- ============================================
-- ВАЖНО: Эта таблица используется ТОЛЬКО для консультаций и пакетов
-- Для оплаты отчетов чекапов используется assessments.payment_id (строка с ID платежа)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount decimal(10, 2) not null, -- Сумма платежа
  currency text default 'RUB', -- Валюта
  status text check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')) default 'pending',
  payment_method text, -- 'yookassa', 'stripe', 'bank_transfer', etc.
  external_payment_id text, -- ID платежа во внешней системе (ЮKassa, Stripe)
  metadata jsonb, -- Дополнительные данные платежа
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для payments
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_external_payment_id on public.payments(external_payment_id);

-- ============================================
-- 3. Таблица appointments (Записи на консультации)
-- ============================================
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete set null, -- Для кого консультация (может быть NULL для родителя)
  appointment_type_id uuid references public.appointment_types(id) on delete restrict not null,
  scheduled_at timestamptz not null, -- Дата и время консультации
  status text check (status in ('scheduled', 'completed', 'cancelled', 'no_show')) default 'scheduled',
  payment_id uuid references public.payments(id) on delete set null, -- Связь с платежом
  notes text, -- Заметки
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для appointments
create index if not exists idx_appointments_user_id on public.appointments(user_id);
create index if not exists idx_appointments_profile_id on public.appointments(profile_id);
create index if not exists idx_appointments_type_id on public.appointments(appointment_type_id);
create index if not exists idx_appointments_scheduled_at on public.appointments(scheduled_at);
create index if not exists idx_appointments_status on public.appointments(status);
create index if not exists idx_appointments_payment_id on public.appointments(payment_id);

-- ============================================
-- 4. Таблица packages (Пакеты сессий)
-- ============================================
create table if not exists public.packages (
  id uuid default gen_random_uuid() primary key,
  name text not null, -- "4 Session Treatment (Child Therapy)"
  session_count int not null, -- 4, 8, 12 сессий
  appointment_type_id uuid references public.appointment_types(id) on delete restrict not null, -- Тип консультаций в пакете
  price decimal(10, 2) not null, -- Цена пакета
  description text, -- Описание пакета
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для packages
create index if not exists idx_packages_appointment_type_id on public.packages(appointment_type_id);
create index if not exists idx_packages_is_active on public.packages(is_active);

-- ============================================
-- 5. Таблица package_purchases (Покупки пакетов)
-- ============================================
create table if not exists public.package_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  package_id uuid references public.packages(id) on delete restrict not null,
  sessions_remaining int not null, -- Оставшиеся сессии
  payment_id uuid references public.payments(id) on delete set null, -- Связь с платежом
  purchased_at timestamptz default now(),
  expires_at timestamptz, -- Дата истечения пакета (если есть срок действия)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для package_purchases
create index if not exists idx_package_purchases_user_id on public.package_purchases(user_id);
create index if not exists idx_package_purchases_package_id on public.package_purchases(package_id);
create index if not exists idx_package_purchases_payment_id on public.package_purchases(payment_id);
create index if not exists idx_package_purchases_sessions_remaining on public.package_purchases(sessions_remaining);

-- ============================================
-- 6. Триггеры для updated_at
-- ============================================
create trigger update_appointment_types_updated_at before update on public.appointment_types
  for each row execute function update_updated_at_column();

create trigger update_appointments_updated_at before update on public.appointments
  for each row execute function update_updated_at_column();

create trigger update_packages_updated_at before update on public.packages
  for each row execute function update_updated_at_column();

create trigger update_package_purchases_updated_at before update on public.package_purchases
  for each row execute function update_updated_at_column();

create trigger update_payments_updated_at before update on public.payments
  for each row execute function update_updated_at_column();

-- ============================================
-- 7. Включаем RLS для всех новых таблиц
-- ============================================
alter table public.appointment_types enable row level security;
alter table public.appointments enable row level security;
alter table public.packages enable row level security;
alter table public.package_purchases enable row level security;
alter table public.payments enable row level security;

-- ============================================
-- 8. RLS политики для appointment_types
-- ============================================
-- Все пользователи могут видеть активные типы консультаций
create policy "Anyone can view active appointment types"
  on public.appointment_types for select
  using (is_active = true);

-- ============================================
-- 9. RLS политики для appointments
-- ============================================
-- Пользователь может видеть только свои записи
create policy "Users can view own appointments"
  on public.appointments for select
  using (auth.uid() = user_id);

-- Пользователь может создавать записи только для себя
create policy "Users can insert own appointments"
  on public.appointments for insert
  with check (auth.uid() = user_id);

-- Пользователь может обновлять только свои записи
create policy "Users can update own appointments"
  on public.appointments for update
  using (auth.uid() = user_id);

-- Пользователь может удалять только свои записи
create policy "Users can delete own appointments"
  on public.appointments for delete
  using (auth.uid() = user_id);

-- ============================================
-- 9. RLS политики для payments
-- ============================================
-- Пользователь может видеть только свои платежи
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Пользователь может создавать платежи только для себя
create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- Пользователь может обновлять только свои платежи
-- (обычно обновляется через webhook, но для безопасности оставляем)
create policy "Users can update own payments"
  on public.payments for update
  using (auth.uid() = user_id);

-- ============================================
-- 10. RLS политики для packages
-- ============================================
-- Все пользователи могут видеть активные пакеты
create policy "Anyone can view active packages"
  on public.packages for select
  using (is_active = true);

-- ============================================
-- 11. RLS политики для package_purchases
-- ============================================
-- Пользователь может видеть только свои покупки
create policy "Users can view own package purchases"
  on public.package_purchases for select
  using (auth.uid() = user_id);

-- Пользователь может создавать покупки только для себя
create policy "Users can insert own package purchases"
  on public.package_purchases for insert
  with check (auth.uid() = user_id);

-- Пользователь может обновлять только свои покупки
create policy "Users can update own package purchases"
  on public.package_purchases for update
  using (auth.uid() = user_id);

-- ============================================
-- 13. Заполнение начальными данными (опционально)
-- ============================================
-- Можно добавить начальные типы консультаций и пакеты
-- Пока оставляем пустым - данные будут добавляться через админку или вручную

