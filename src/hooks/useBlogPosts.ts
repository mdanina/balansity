import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  category_slug: string | null;
  cover_image_url: string | null;
  content_html: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  reading_time_minutes: number | null;
  author_name: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface UseBlogPostsOptions {
  category?: string; // slug категории
  limit?: number;
}

export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { category, limit } = options;

  return useQuery<BlogPost[]>({
    queryKey: ['blog-posts', { category, limit }],
    staleTime: 0, // Данные сразу считаются устаревшими, чтобы всегда обновлялись
    gcTime: 0, // Не хранить в кеше после unmount (было cacheTime)
    refetchOnMount: 'always', // Всегда обновлять при монтировании
    refetchOnWindowFocus: true, // Обновлять при фокусе окна
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (category) {
        query = query.eq('category_slug', category);
      }

      if (limit && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Логируем для отладки (можно убрать после проверки)
      console.log('[useBlogPosts] Загружено статей:', data?.length || 0, 'с фильтрами:', { category, limit });
      if (data && data.length > 0) {
        console.log('[useBlogPosts] Первая статья:', { 
          id: data[0].id, 
          title: data[0].title, 
          status: data[0].status,
          published_at: data[0].published_at 
        });
      }

      return (data || []) as BlogPost[];
    },
  });
}
