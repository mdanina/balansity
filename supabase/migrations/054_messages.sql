-- =============================================
-- Миграция: Система сообщений
-- Чат между специалистами и клиентами
-- =============================================

-- Создаём таблицу сообщений
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Участники беседы
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Контент
    content TEXT NOT NULL,

    -- Статус
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Soft delete
    deleted_by_sender BOOLEAN NOT NULL DEFAULT false,
    deleted_by_recipient BOOLEAN NOT NULL DEFAULT false,

    -- Метаданные
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ограничения
    CONSTRAINT messages_different_users CHECK (sender_id != recipient_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_messages_sender_id
    ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id
    ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at
    ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON public.messages(
        LEAST(sender_id, recipient_id),
        GREATEST(sender_id, recipient_id),
        created_at DESC
    );
CREATE INDEX IF NOT EXISTS idx_messages_unread
    ON public.messages(recipient_id, is_read)
    WHERE is_read = false;

-- RLS политики
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Пользователь видит сообщения где он отправитель или получатель
CREATE POLICY "Users can view their own messages"
    ON public.messages
    FOR SELECT
    USING (
        (sender_id = auth.uid() AND NOT deleted_by_sender)
        OR
        (recipient_id = auth.uid() AND NOT deleted_by_recipient)
    );

-- Пользователь может отправлять сообщения
CREATE POLICY "Users can send messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        -- Проверяем, что получатель связан с отправителем через client_assignments
        AND (
            -- Специалист отправляет клиенту
            EXISTS (
                SELECT 1 FROM public.client_assignments ca
                JOIN public.specialists s ON s.id = ca.specialist_id
                WHERE s.user_id = auth.uid()
                AND ca.client_user_id = recipient_id
                AND ca.status = 'active'
            )
            OR
            -- Клиент отправляет специалисту
            EXISTS (
                SELECT 1 FROM public.client_assignments ca
                JOIN public.specialists s ON s.id = ca.specialist_id
                WHERE ca.client_user_id = auth.uid()
                AND s.user_id = recipient_id
                AND ca.status = 'active'
            )
        )
    );

-- Пользователь может обновлять (пометить прочитанным, удалить) свои сообщения
CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    )
    WITH CHECK (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Администратор имеет полный доступ
CREATE POLICY "Admins have full access to messages"
    ON public.messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Функция для получения непрочитанных сообщений
CREATE OR REPLACE FUNCTION public.get_unread_messages_count(p_user_id UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.messages
        WHERE recipient_id = p_user_id
        AND is_read = false
        AND NOT deleted_by_recipient
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения последнего сообщения в беседе
CREATE OR REPLACE FUNCTION public.get_last_message(p_user1_id UUID, p_user2_id UUID)
RETURNS TABLE (
    id UUID,
    content TEXT,
    sender_id UUID,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.sender_id,
        m.created_at,
        m.is_read
    FROM public.messages m
    WHERE (
        (m.sender_id = p_user1_id AND m.recipient_id = p_user2_id AND NOT m.deleted_by_sender)
        OR
        (m.sender_id = p_user2_id AND m.recipient_id = p_user1_id AND NOT m.deleted_by_recipient)
    )
    ORDER BY m.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION public.update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON public.messages;
CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_messages_updated_at();

-- Гранты
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_messages_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_last_message TO authenticated;

-- Включаем Realtime для сообщений
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Комментарии
COMMENT ON TABLE public.messages IS 'Сообщения между специалистами и клиентами';
COMMENT ON COLUMN public.messages.content IS 'Текст сообщения';
COMMENT ON COLUMN public.messages.is_read IS 'Прочитано ли сообщение получателем';
