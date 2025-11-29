-- ============================================
-- Миграция: Отключение CASCADE DELETE для чекапов
-- ============================================
-- При удалении профиля чекапы (assessments) и ответы (answers) 
-- остаются в базе для аналитики и истории.
-- profile_id становится NULL при удалении профиля (SET NULL).

-- Шаг 1: Делаем profile_id nullable, чтобы можно было использовать SET NULL
ALTER TABLE public.assessments 
ALTER COLUMN profile_id DROP NOT NULL;

-- Шаг 2: Находим имя constraint для внешнего ключа assessments.profile_id
-- и удаляем его
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Находим имя constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.assessments'::regclass
      AND confrelid = 'public.profiles'::regclass
      AND contype = 'f'
    LIMIT 1;
    
    -- Если constraint найден, удаляем его
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Удален constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'Constraint не найден, возможно уже удален';
    END IF;
END $$;

-- Шаг 3: Создаем новый внешний ключ с SET NULL
-- При удалении профиля profile_id становится NULL, но чекап остается в базе
ALTER TABLE public.assessments
ADD CONSTRAINT fk_assessments_profile_id 
FOREIGN KEY (profile_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL 
NOT DEFERRABLE;

-- Комментарий для документации
COMMENT ON COLUMN public.assessments.profile_id IS 
'ID профиля, для которого был пройден чекап. Может быть NULL если профиль был удален - чекап сохраняется для аналитики.';

COMMENT ON CONSTRAINT fk_assessments_profile_id ON public.assessments IS 
'Внешний ключ к profiles. При удалении профиля profile_id становится NULL, чекап остается в базе для аналитики (SET NULL).';

