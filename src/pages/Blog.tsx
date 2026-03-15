import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, MapPinned, NotebookText } from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { handleImageError } from "../utils/imageFallback";
import { getOptimizedImageUrl } from "../utils/imageOptimization";
import type { BlogPost } from "../types/blog";

const formatDate = (value?: string) => {
  if (!value) return "Draft";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Draft";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest(`${API_ENDPOINTS.blog.list}?limit=24&page=1`);
        if (!active) return;
        setPosts(Array.isArray(response?.data) ? response.data : []);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Unable to load Agrisoko insights right now.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPosts();

    return () => {
      active = false;
    };
  }, []);

  const featured = posts.find((post) => post.featured) || posts[0];
  const secondaryPosts = featured ? posts.filter((post) => post._id !== featured._id) : posts;

  return (
    <main className="ui-page-shell pb-16">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="ui-section-kicker">Agrisoko insights</p>
            <h1 className="mt-3 text-4xl text-stone-900 sm:text-5xl">
              Market intelligence and practical trade guidance
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
              Read how demand is moving, what trusted trade looks like, and where Kenyan
              agriculture can become more direct, more connected, and more profitable.
            </p>
          </div>

          <div className="ui-card-soft p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDF5F3] text-[#A0452E]">
                <MapPinned className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-stone-900">Built for Kenyan agriculture</p>
                <p className="mt-1 text-sm text-stone-600">
                  Market notes, buyer demand context, onboarding help, and founder updates from
                  inside Agrisoko.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="ui-card h-72 animate-pulse bg-white" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-8 ui-card p-8 text-center">
            <NotebookText className="mx-auto h-10 w-10 text-stone-400" />
            <h2 className="mt-4 text-2xl text-stone-900">Insights are coming soon</h2>
            <p className="mt-2 text-sm text-stone-600">
              Admin can publish the first Agrisoko article from the admin panel.
            </p>
          </div>
        ) : (
          <>
            {featured && (
              <Link
                to={`/blog/${featured.slug}`}
                className="mt-8 grid overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:grid-cols-[1.1fr_0.9fr]"
              >
                <div className="p-6 sm:p-8">
                  <p className="ui-section-kicker">Featured</p>
                  <h2 className="mt-3 text-3xl text-stone-900">{featured.title}</h2>
                  <p className="mt-4 text-base leading-relaxed text-stone-600">{featured.excerpt}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
                    <span>{formatDate(featured.publishedAt || featured.createdAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-4 w-4" />
                      {featured.readTimeMinutes} min read
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#A0452E]">
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="min-h-[240px] bg-stone-100">
                  {featured.coverImage ? (
                    <img
                      src={getOptimizedImageUrl(featured.coverImage, { width: 1200, height: 900, quality: "auto:good" })}
                      alt={featured.title}
                      onError={handleImageError}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FDF5F3] via-[#FAF7F2] to-stone-100">
                      <NotebookText className="h-12 w-12 text-[#A0452E]" />
                    </div>
                  )}
                </div>
              </Link>
            )}

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {secondaryPosts.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="ui-card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[16/10] bg-stone-100">
                    {post.coverImage ? (
                      <img
                        src={getOptimizedImageUrl(post.coverImage, { width: 900, height: 600, quality: "auto:good" })}
                        alt={post.title}
                        onError={handleImageError}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FDF5F3] via-[#FAF7F2] to-stone-100">
                        <NotebookText className="h-10 w-10 text-[#A0452E]" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {(post.tags || []).slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#FDF5F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A0452E]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-2xl text-stone-900">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-stone-500">
                      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      <span>{post.readTimeMinutes} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default Blog;
