-- ============================================
-- Supabase Migration: Create blog_posts table
-- ============================================
-- Таблица для блога Balansity: статьи, публикуемые на сайте

create table if not exists public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  subtitle text,
  category text,
  cover_image_url text,
  content_html text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  reading_time_minutes integer,
  author_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Триггер для автоматического обновления updated_at
create or replace function public.set_current_timestamp_blog_posts()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row
execute procedure public.set_current_timestamp_blog_posts();

-- Индексы для производительности
create index if not exists idx_blog_posts_slug
  on public.blog_posts(slug);

create index if not exists idx_blog_posts_status_published_at
  on public.blog_posts(status, published_at desc);

-- Включаем RLS
alter table public.blog_posts enable row level security;

-- Политика: публичное чтение только опубликованных статей
create policy blog_posts_public_read
  on public.blog_posts
  for select
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

-- Политика: полный доступ для админов (см. public.is_admin())
create policy blog_posts_admin_all
  on public.blog_posts
  for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.blog_posts is 'Статьи блога Balansity';
comment on column public.blog_posts.slug is 'Уникальный slug для URL (/blog/:slug)';
comment on column public.blog_posts.status is 'Статус статьи: draft или published';
