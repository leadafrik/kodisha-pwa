const FALLBACK_IMAGE = "https://www.agrisoko254.com/logo512.png";
const SITE_URL = "https://www.agrisoko254.com";
const API_BASE_URL =
  process.env.SHARE_API_BASE_URL ||
  process.env.API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "https://kodisha-backend-vjr9.onrender.com/api";

const ensureArrayValue = (value) => (Array.isArray(value) ? value[0] : value);

const safeText = (value, fallback, maxLength = 180) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fetchBlogMeta = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/blog/${slug}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const post = payload?.data || payload;
    if (!post) return null;

    const image =
      post.coverImage ||
      (Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : null) ||
      FALLBACK_IMAGE;

    return {
      slug,
      title: safeText(post.title, "Agrisoko Insights", 90),
      description: safeText(post.excerpt || post.description, "Read this article on Agrisoko."),
      image,
    };
  } catch {
    return null;
  }
};

module.exports = async (req, res) => {
  const slug = ensureArrayValue(req.query.slug) || "";
  const canonicalUrl = `${SITE_URL}/blog/${encodeURIComponent(slug)}`;

  let meta = {
    slug,
    title: safeText(ensureArrayValue(req.query.title), "Agrisoko Insights", 90),
    description: safeText(ensureArrayValue(req.query.description), "Read this article on Agrisoko."),
    image: ensureArrayValue(req.query.image) || FALLBACK_IMAGE,
  };

  if (!meta.title || meta.title === "Agrisoko Insights" || meta.image === FALLBACK_IMAGE) {
    const fetched = slug ? await fetchBlogMeta(slug) : null;
    if (fetched) meta = fetched;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(meta.title)} | Agrisoko Insights</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Agrisoko" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${escapeHtml(meta.image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(meta.image)}" />
    <meta property="og:locale" content="en_KE" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(meta.image)}" />
    <meta http-equiv="refresh" content="0; url=${canonicalUrl}" />
    <script>
      window.location.replace(${JSON.stringify(canonicalUrl)});
    </script>
  </head>
  <body>
    <p>Opening article on Agrisoko... <a href="${canonicalUrl}">Continue</a></p>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
};
