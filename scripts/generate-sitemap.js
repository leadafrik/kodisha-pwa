const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BASE_URL = process.env.SITEMAP_BASE_URL || "https://www.agrisoko254.com";
const API_BASE =
  process.env.SITEMAP_API_URL ||
  process.env.REACT_APP_API_URL ||
  "https://kodisha-backend-vjr9.onrender.com/api";
const OUTPUT_FILE = path.join(__dirname, "..", "public", "sitemap.xml");
const TODAY = new Date().toISOString().split("T")[0];

const HIDDEN_STATUSES = new Set([
  "draft",
  "rejected",
  "deleted",
  "removed",
  "archived",
  "inactive",
  "delisted",
  "pending_verification",
  "pending_payment",
]);

const STATIC_URLS = [
  { loc: `${BASE_URL}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${BASE_URL}/browse`, changefreq: "hourly", priority: "0.9" },
  { loc: `${BASE_URL}/about`, changefreq: "weekly", priority: "0.8" },
  { loc: `${BASE_URL}/request`, changefreq: "hourly", priority: "0.85" },
  { loc: `${BASE_URL}/legal/terms`, changefreq: "monthly", priority: "0.3" },
  { loc: `${BASE_URL}/legal/privacy`, changefreq: "monthly", priority: "0.3" },
];

const DYNAMIC_ENDPOINTS = [
  { name: "land", path: "/listings" },
  { name: "products", path: "/products" },
  { name: "equipment", path: "/services/equipment" },
  { name: "professional", path: "/services/professional" },
  { name: "agrovets", path: "/agrovets" },
];

const getListingId = (item) =>
  item?._id || item?.id || item?.listingId || item?.listing?._id || item?.listing?.id;

const getLastModifiedDate = (item) => {
  const candidate = item?.updatedAt || item?.createdAt;
  if (!candidate) return TODAY;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? TODAY : parsed.toISOString().split("T")[0];
};

const isVisibleListing = (item) => {
  const status = String(item?.publishStatus || item?.status || "").toLowerCase();
  if (status && HIDDEN_STATUSES.has(status)) return false;
  if (item?.isDeleted === true) return false;
  if (item?.deletedAt) return false;
  if (item?.active === false || item?.isActive === false) return false;
  if (typeof item?.isPublished === "boolean" && !item.isPublished) return false;
  return true;
};

const fetchEndpointData = async (endpoint) => {
  try {
    const response = await axios.get(`${API_BASE}${endpoint.path}`, {
      timeout: 15000,
    });
    const payload = response.data || {};
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.listings)) return payload.listings;
    return [];
  } catch (error) {
    const message =
      error && error.message ? error.message : "Unknown fetch error";
    console.warn(`[sitemap] Skipping ${endpoint.name}: ${message}`);
    return [];
  }
};

const buildXml = (urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const dedupeByLoc = (urls) => {
  const map = new Map();
  urls.forEach((url) => {
    if (!url?.loc) return;
    map.set(url.loc, url);
  });
  return Array.from(map.values());
};

const generate = async () => {
  const staticUrls = STATIC_URLS.map((url) => ({
    ...url,
    lastmod: TODAY,
  }));

  const endpointResults = await Promise.all(
    DYNAMIC_ENDPOINTS.map(async (endpoint) => ({
      endpoint: endpoint.name,
      records: await fetchEndpointData(endpoint),
    }))
  );

  const dynamicUrls = [];
  endpointResults.forEach(({ endpoint, records }) => {
    records.forEach((item) => {
      if (!isVisibleListing(item)) return;
      const listingId = getListingId(item);
      if (!listingId) return;

      dynamicUrls.push({
        loc: `${BASE_URL}/listings/${encodeURIComponent(String(listingId))}`,
        lastmod: getLastModifiedDate(item),
        changefreq: "weekly",
        priority: "0.7",
      });
    });
    console.log(`[sitemap] ${endpoint}: ${records.length} records scanned`);
  });

  const urls = dedupeByLoc([...staticUrls, ...dynamicUrls]);
  const xml = buildXml(urls);
  fs.writeFileSync(OUTPUT_FILE, xml, "utf8");
  console.log(
    `[sitemap] Wrote ${urls.length} URLs to ${path.relative(process.cwd(), OUTPUT_FILE)}`
  );
};

generate().catch((error) => {
  const message = error && error.message ? error.message : "Unknown error";
  console.error(`[sitemap] Failed to generate sitemap: ${message}`);
  process.exitCode = 0;
});
