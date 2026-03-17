import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, ImagePlus, PencilLine, RefreshCw, Save, Trash2, X } from "lucide-react";
import { API_ENDPOINTS, adminApiRequest } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import type { BlogPost, BlogPostStatus } from "../../types/blog";

type BlogFormState = {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  status: BlogPostStatus;
  featured: boolean;
  authorName: string;
  authorRole: string;
};

type CoverImageState = {
  file: File | null;
  preview: string | null; // object URL for new file, or existing URL
};

const defaultForm = (): BlogFormState => ({
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: "",
  status: "draft",
  featured: false,
  authorName: "Stephen",
  authorRole: "Founder, Agrisoko",
});

const INPUT_CLASS =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[#A0452E] focus:ring-2 focus:ring-[#F3C9BE]";

const textAreaClass = `${INPUT_CLASS} min-h-[150px] resize-y`;

const mapPostToForm = (post: BlogPost): BlogFormState => ({
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  coverImage: post.coverImage || "",
  tags: (post.tags || []).join(", "),
  status: post.status,
  featured: post.featured,
  authorName: post.authorName || "Stephen",
  authorRole: post.authorRole || "Founder, Agrisoko",
});

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

const BlogManagement: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(() => defaultForm());
  const [coverImg, setCoverImg] = useState<CoverImageState>({ file: null, preview: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = ["admin", "super_admin", "moderator"].includes(user?.role || "");

  const selectedPost = useMemo(
    () => posts.find((post) => post._id === selectedId) || null,
    [posts, selectedId]
  );

  const loadPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApiRequest(`${API_ENDPOINTS.blog.admin.list}?limit=50&page=1`);
      const nextPosts = Array.isArray(response?.data) ? response.data : [];
      setPosts(nextPosts);
      if (selectedId) {
        const freshSelected = nextPosts.find((post: BlogPost) => post._id === selectedId);
        if (freshSelected) {
          setForm(mapPostToForm(freshSelected));
        }
      }
    } catch (err: any) {
      setError(err?.message || "Unable to load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const resetEditor = () => {
    setSelectedId(null);
    setForm(defaultForm());
    setCoverImg({ file: null, preview: null });
    setError("");
    setSuccess("");
  };

  const selectPost = (post: BlogPost) => {
    setSelectedId(post._id);
    setForm(mapPostToForm(post));
    setCoverImg({ file: null, preview: post.coverImage || null });
    setError("");
    setSuccess("");
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCoverImg({ file, preview });
  }, []);

  const clearCoverImage = useCallback(() => {
    if (coverImg.file && coverImg.preview) URL.revokeObjectURL(coverImg.preview);
    setCoverImg({ file: null, preview: null });
    setForm((current) => ({ ...current, coverImage: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [coverImg]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let body: FormData | string;

      if (coverImg.file) {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("excerpt", form.excerpt);
        fd.append("content", form.content);
        fd.append("status", form.status);
        fd.append("tags", form.tags);
        fd.append("featured", String(form.featured));
        fd.append("authorName", form.authorName);
        fd.append("authorRole", form.authorRole);
        fd.append("coverImage", coverImg.file);
        body = fd;
      } else {
        body = JSON.stringify({ ...form, coverImage: coverImg.preview ?? form.coverImage });
      }

      if (selectedId) {
        const response = await adminApiRequest(API_ENDPOINTS.blog.admin.update(selectedId), {
          method: "PUT",
          body,
        });
        const updated = response?.data as BlogPost;
        setPosts((current) =>
          current.map((post) => (post._id === updated._id ? updated : post))
        );
        setForm(mapPostToForm(updated));
        setCoverImg({ file: null, preview: updated.coverImage || null });
        setSuccess("Blog post updated.");
      } else {
        const response = await adminApiRequest(API_ENDPOINTS.blog.admin.create, {
          method: "POST",
          body,
        });
        const created = response?.data as BlogPost;
        setPosts((current) => [created, ...current]);
        setSelectedId(created._id);
        setForm(mapPostToForm(created));
        setCoverImg({ file: null, preview: created.coverImage || null });
        setSuccess("Blog post created.");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to save blog post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const confirmed = window.confirm("Delete this blog post?");
    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await adminApiRequest(API_ENDPOINTS.blog.admin.delete(selectedId), {
        method: "DELETE",
      });
      setPosts((current) => current.filter((post) => post._id !== selectedId));
      resetEditor();
      setSuccess("Blog post deleted.");
    } catch (err: any) {
      setError(err?.message || "Unable to delete blog post.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="ui-page-shell px-4 py-12">
        <div className="ui-card mx-auto max-w-2xl p-8 text-center">
          <h1 className="text-3xl text-stone-900">Admin access only</h1>
          <p className="mt-3 text-sm text-stone-600">
            Blog management is available to verified admin roles only.
          </p>
          <Link to="/admin" className="ui-btn-primary mx-auto mt-6 w-fit px-5">
            Back to admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="ui-page-shell px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ui-section-kicker">Admin publishing</p>
            <h1 className="mt-2 text-4xl text-stone-900">Blog management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
              Publish market updates, trust notes, buyer education, and founder commentary without
              redeploying the site.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={resetEditor} className="ui-btn-secondary px-4">
              <FilePlus2 className="h-4 w-4" />
              New post
            </button>
            <button type="button" onClick={() => void loadPosts()} className="ui-btn-ghost px-4">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="ui-card overflow-hidden">
            <div className="border-b border-stone-200 px-5 py-4">
              <h2 className="text-xl font-semibold text-stone-900">Existing posts</h2>
              <p className="mt-1 text-sm text-stone-500">
                Drafts and published posts stay here for editing.
              </p>
            </div>

            <div className="max-h-[720px] overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="p-5 text-sm text-stone-500">No blog posts yet.</div>
              ) : (
                posts.map((post) => (
                  <button
                    key={post._id}
                    type="button"
                    onClick={() => selectPost(post)}
                    className={`block w-full border-b border-stone-100 px-5 py-4 text-left transition last:border-b-0 ${
                      selectedId === post._id ? "bg-[#FDF5F3]" : "hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-stone-900">{post.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-stone-600">{post.excerpt}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          post.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
                      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      <span>{post.readTimeMinutes} min read</span>
                      {post.featured ? <span>Featured</span> : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="ui-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">
                  {selectedPost ? "Edit post" : "Create post"}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Keep the title, excerpt, and first paragraph sharp. That is what converts reads.
                </p>
              </div>
              {selectedPost ? (
                <Link
                  to={`/blog/${selectedPost.slug}`}
                  className="ui-btn-ghost px-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  <PencilLine className="h-4 w-4" />
                  Preview
                </Link>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-stone-900">Title</label>
                <input
                  className={INPUT_CLASS}
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Kenya onion prices: what serious buyers are looking for"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-stone-900">Excerpt</label>
                <textarea
                  className={`${INPUT_CLASS} min-h-[96px] resize-y`}
                  value={form.excerpt}
                  onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                  placeholder="One tight summary that makes the article worth opening."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-900">Author name</label>
                <input
                  className={INPUT_CLASS}
                  value={form.authorName}
                  onChange={(event) => setForm((current) => ({ ...current, authorName: event.target.value }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-900">Author role</label>
                <input
                  className={INPUT_CLASS}
                  value={form.authorRole}
                  onChange={(event) => setForm((current) => ({ ...current, authorRole: event.target.value }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-900">Status</label>
                <select
                  className={INPUT_CLASS}
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as BlogPostStatus,
                    }))
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-900">Tags</label>
                <input
                  className={INPUT_CLASS}
                  value={form.tags}
                  onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="prices, buyers, produce"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-stone-900">
                  Cover image
                </label>
                {coverImg.preview ? (
                  <div className="relative overflow-hidden rounded-2xl border border-stone-200">
                    <img
                      src={coverImg.preview}
                      alt="Cover preview"
                      className="h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearCoverImage}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm transition hover:bg-white"
                      title="Remove image"
                    >
                      <X className="h-4 w-4 text-stone-700" />
                    </button>
                    <div className="absolute bottom-2 left-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-white"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 py-10 text-sm text-stone-500 transition hover:border-[#A0452E] hover:bg-[#FDF5F3] hover:text-[#A0452E]"
                  >
                    <ImagePlus className="h-7 w-7" />
                    <span>Click to upload cover image</span>
                    <span className="text-xs text-stone-400">PNG or JPEG, max 5 MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-3 text-sm font-semibold text-stone-900">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, featured: event.target.checked }))
                    }
                  />
                  Feature this post on the public blog section
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-stone-900">Article body</label>
                <textarea
                  className={textAreaClass}
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  placeholder="Write plain text paragraphs. Use blank lines between paragraphs."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleSave} disabled={saving} className="ui-btn-primary px-5">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : selectedPost ? "Update post" : "Create post"}
              </button>
              {selectedPost ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="ui-btn-secondary px-5 text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default BlogManagement;
