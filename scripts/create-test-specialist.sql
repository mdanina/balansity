-- ============================================
-- СОЗДАНИЕ ТЕСТОВОГО СПЕЦИАЛИСТА
-- Email: mdanina@yandex.ru
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_specialist_id UUID;
BEGIN
  -- Находим пользователя по email
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = 'mdanina@yandex.ru';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь с email mdanina@yandex.ru не найден. Сначала создайте пользователя через Supabase Auth.';
  END IF;

  -- Проверяем, не является ли уже специалистом
  IF EXISTS (SELECT 1 FROM public.specialists WHERE user_id = v_user_id) THEN
    RAISE NOTICE 'Пользователь уже является специалистом. Обновляем данные...';

    UPDATE public.specialists
    SET
      display_name = 'Мария Данина',
      bio = 'Тестовый специалист для проверки функционала платформы.',
      specialization_codes = ARRAY['psychologist', 'family_therapist'],
      is_available = true,
      accepts_new_clients = true
    WHERE user_id = v_user_id
    RETURNING id INTO v_specialist_id;
  ELSE
    -- Устанавливаем роль specialist
    UPDATE public.users
    SET role = 'specialist'
    WHERE id = v_user_id;

    -- Создаём профиль специалиста
    INSERT INTO public.specialists (
      user_id,
      display_name,
      bio,
      experience_years,
      specialization_codes,
      is_available,
      accepts_new_clients,
      max_clients,
      working_hours
    )
    VALUES (
      v_user_id,
      'Мария Данина',
      'Тестовый специалист для проверки функционала платформы.',
      5,
      ARRAY['psychologist', 'family_therapist'],
      true,
      true,
      50,
      '{
        "mon": {"start": "09:00", "end": "18:00"},
        "tue": {"start": "09:00", "end": "18:00"},
        "wed": {"start": "09:00", "end": "18:00"},
        "thu": {"start": "09:00", "end": "18:00"},
        "fri": {"start": "09:00", "end": "17:00"}
      }'::jsonb
    )
    RETURNING id INTO v_specialist_id;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Специалист успешно создан/обновлён!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Specialist ID: %', v_specialist_id;
  RAISE NOTICE 'Email: mdanina@yandex.ru';
  RAISE NOTICE 'Имя: Мария Данина';
  RAISE NOTICE 'Специализации: психолог, семейный терапевт';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Вход: /specialist/login';
  RAISE NOTICE '========================================';
END $$;

-- Проверка результата
SELECT
  u.email,
  u.role,
  s.display_name,
  s.specialization_codes,
  s.is_available,
  s.created_at
FROM public.specialists s
JOIN public.users u ON u.id = s.user_id
WHERE u.email = 'mdanina@yandex.ru';
