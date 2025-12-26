-- =============================================
-- Миграция: Документы клиентов
-- Таблица для хранения метаданных документов
-- =============================================

-- Создаём таблицу документов клиентов
CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    description TEXT,
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('medical', 'assessment', 'consent', 'other')),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_client_documents_client_user_id
    ON public.client_documents(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_by
    ON public.client_documents(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_category
    ON public.client_documents(category);
CREATE INDEX IF NOT EXISTS idx_client_documents_deleted_at
    ON public.client_documents(deleted_at) WHERE deleted_at IS NULL;

-- RLS политики
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Специалист может видеть документы своих клиентов
CREATE POLICY "Specialists can view their clients documents"
    ON public.client_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.client_assignments ca
            JOIN public.specialists s ON s.id = ca.specialist_id
            WHERE ca.client_user_id = client_documents.client_user_id
            AND s.user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

-- Специалист может создавать документы для своих клиентов
CREATE POLICY "Specialists can create documents for their clients"
    ON public.client_documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.client_assignments ca
            JOIN public.specialists s ON s.id = ca.specialist_id
            WHERE ca.client_user_id = client_documents.client_user_id
            AND s.user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

-- Специалист может обновлять документы своих клиентов
CREATE POLICY "Specialists can update their clients documents"
    ON public.client_documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.client_assignments ca
            JOIN public.specialists s ON s.id = ca.specialist_id
            WHERE ca.client_user_id = client_documents.client_user_id
            AND s.user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

-- Клиент может видеть свои документы
CREATE POLICY "Clients can view their own documents"
    ON public.client_documents
    FOR SELECT
    USING (client_user_id = auth.uid());

-- Администратор имеет полный доступ
CREATE POLICY "Admins have full access to documents"
    ON public.client_documents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION public.update_client_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_client_documents_updated_at ON public.client_documents;
CREATE TRIGGER trigger_update_client_documents_updated_at
    BEFORE UPDATE ON public.client_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_documents_updated_at();

-- Создаём storage bucket для документов
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS для bucket documents
CREATE POLICY "Specialists can upload documents for their clients"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM public.client_assignments ca
            JOIN public.specialists s ON s.id = ca.specialist_id
            WHERE s.user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

CREATE POLICY "Specialists can read their clients documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM public.client_assignments ca
            JOIN public.specialists s ON s.id = ca.specialist_id
            WHERE s.user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

CREATE POLICY "Specialists can delete their clients documents"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM public.client_assignments ca
            JOIN public.specialists s ON s.id = ca.specialist_id
            WHERE s.user_id = auth.uid()
            AND ca.status = 'active'
        )
    );

CREATE POLICY "Admins have full access to documents storage"
    ON storage.objects
    FOR ALL
    USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );
