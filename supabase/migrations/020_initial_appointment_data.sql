-- ============================================
-- Начальные данные для консультаций и пакетов
-- ============================================
-- Этот скрипт добавляет типы консультаций и пакеты в базу данных

-- ============================================
-- 1. Добавляем типы консультаций
-- ============================================

-- Бесплатная консультация с координатором (30 минут)
INSERT INTO public.appointment_types (name, duration_minutes, price, description, is_active)
VALUES 
  ('Первичная встреча', 30, 0.00, 'Бесплатная первичная консультация с персональным координатором', true)
ON CONFLICT DO NOTHING;

-- Детская терапия (45 минут)
INSERT INTO public.appointment_types (name, duration_minutes, price, description, is_active)
VALUES 
  ('Сессия для ребенка', 45, 5000.00, 'Сессия детской терапии со специалистом', true)
ON CONFLICT DO NOTHING;

-- Специалист для родителей (45 минут)
INSERT INTO public.appointment_types (name, duration_minutes, price, description, is_active)
VALUES 
  ('Сессия для родителя', 45, 5000.00, 'Сессия со специалистом для родителей', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. Добавляем пакеты для детской терапии
-- ============================================
-- Сначала получаем ID типа консультации "Сессия для ребенка"
DO $$
DECLARE
  child_therapy_id uuid;
BEGIN
  SELECT id INTO child_therapy_id 
  FROM public.appointment_types 
  WHERE name = 'Сессия для ребенка' 
  LIMIT 1;

  IF child_therapy_id IS NOT NULL THEN
    INSERT INTO public.packages (name, session_count, appointment_type_id, price, description, is_active)
    VALUES 
      ('4 сессии для ребенка', 4, child_therapy_id, 18000.00, 'Пакет из 4 сессий детской терапии', true),
      ('8 сессий для ребенка', 8, child_therapy_id, 35000.00, 'Пакет из 8 сессий детской терапии', true),
      ('12 сессий для ребенка', 12, child_therapy_id, 50000.00, 'Пакет из 12 сессий детской терапии', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 3. Добавляем пакеты для специалиста родителей
-- ============================================
DO $$
DECLARE
  parent_specialist_id uuid;
BEGIN
  SELECT id INTO parent_specialist_id 
  FROM public.appointment_types 
  WHERE name = 'Сессия для родителя' 
  LIMIT 1;

  IF parent_specialist_id IS NOT NULL THEN
    INSERT INTO public.packages (name, session_count, appointment_type_id, price, description, is_active)
    VALUES 
      ('4 сессии для родителя', 4, parent_specialist_id, 18000.00, 'Пакет из 4 сессий со специалистом для родителей', true),
      ('8 сессий для родителя', 8, parent_specialist_id, 35000.00, 'Пакет из 8 сессий со специалистом для родителей', true),
      ('12 сессий для родителя', 12, parent_specialist_id, 50000.00, 'Пакет из 12 сессий со специалистом для родителей', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

