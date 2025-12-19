-- ============================================
-- Supabase Migration: Create blog_categories and link to blog_posts
-- ============================================

create table if not exists public.blog_categories (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  label text not null,
  emoji text,
  sort_order integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger to keep updated_at
create or replace function public.set_current_timestamp_blog_categories()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_blog_categories_updated_at
before update on public.blog_categories
for each row
execute procedure public.set_current_timestamp_blog_categories();

-- Useful index for sorting active categories
create index if not exists idx_blog_categories_active_sort
  on public.blog_categories(is_active, sort_order, created_at);

-- Link from blog_posts to categories via slug (denormalised text label already exists)
alter table public.blog_posts
  add column if not exists category_slug text;

create index if not exists idx_blog_posts_category_slug
  on public.blog_posts(category_slug);

comment on table public.blog_categories is 'Справочник категорий/тегов блога для фильтров и CMS.';
comment on column public.blog_posts.category_slug is 'Slug категории из blog_categories';
