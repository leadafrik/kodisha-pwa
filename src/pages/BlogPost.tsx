import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, NotebookText, Share2, Link2, Check } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://www.agrisoko254.com/share/blog/${slug}`;


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

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Share</span>
                {/* Native share / copy link */}
                <button
                  type="button"
                  onClick={async () => {
                    if (navigator.share) {
                      try { await navigator.share({ title: post.title, text: post.excerpt || "", url: shareUrl }); return; } catch {}
                    }
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Share"}
                </button>
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  <svg className="h-3.5 w-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.057 23.786a.5.5 0 0 0 .614.641l6.094-1.597A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.87 9.87 0 0 1-5.031-1.374l-.361-.214-3.741.98.998-3.648-.235-.374A9.86 9.86 0 0 1 2.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z" />
                  </svg>
                  WhatsApp
                </a>
                {/* Copy link */}
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Copy link
                </button>
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
