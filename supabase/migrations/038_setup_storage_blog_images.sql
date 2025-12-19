-- ============================================
-- Supabase Migration: Storage policies for blog-images bucket
-- ============================================

-- NOTE: перед применением миграции создай в Supabase Storage бакет
-- с именем "blog-images" (без public-флага), чтобы политики ниже
-- корректно применялись.

-- Политика: разрешаем анонимному доступу на чтение файлов из blog-images
drop policy if exists "blog-images select for public" on storage.objects;
create policy "blog-images select for public"
  on storage.objects
  for select
  using (bucket_id = 'blog-images');

-- Политика: разрешаем авторизованным пользователям загружать файлы
drop policy if exists "blog-images insert for authenticated" on storage.objects;
create policy "blog-images insert for authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'blog-images');

-- Политика: при необходимости авторизованные пользователи могут удалять
-- собственные файлы (опционально, можно удалить этот блок, если не нужно)
drop policy if exists "blog-images delete for authenticated" on storage.objects;
create policy "blog-images delete for authenticated"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'blog-images');
