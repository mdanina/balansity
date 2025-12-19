import { useParams, Link } from "react-router-dom";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { useBlogPost } from "@/hooks/useBlogPost";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { formatBlogDate, formatReadingTime } from "@/lib/slug";
import { Badge } from "@/components/ui/badge";
import "@/components/blog/Blog.css";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPost(slug);

  const { data: morePosts } = useBlogPosts({ limit: 4 });
  const related = (morePosts || []).filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <div className="blog-article-bg flex min-h-screen flex-col">
      <LandingHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-10 lg:py-12">
          {isLoading && (
            <p className="text-sm text-white/60">Загружаем статью…</p>
          )}

          {isError && (
            <p className="text-sm text-red-300">
              Не удалось загрузить статью. Попробуйте позже.
            </p>
          )}

          {!isLoading && !isError && !post && (
            <div className="space-y-4">
              <h1 className="font-serif text-2xl font-semibold md:text-3xl">
                Статья не найдена
              </h1>
              <p className="text-sm text-white/70">
                Возможно, ссылка устарела или материал ещё не опубликован.
              </p>
              <Link
                to="/blog"
                className="inline-flex text-sm font-medium text-[#f1c75a] hover:underline"
              >
                ← Вернуться в блог
              </Link>
            </div>
          )}

          {post && (
            <article className="blog-article-shell mx-auto max-w-4xl px-5 py-7 md:px-8 md:py-9 lg:px-10 lg:py-10">
              {/* Обложка в стиле split-макета */}
              {post.cover_image_url && (
                <div className="blog-cover-split mb-8 mx-auto overflow-hidden rounded-3xl">
                  <div className="blog-cover-image-section">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="blog-cover-image"
                    />
                  </div>
                  <div className="blog-cover-text-section">
                    {post.category && (
                      <div className="blog-cover-category">
                        {post.category}
                      </div>
                    )}
                    <h1 className="blog-cover-title">
                      {post.title}
                    </h1>
                    {post.subtitle && (
                      <p className="blog-cover-subtitle">
                        {post.subtitle}
                      </p>
                    )}
                    <div className="blog-cover-date">
                      {formatBlogDate(post.published_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Если нет обложки, показываем заголовок как раньше */}
              {!post.cover_image_url && (
                <header className="mb-7 md:mb-8">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-[var(--landing-dark-blue)]/70">
                    {post.category && (
                      <Badge
                        variant="outline"
                        className="border-[var(--landing-dark-blue)]/20 bg-[var(--landing-dark-blue)]/5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--landing-dark-blue)]"
                      >
                        {post.category}
                      </Badge>
                    )}
                    <span>{formatBlogDate(post.published_at)}</span>
                    {post.reading_time_minutes && (
                      <span>• {formatReadingTime(post.reading_time_minutes)}</span>
                    )}
                  </div>
                  <h1 className="mb-3 font-serif text-3xl font-bold text-[var(--landing-dark-blue)] md:text-4xl lg:text-5xl">
                    {post.title}
                  </h1>
                  {post.subtitle && (
                    <p className="text-lg text-[var(--landing-dark-blue)]/80 md:text-xl">
                      {post.subtitle}
                    </p>
                  )}
                  {post.author_name && (
                    <p className="mt-4 text-sm text-[var(--landing-dark-blue)]/70">Автор: {post.author_name}</p>
                  )}
                </header>
              )}

              {post.content_html && (
                <div
                  className="prose max-w-none prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-[var(--landing-dark-blue)]/90 prose-a:text-[var(--landing-gold)] prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-img:border prose-img:border-[var(--landing-dark-blue)]/10 prose-headings:font-serif prose-headings:text-[var(--landing-dark-blue)] prose-strong:text-[var(--landing-dark-blue)] prose-li:marker:text-[var(--landing-dark-blue)]/60 prose-h1:text-[var(--landing-dark-blue)] prose-h2:text-[var(--landing-dark-blue)] prose-h3:text-[var(--landing-dark-blue)] prose-h4:text-[var(--landing-dark-blue)] prose-h5:text-[var(--landing-dark-blue)] prose-h6:text-[var(--landing-dark-blue)]"
                  dangerouslySetInnerHTML={{ __html: post.content_html }}
                />
              )}

              <div className="mt-10 border-t border-[var(--landing-dark-blue)]/10 pt-4">
                <Link
                  to="/blog"
                  className="inline-flex text-sm font-medium text-[var(--landing-gold)] hover:underline"
                >
                  ← Ко всем статьям
                </Link>
              </div>
            </article>
          )}
        </div>

        {related.length > 0 && (
          <section className="border-t border-white/10 py-8 md:py-10" style={{ backgroundColor: 'var(--landing-dark-blue)' }}>
            <div className="container mx-auto px-4">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-white md:text-3xl">
                Ещё по теме
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    to={`/blog/${p.slug}`}
                    className="group block h-full rounded-2xl border border-white/5 p-4 transition-transform transition-colors hover:-translate-y-0.5 hover:border-white/25"
                    style={{ backgroundColor: 'var(--landing-dark-blue)' }}
                  >
                    {p.cover_image_url && (
                      <div className="mb-3 h-32 w-full overflow-hidden rounded-xl" style={{ backgroundColor: 'hsl(203, 60%, 12%)' }}>
                        <img
                          src={p.cover_image_url}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-white/60">
                      {p.category && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] font-semibold text-white/80">
                          {p.category}
                        </span>
                      )}
                      <span>{formatBlogDate(p.published_at)}</span>
                      {p.reading_time_minutes && (
                        <span>• {formatReadingTime(p.reading_time_minutes)}</span>
                      )}
                    </div>
                    <h3 className="mb-1 font-serif text-base font-semibold text-white/90 group-hover:text-white">
                      {p.title}
                    </h3>
                    {p.subtitle && (
                      <p className="line-clamp-2 text-xs text-white/70">
                        {p.subtitle}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
