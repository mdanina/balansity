-- ============================================
-- Supabase Migration: Add is_featured to blog_posts
-- ============================================
-- Добавляем поле для выбора статьи в hero-секцию

-- Добавляем колонку is_featured
alter table public.blog_posts
add column if not exists is_featured boolean not null default false;

-- Создаем индекс для быстрого поиска featured статей
create index if not exists idx_blog_posts_is_featured
  on public.blog_posts(is_featured)
  where is_featured = true;

-- Комментарий к колонке
comment on column public.blog_posts.is_featured is 'Показывать статью в hero-секции как главный материал';
