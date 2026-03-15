import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, NotebookText } from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { handleImageError } from "../utils/imageFallback";
import { getOptimizedImageUrl } from "../utils/imageOptimization";
import type { BlogPost as BlogPostType } from "../types/blog";

const formatDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPost = async () => {
      if (!slug) return;
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest(API_ENDPOINTS.blog.bySlug(slug));
        if (!active) return;
        setPost(response?.data || null);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Unable to load this article.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPost();

    return () => {
      active = false;
    };
  }, [slug]);

  const paragraphs = useMemo(
    () =>
      String(post?.content || "")
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    [post?.content]
  );

  if (!slug) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <main className="ui-page-shell pb-16">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#A0452E]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to insights
        </Link>

        {loading ? (
          <div className="mt-6 ui-card h-[28rem] animate-pulse bg-white" />
        ) : error || !post ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {error || "This article could not be found."}
          </div>
        ) : (
          <>
            <header className="mt-6">
              <div className="flex flex-wrap gap-2">
                {(post.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#FDF5F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A0452E]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 text-4xl leading-tight text-stone-900 sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-stone-600">{post.excerpt}</p>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-stone-500">
                <span>{post.authorName}</span>
                {post.authorRole ? <span>{post.authorRole}</span> : null}
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-4 w-4" />
                  {post.readTimeMinutes} min read
                </span>
              </div>
            </header>

            <div className="mt-8 overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
              {post.coverImage ? (
                <img
                  src={getOptimizedImageUrl(post.coverImage, { width: 1600, height: 1000, quality: "auto:good" })}
                  alt={post.title}
                  onError={handleImageError}
                  className="max-h-[480px] w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center bg-gradient-to-br from-[#FDF5F3] via-[#FAF7F2] to-stone-100">
                  <NotebookText className="h-12 w-12 text-[#A0452E]" />
                </div>
              )}
            </div>

            <article className="mt-8 ui-card p-6 sm:p-8">
              <div className="space-y-5 text-[1.02rem] leading-8 text-stone-700">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

            <div className="mt-8 rounded-[28px] bg-gradient-to-br from-[#A0452E] via-[#8B3525] to-[#72281A] p-6 text-white shadow-[0_20px_48px_rgba(114,40,26,0.24)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                Agrisoko
              </p>
              <h2 className="mt-3 text-2xl text-white">Trade directly, with more trust</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/82">
                Browse live listings, post demand, or list your own produce to start closing direct
                agricultural deals across Kenya.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/browse"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#A0452E] transition hover:bg-[#FFF7F4]"
                >
                  Browse listings
                </Link>
                <Link
                  to="/request"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-white/75 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View buy requests
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default BlogPost;
