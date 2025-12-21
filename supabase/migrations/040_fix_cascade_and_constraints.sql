-- Миграция: Исправление CASCADE DELETE и добавление CHECK constraints
-- Дата: 2025-12-21
-- Цель: Защита финансовых данных от случайного удаления

-- ============================================
-- 1. Изменение CASCADE на RESTRICT для payments
-- ============================================

-- Удаляем старый foreign key constraint
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- Создаём новый с RESTRICT (запрет удаления пользователя с платежами)
ALTER TABLE public.payments
ADD CONSTRAINT payments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE RESTRICT;

-- ============================================
-- 2. Изменение CASCADE на RESTRICT для appointments
-- ============================================

ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE RESTRICT;

-- ============================================
-- 3. Добавление CHECK constraints для сумм
-- ============================================

-- Проверка положительных сумм в payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_amount_positive'
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);
  END IF;
END $$;

-- Проверка положительных цен в appointment_types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointment_types_price_positive'
  ) THEN
    ALTER TABLE public.appointment_types
    ADD CONSTRAINT appointment_types_price_positive CHECK (price >= 0);
  END IF;
END $$;

-- ============================================
-- 4. Добавление индексов для производительности
-- ============================================

-- Composite индекс для поиска платежей пользователя
CREATE INDEX IF NOT EXISTS idx_payments_user_created
ON public.payments(user_id, created_at DESC);

-- Composite индекс для appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_status
ON public.appointments(user_id, status);

-- Индекс для поиска appointments по payment_id (для идемпотентности)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_payment_id_unique
ON public.appointments(payment_id)
WHERE payment_id IS NOT NULL;

-- ============================================
-- 5. Ограничение RLS для payments (только чтение для пользователей)
-- ============================================

-- Удаляем политику обновления платежей пользователями
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;

-- Комментарий для документации
COMMENT ON TABLE public.payments IS
'Платежи пользователей. Пользователи могут только читать свои платежи.
Обновление происходит только через webhook или admin.';
