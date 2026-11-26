// Kanpur First — Worker entry: static site + counter APIs + SEO article pages.
//
// Routes:
//   GET /api/visitor-count   → increment + return {"count": N}
//   GET /api/views           → all counts {"<story-id>": <count>, ...}
//   GET /api/views?id=<slug> → increment that story, return {"id","count"}
//   GET /news/<slug>         → server-rendered article page (own URL, meta,
//                              OG tags, NewsArticle JSON-LD) built live from
//                              news.json — every story gets its own Google-
//                              indexable page automatically (21 Nov 2026)
//   GET /sitemap.xml         → dynamic sitemap: homepage + every /news/<slug>
//   GET /news-sitemap.xml    → Google News sitemap (stories from last 2 days,
//                              news:news tags) — for Google News / Discover
//   GET /about               → server-rendered About page (E-E-A-T signal for
//                              Google News Publisher Center)
//   everything else          → ASSETS (static site)
//
// COUNTERS KV seeded 20 Nov 2026: visits starts at 80,768; per-article
// views start from the numbers previously shown on the site.

const NEWS_JSON_URL =
  "https://raw.githubusercontent.com/iamcaravi/kanpurfirst-news/main/news.json";
const ARCHIVE_JSON_URL =
  "https://raw.githubusercontent.com/iamcaravi/kanpurfirst-news/main/archive.json";
const SITE = "https://kanpurfirst.com";
const SITE_CSS = "\n:root{\n  --red:#d32f2f; --red-dark:#b71c1c; --black:#141414; --ink:#1c1c1c;\n  --grey:#5f6368; --line:#e3e3e3; --bg:#f6f6f6; --card:#ffffff;\n  --c-kanpur:#d32f2f; --c-crime:#37474f; --c-politics:#1565c0;\n  --c-business:#2e7d32; --c-dehat:#e65100;\n}\n*{box-sizing:border-box;margin:0;padding:0}\nhtml{scroll-behavior:smooth}\nbody{\n  font-family:\"Noto Sans Devanagari\",\"Mangal\",\"Kokila\",\"Devanagari MT\",sans-serif;\n  background:var(--bg); color:var(--ink); line-height:1.55;\n  overflow-x:hidden;\n}\nimg{max-width:100%;display:block}\na{color:inherit;text-decoration:none}\nbutton{font-family:inherit;cursor:pointer}\n.container{max-width:1200px;margin:0 auto;padding:0 16px;width:100%}\n\n/* ---------- Top bar ---------- */\n.topbar{background:var(--black);color:#fff;font-size:13px}\n.topbar .container{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-top:7px;padding-bottom:7px;flex-wrap:wrap}\n.topbar .tagline{color:#ffb3b3;font-weight:600}\n\n/* ---------- Header ---------- */\n.site-header{background:#fff;border-bottom:3px solid var(--red)}\n.site-header .container{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:12px;padding-bottom:12px;flex-wrap:wrap}\n.logo-wrap{display:flex;align-items:center;gap:14px;min-width:0}\n.logo-wrap img{height:64px;width:auto;max-width:60vw;object-fit:contain}\n.header-tagline{font-size:15px;color:var(--grey);font-weight:600;line-height:1.35}\n.header-tagline b{color:var(--red-dark)}\n\n/* ---------- Nav ---------- */\n.main-nav{background:var(--black);position:sticky;top:0;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.25)}\n.main-nav .container{display:flex;align-items:center;gap:6px;padding-top:0;padding-bottom:0}\n.nav-links{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;flex:1;min-width:0}\n.nav-links::-webkit-scrollbar{display:none}\n.nav-links a{color:#fff;font-weight:700;font-size:15px;padding:12px 13px;white-space:nowrap;border-bottom:3px solid transparent}\n.nav-links a:hover,.nav-links a.active{background:var(--red);border-bottom-color:#fff}\n.nav-tools{display:flex;align-items:center;gap:8px;padding:6px 0;flex-shrink:0}\n.search-box{display:flex;align-items:center;background:#fff;border-radius:20px;overflow:hidden}\n.search-box input{border:0;outline:0;padding:7px 12px;font-size:14px;width:150px;font-family:inherit}\n.search-box button{border:0;background:var(--red);color:#fff;padding:7px 13px;font-size:14px;font-weight:700}\n\n/* ---------- Ticker ---------- */\n.ticker{background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:stretch;overflow:hidden}\n.ticker-label{background:var(--red);color:#fff;font-weight:800;padding:8px 14px;white-space:nowrap;display:flex;align-items:center;font-size:14px}\n.ticker-viewport{overflow:hidden;flex:1;display:flex;align-items:center}\n.ticker-track{display:inline-flex;gap:48px;white-space:nowrap;padding-left:24px;animation:tick 60s linear infinite;will-change:transform}\n.ticker-track:hover{animation-play-state:paused}\n.ticker-track a{font-size:14px;font-weight:600;color:var(--ink)}\n.ticker-track a:hover{color:var(--red-dark)}\n.ticker-track a::before{content:\"\u25cf \";color:var(--red);font-size:10px;vertical-align:2px}\n@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}\n\n/* ---------- Hero ---------- */\n.hero{position:relative;border-radius:12px;overflow:hidden;margin:18px 0;cursor:pointer;background:#000;box-shadow:0 4px 18px rgba(0,0,0,.18)}\n.hero-media{position:relative;height:440px;overflow:hidden;background:#000}\n.hero-media .hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(22px) brightness(.5);transform:scale(1.2)}\n.hero-media .hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}\n.hero .ph{height:440px}\n.hero-overlay{position:absolute;inset:auto 0 0 0;background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.55) 55%,rgba(0,0,0,0) 100%);color:#fff;padding:70px 22px 20px}\n.hero-overlay h1{font-size:30px;line-height:1.3;font-weight:800;max-width:900px}\n.hero-meta{margin-top:8px;font-size:13px;color:#ffd7d7;display:flex;gap:12px;flex-wrap:wrap;align-items:center}\n\n/* ---------- Layout ---------- */\n.layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:26px;align-items:start;padding-bottom:10px}\n.section-title{font-size:21px;font-weight:800;border-left:5px solid var(--red);padding-left:10px;margin:22px 0 14px;display:flex;justify-content:space-between;align-items:center;gap:10px}\n.section-title .more{font-size:13px;color:var(--red-dark);font-weight:700;white-space:nowrap}\n.section-title .more:hover{text-decoration:underline}\n\n/* ---------- Cards ---------- */\n.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:16px}\n.card{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;display:flex;flex-direction:column}\n.card:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,.12)}\n.card-img{width:100%;aspect-ratio:4/5;object-fit:cover}\n.ph{width:100%;aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:22px;text-align:center;padding:10px;position:relative;overflow:hidden}\n.ph::after{content:\"Kanpur First\";position:absolute;bottom:8px;right:12px;font-size:11px;font-weight:700;opacity:.75;letter-spacing:.5px}\n.ph-kanpur{background:linear-gradient(135deg,#d32f2f,#8e1414)}\n.ph-crime{background:linear-gradient(135deg,#455a64,#102027)}\n.ph-politics{background:linear-gradient(135deg,#1976d2,#0d3c78)}\n.ph-business{background:linear-gradient(135deg,#43a047,#1b4d1e)}\n.ph-dehat{background:linear-gradient(135deg,#fb8c00,#9c3d00)}\n.card-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:7px;flex:1}\n.card h3{font-size:16.5px;line-height:1.4;font-weight:700}\n.card .excerpt{font-size:13.5px;color:var(--grey);display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}\n.read-more-link{color:var(--red-dark);font-weight:800;font-size:13px}\n.card-meta{margin-top:auto;font-size:12px;color:var(--grey);display:flex;gap:10px;flex-wrap:wrap}\n.badge{display:inline-block;color:#fff;font-size:11.5px;font-weight:800;padding:2px 9px;border-radius:20px;letter-spacing:.3px}\n.badge-kanpur{background:var(--c-kanpur)} .badge-crime{background:var(--c-crime)}\n.badge-politics{background:var(--c-politics)} .badge-business{background:var(--c-business)}\n.badge-dehat{background:var(--c-dehat)}\n\n/* ---------- Sidebar ---------- */\n.sidebar{position:sticky;top:64px;display:flex;flex-direction:column;gap:18px}\n.side-box{background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden}\n.side-box h2{font-size:17px;font-weight:800;background:var(--black);color:#fff;padding:10px 14px;border-bottom:3px solid var(--red)}\n.mostread{list-style:none}\n.mostread li{display:flex;gap:12px;padding:11px 14px;border-bottom:1px solid var(--line);cursor:pointer;align-items:flex-start}\n.mostread li:last-child{border-bottom:0}\n.mostread li:hover{background:#fdf2f2}\n.mostread .num{font-size:24px;font-weight:800;color:var(--red);line-height:1;min-width:26px}\n.mostread .t{font-size:14px;font-weight:700;line-height:1.4}\n.mostread .v{font-size:11.5px;color:var(--grey);margin-top:2px}\n.cover-banner img{width:100%;height:auto}\n\n/* ---------- Article ---------- */\n.article-wrap{max-width:820px;margin:22px auto 30px;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}\n.a-media{position:relative;height:560px;background:#000;overflow:hidden}\n.a-media .a-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(22px) brightness(.5);transform:scale(1.2)}\n.a-media .a-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}\n.article-wrap .ph{height:560px;aspect-ratio:auto;font-size:30px}\n.article-inner{padding:22px 26px 28px}\n.article-inner h1{font-size:28px;line-height:1.35;font-weight:800;margin:10px 0 8px}\n.article-meta{font-size:13px;color:var(--grey);display:flex;gap:14px;flex-wrap:wrap;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--line)}\n.article-body p{font-size:17px;line-height:1.85;margin-bottom:14px}\n.article-lead{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}\n.read-more{margin-top:6px}\n.read-more summary{display:inline-block;background:var(--red);color:#fff;font-weight:800;padding:10px 20px;border-radius:24px;cursor:pointer;list-style:none}\n.read-more summary::-webkit-details-marker{display:none}\n.read-more summary:hover{background:var(--red-dark)}\n.read-more .article-full{margin-top:14px}\n.play-link{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;padding-left:5px;border:2px solid rgba(255,255,255,.85);z-index:3}\n.source-btn{display:inline-block;background:var(--red);color:#fff;font-weight:800;padding:10px 20px;border-radius:24px;margin-top:6px}\n.source-btn:hover{background:var(--red-dark)}\n.video-wrap{position:relative}\n.video-wrap .play-badge{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}\n.video-wrap .play-badge span{width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;padding-left:5px;border:2px solid rgba(255,255,255,.85)}\n.video-tag{position:absolute;top:10px;right:10px;background:var(--red);color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:14px;letter-spacing:.4px;z-index:2}\n.follow-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}\n.follow-btn{display:inline-block;color:#fff;font-weight:800;font-size:14.5px;padding:10px 18px;border-radius:24px}\n.follow-btn.ig{background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)}\n.follow-btn.fb{background:#1877f2}\n.follow-btn:hover{opacity:.9}\n.soc-ico{width:18px;height:18px;flex:none}\nfooter li a{display:inline-flex;align-items:center;gap:8px}\n.contact-list li{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.follow-btn{display:inline-flex;align-items:center;gap:8px}\n.follow-icons{display:flex;gap:10px;padding:14px;flex-wrap:wrap}\n.follow-icons a{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border:1px solid var(--line);border-radius:50%}\n.follow-icons a:hover{border-color:var(--red)}\n.follow-icons .soc-ico{width:20px;height:20px}\n.a-video-box{display:block;position:relative}\n.back-btn{display:inline-block;margin:18px 0 0;background:var(--black);color:#fff;border:0;border-radius:24px;padding:9px 18px;font-weight:700;font-size:14px}\n.back-btn:hover{background:var(--red-dark)}\n.related{margin-top:26px}\n.related h2{font-size:19px;font-weight:800;border-left:5px solid var(--red);padding-left:10px;margin-bottom:12px}\n\n/* ---------- Footer ---------- */\nfooter{background:var(--black);color:#ddd;margin-top:34px}\nfooter .container{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:26px;padding-top:30px;padding-bottom:10px}\nfooter img{height:52px;width:auto;max-width:220px;object-fit:contain;background:#fff;border-radius:6px;padding:4px}\nfooter h3{color:#fff;font-size:16px;margin-bottom:10px;border-bottom:2px solid var(--red);padding-bottom:6px}\nfooter ul{list-style:none}\nfooter li{margin-bottom:7px;font-size:14px}\nfooter a:hover{color:#ff8a80}\nfooter .tag{font-size:13.5px;color:#aaa;margin-top:10px;line-height:1.6}\n.copyright{border-top:1px solid #333;text-align:center;font-size:12.5px;color:#999;padding:12px 16px 16px}\n.visitor-counter{text-align:center;font-size:12.5px;color:#999;padding:0 16px 16px;margin-top:-8px}\n\n.empty-note{background:#fff;border:1px dashed #bbb;border-radius:10px;padding:26px;text-align:center;color:var(--grey);font-size:15px}\n.loading{text-align:center;padding:40px 0;color:var(--grey);font-weight:700}\n\n/* ---------- Contact ---------- */\n.contact-box{background:#fff;border:1px solid #e3e3e3;border-radius:12px;padding:26px;max-width:640px}\n.contact-box p{font-size:15.5px;line-height:1.7;color:#333;margin-bottom:16px}\n.contact-list{list-style:none}\n.contact-list li{margin-bottom:12px;font-size:16px}\n.contact-list a{font-weight:700;color:var(--red)}\n.contact-list a:hover{text-decoration:underline}\n\n/* ---------- Responsive ---------- */\n@media (max-width:960px){\n  .layout{grid-template-columns:1fr}\n  .sidebar{position:static}\n  footer .container{grid-template-columns:1fr 1fr}\n}\n@media (max-width:640px){\n  .logo-wrap img{height:48px}\n  .header-tagline{display:none}\n  .search-box input{width:104px}\n  .hero-media{height:280px}\n  .hero .ph{height:280px}\n  .a-media{height:440px}\n  .article-wrap .ph{height:440px}\n  .hero-overlay{padding:44px 14px 14px}\n  .hero-overlay h1{font-size:20px}\n  .article-inner{padding:16px}\n  .article-inner h1{font-size:22px}\n  .article-body p{font-size:16px}\n  footer .container{grid-template-columns:1fr}\n  .topbar .tagline{display:none}\n}\n";

const CAT_SLUG = {
  "कानपुर": "kanpur",
  "क्राइम": "crime",
  "राजनीति": "politics",
  "व्यापार": "business",
  "कानपुर देहात": "dehat",
};
const HINDI_MONTHS = [
  "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];
const HINDI_DAYS = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

const ID_RE = /^[a-z0-9-]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/visitor-count") return visitorCount(env);
    if (url.pathname === "/api/views") return views(request, env);
    if (url.pathname === "/sitemap.xml") return sitemap();
    if (url.pathname === "/news-sitemap.xml") return newsSitemap();
    if (url.pathname === "/about" || url.pathname === "/about/") return aboutPage();
    if (url.pathname === "/privacy" || url.pathname === "/privacy/") return privacyPage();
    const m = /^\/news\/([a-z0-9-]+)\/?$/.exec(url.pathname);
    if (m) return articlePage(m[1], env);
    return env.ASSETS.fetch(request);
  },
};

const headers = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
};

async function visitorCount(env) {
  try {
    let count = 0;
    const existing = await env.COUNTERS.get("visits", "json");
    if (existing && typeof existing.count === "number") {
      count = existing.count;
    }
    count += 1;
    await env.COUNTERS.put("visits", JSON.stringify({ count }));
    return Response.json({ count }, { headers });
  } catch (err) {
    return Response.json(
      { error: "counter unavailable" },
      { status: 500, headers }
    );
  }
}

async function views(request, env) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id !== null) {
      if (!ID_RE.test(id)) {
        return Response.json({ error: "bad id" }, { status: 400, headers });
      }
      const key = "view:" + id;
      let count = 0;
      const existing = await env.COUNTERS.get(key, "json");
      if (existing && typeof existing.count === "number") {
        count = existing.count;
      }
      count += 1;
      await env.COUNTERS.put(key, JSON.stringify({ count }));
      return Response.json({ id, count }, { headers });
    }

    const counts = {};
    let cursor;
    do {
      const page = await env.COUNTERS.list({ prefix: "view:", cursor });
      for (const key of page.keys) {
        const value = await env.COUNTERS.get(key.name, "json");
        if (value && typeof value.count === "number") {
          counts[key.name.slice("view:".length)] = value.count;
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    return Response.json(counts, { headers });
  } catch (err) {
    return Response.json(
      { error: "views unavailable" },
      { status: 500, headers }
    );
  }
}

/* ---------- SEO article pages + sitemap ---------- */

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugOf(cat) {
  return CAT_SLUG[cat] || "kanpur";
}

function absImg(img) {
  if (!img) return null;
  return img.startsWith("http") ? img : SITE + "/" + img.replace(/^\//, "");
}

function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  return parseInt(m[3], 10) + " " + HINDI_MONTHS[parseInt(m[2], 10) - 1] + " " + m[1];
}

function excerpt(body, n) {
  const t = String(body || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function fmtIN(n) {
  n = String(Math.floor(Number(n) || 0));
  if (n.length <= 3) return n;
  const last3 = n.slice(-3);
  let rest = n.slice(0, -3);
  const parts = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return parts.join(",") + "," + last3;
}

function badgeHTML(cat) {
  return '<span class="badge badge-' + slugOf(cat) + '">' + esc(cat) + "</span>";
}

function viewsBadgeText(s, siteViews) {
  if (Number(s.views) > 0) return "👁 " + fmtIN(s.views) + " बार देखी गई";
  return "👁 " + fmtIN(Number(siteViews) || 0) + " बार पढ़ी गई";
}

async function fetchViewCounts(env) {
  const counts = {};
  try {
    let cursor;
    do {
      const page = await env.COUNTERS.list({ prefix: "view:", cursor });
      for (const key of page.keys) {
        const value = await env.COUNTERS.get(key.name, "json");
        if (value && typeof value.count === "number") {
          counts[key.name.slice("view:".length)] = value.count;
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  } catch (e) {
    /* view counts are best-effort; badges fall back to 0 views */
  }
  return counts;
}

function todayIST() {
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return (
    HINDI_DAYS[now.getUTCDay()] +
    ", " +
    now.getUTCDate() +
    " " +
    HINDI_MONTHS[now.getUTCMonth()] +
    " " +
    now.getUTCFullYear()
  );
}

async function fetchStories() {
  const res = await fetch(NEWS_JSON_URL, {
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (!res.ok) throw new Error("news fetch " + res.status);
  const data = await res.json();
  return Array.isArray(data.stories) ? data.stories : [];
}

// Archived stories (>25 days old, off the homepage) keep their /news/<slug>
// page live so indexed URLs never 404 (GSC "Blocked due to other 4xx").
async function fetchArchiveStories() {
  try {
    const res = await fetch(ARCHIVE_JSON_URL, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.stories) ? data.stories : [];
  } catch (e) {
    return [];
  }
}

const ICO_FB =
  '<svg class="soc-ico" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
const ICO_FB_WHITE =
  '<svg class="soc-ico" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
const ICO_IG =
  '<svg class="soc-ico" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.4" fill="#E1306C" stroke="none"/></svg>';
const ICO_IG_WHITE =
  '<svg class="soc-ico" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.4" fill="#fff" stroke="none"/></svg>';
const ICO_YT =
  '<svg class="soc-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="5" width="21" height="14" rx="4" fill="#FF0000"/><path d="M10 9.3v5.4L14.8 12z" fill="#fff"/></svg>';
const ICO_X =
  '<svg class="soc-ico" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>';
const ICO_WA =
  '<svg class="soc-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#25D366"/><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#fff" transform="translate(3.36 3.36) scale(0.72)"/></svg>';
const ICO_MAIL =
  '<svg class="soc-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/></svg>';
const ICO_CHAT =
  '<svg class="soc-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg>';

function headerHTML(stories) {
  const tickerItems = stories
    .slice(0, 12)
    .map(
      (s) =>
        '<a href="/news/' + esc(s.id) + '">' + esc(s.headline) + "</a>"
    )
    .join("");
  return (
    '<div class="topbar"><div class="container">' +
    '<span class="tagline">कानपुर की हर खबर, सबसे पहले!</span>' +
    "<span>" + esc(todayIST()) + "</span>" +
    "</div></div>" +
    '<header class="site-header"><div class="container">' +
    '<a class="logo-wrap" href="/"><img src="/assets/logo.png" alt="Kanpur First">' +
    '<span class="header-tagline">शहर की आवाज़ से लेकर शहर की पहचान तक — <b>सब एक जगह</b></span></a>' +
    "</div></header>" +
    '<nav class="main-nav"><div class="container">' +
    '<div class="nav-links" id="nav-links">' +
    '<a href="/" data-nav="home">होम</a>' +
    '<a href="/#/cat/kanpur" data-nav="kanpur">कानपुर</a>' +
    '<a href="/#/cat/crime" data-nav="crime">क्राइम</a>' +
    '<a href="/#/cat/politics" data-nav="politics">राजनीति</a>' +
    '<a href="/#/cat/business" data-nav="business">व्यापार</a>' +
    '<a href="/#/cat/dehat" data-nav="dehat">कानपुर देहात</a>' +
    '<a href="/#/contact" data-nav="contact">संपर्क करें</a>' +
    "</div></div></nav>" +
    '<div class="ticker"><div class="ticker-label">ताज़ा खबर</div>' +
    '<div class="ticker-viewport"><div class="ticker-track">' +
    tickerItems + tickerItems +
    "</div></div></div>"
  );
}

function footerHTML() {
  const year = new Date(Date.now() + 5.5 * 60 * 60 * 1000).getUTCFullYear();
  return (
    "<footer><div class=\"container\">" +
    '<div><img src="/assets/logo.png" alt="Kanpur First">' +
    '<p class="tag">शहर की आवाज़ से लेकर शहर की पहचान तक — सब एक जगह।<br>Kanpur First | आपका कानपुर, आपकी आवाज़</p></div>' +
    "<div><h3>कैटेगरी</h3><ul>" +
    '<li><a href="/#/cat/kanpur">कानपुर</a></li>' +
    '<li><a href="/#/cat/crime">क्राइम</a></li>' +
    '<li><a href="/#/cat/politics">राजनीति</a></li>' +
    '<li><a href="/#/cat/business">व्यापार</a></li>' +
    '<li><a href="/#/cat/dehat">कानपुर देहात</a></li>' +
    "</ul></div>" +
    "<div><h3>हमसे जुड़ें</h3><ul>" +
    '<li><a href="https://www.facebook.com/profile.php?id=61594383896937" target="_blank" rel="noopener">' + ICO_FB + "Facebook</a></li>" +
    '<li><a href="https://www.instagram.com/kanpurfirst.in/" target="_blank" rel="noopener">' + ICO_IG + "Instagram @kanpurfirst.in</a></li>" +
    '<li><a href="https://www.youtube.com/@KanpurFirst" target="_blank" rel="noopener">' + ICO_YT + "YouTube @KanpurFirst</a></li>" +
    '<li><a href="https://x.com/KanpurFirst" target="_blank" rel="noopener">' + ICO_X + "X @KanpurFirst</a></li>" +
    '<li><a href="https://whatsapp.com/channel/0029Vb8kJmBLdQeVgxNR2U3U" target="_blank" rel="noopener">' + ICO_WA + "WhatsApp चैनल</a></li>" +
    '<li><a href="mailto:kanpurfirstt@gmail.com">' + ICO_MAIL + "kanpurfirstt@gmail.com</a></li>" +
    '<li><a href="/#/contact">' + ICO_CHAT + "संपर्क करें</a></li>" +
    "</ul></div></div>" +
    '<div class="copyright">© ' + year + " Kanpur First™ — Our City | Our People | Our Stories · " +
    '<a href="/privacy" style="color:#999">गोपनीयता नीति</a></div>' +
    "</footer>"
  );
}

function mediaHTML(s) {
  const img = absImg(s.image);
  if (!img) {
    return '<div class="ph ph-' + slugOf(s.category) + '"><span>' + esc(s.category) + "</span></div>";
  }
  const inner =
    '<div class="a-media">' +
    '<img class="a-bg" src="' + esc(img) + '" alt="" aria-hidden="true">' +
    '<img class="a-img" src="' + esc(img) + '" alt="' + esc(s.headline) + '">' +
    "</div>";
  if (s.video && s.sourceUrl) {
    return (
      '<div class="a-video-box video-wrap">' +
      inner +
      '<span class="video-tag">▶ VIDEO</span><a class="play-link" href="' + esc(s.sourceUrl) + '" target="_blank" rel="noopener" aria-label="Instagram पर वीडियो देखें">▶</a></div>'
    );
  }
  return inner;
}

function cardHTML(s, viewCounts) {
  const img = absImg(s.image);
  const media = img
    ? '<img class="card-img" src="' + esc(img) + '" alt="' + esc(s.headline) + '" loading="lazy">'
    : '<div class="ph ph-' + slugOf(s.category) + ' card-img"><span>' + esc(s.category) + "</span></div>";
  const badge = viewsBadgeText(s, viewCounts ? viewCounts[s.id] : 0);
  return (
    '<article class="card" onclick="location.href=\'/news/' + esc(s.id) + '\'">' +
    (s.video
      ? '<div class="video-wrap">' + media + '<span class="video-tag">▶ VIDEO</span>' +
        (s.sourceUrl
          ? '<a class="play-link" href="' + esc(s.sourceUrl) + '" target="_blank" rel="noopener" aria-label="Instagram पर वीडियो देखें" onclick="event.stopPropagation()">▶</a>'
          : '<span class="play-badge"><span>▶</span></span>') +
        "</div>"
      : media) +
    '<div class="card-body">' + badgeHTML(s.category) +
    "<h3>" + esc(s.headline) + "</h3>" +
    '<p class="excerpt">' + esc(excerpt(s.body, 130)) + "</p>" +
    '<span class="read-more-link">आगे पढ़ें →</span>' +
    '<div class="card-meta"><span>📅 ' + esc(formatDate(s.date)) + "</span>" +
    '<span class="view-count">' + esc(badge) + "</span>" +
    "</div></div></article>"
  );
}

async function articlePage(slug, env) {
  let stories;
  try {
    stories = await fetchStories();
  } catch (e) {
    return new Response("खबरें लोड नहीं हो पाईं। कृपया थोड़ी देर बाद फिर कोशिश करें।", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  let s = stories.find((x) => x.id === slug);
  if (!s) {
    const archived = await fetchArchiveStories();
    s = archived.find((x) => x.id === slug);
  }
  if (!s) {
    const html404 =
      '<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      "<title>खबर नहीं मिली | Kanpur First</title>" +
      '<meta name="robots" content="noindex">' +
      '<link rel="icon" href="/assets/logo.png">' +
      "<style>" + SITE_CSS + "</style></head><body>" +
      headerHTML(stories) +
      '<div class="container"><div class="empty-note">यह खबर नहीं मिली।</div>' +
      '<a class="back-btn" href="/">← होम पर वापस</a></div>' +
      footerHTML() +
      "</body></html>";
    return new Response(html404, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const pageUrl = SITE + "/news/" + s.id;
  const img = absImg(s.image) || SITE + "/assets/cover.jpg";
  const desc = excerpt(s.body, 160) || s.headline;
  const paras = String(s.body || "")
    .split(/\n\s*\n/)
    .map((p) => "<p>" + esc(p.trim()) + "</p>")
    .join("");
  const flatBody = String(s.body || "").replace(/\s+/g, " ").trim();
  const articleBody = flatBody.length > 140
    ? '<p class="article-lead">' + esc(excerpt(s.body, 140)) + "</p>" +
      '<details class="read-more"><summary>आगे पढ़ें →</summary><div class="article-full">' + paras + "</div></details>"
    : paras;
  const related = stories
    .filter((x) => x.category === s.category && x.id !== s.id)
    .slice(0, 3);
  const viewCounts = await fetchViewCounts(env);
  const badge = viewsBadgeText(s, viewCounts[s.id]);

  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(s.date || "")
    ? s.date + "T00:00:00+05:30"
    : s.date;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: s.headline,
    description: desc,
    image: [img],
    datePublished: isoDate,
    dateModified: isoDate,
    articleSection: s.category,
    inLanguage: "hi",
    author: { "@type": "Organization", name: "Kanpur First", url: SITE + "/" },
    publisher: {
      "@type": "Organization",
      name: "Kanpur First",
      logo: { "@type": "ImageObject", url: SITE + "/assets/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
  const jsonLdStr = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "होम", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: s.category, item: SITE + "/" },
      { "@type": "ListItem", position: 3, name: s.headline, item: pageUrl },
    ],
  };
  const breadcrumbStr = JSON.stringify(breadcrumb).replace(/</g, "\\u003c");

  const html =
    '<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>" + esc(s.headline) + " | Kanpur First</title>" +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<meta name="robots" content="max-image-preview:large">' +
    '<link rel="canonical" href="' + esc(pageUrl) + '">' +
    '<meta property="og:title" content="' + esc(s.headline) + '">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:type" content="article">' +
    '<meta property="og:url" content="' + esc(pageUrl) + '">' +
    '<meta property="og:image" content="' + esc(img) + '">' +
    '<meta property="og:site_name" content="Kanpur First">' +
    '<meta property="article:published_time" content="' + esc(isoDate) + '">' +
    '<meta property="article:section" content="' + esc(s.category) + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + esc(s.headline) + '">' +
    '<meta name="twitter:description" content="' + esc(desc) + '">' +
    '<meta name="twitter:image" content="' + esc(img) + '">' +
    '<link rel="icon" href="/assets/logo.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap" rel="stylesheet">' +
    '<script type="application/ld+json">' + jsonLdStr + "</script>" +
    '<script type="application/ld+json">' + breadcrumbStr + "</script>" +
    "<style>" + SITE_CSS + "</style></head><body>" +
    headerHTML(stories) +
    '<div class="container"><article class="article-wrap">' +
    mediaHTML(s) +
    '<div class="article-inner">' + badgeHTML(s.category) +
    "<h1>" + esc(s.headline) + "</h1>" +
    '<div class="article-meta"><span>📅 ' + esc(formatDate(s.date)) + "</span>" +
    (badge ? '<span class="view-count">' + esc(badge) + "</span>" : "") +
    "<span>Kanpur First</span></div>" +
    '<div class="article-body">' + articleBody + "</div>" +
    '<div class="follow-row">' +
    '<a class="follow-btn ig" href="https://www.instagram.com/kanpurfirst.in/" target="_blank" rel="noopener">' + ICO_IG_WHITE + "Instagram पर Follow करें</a>" +
    '<a class="follow-btn fb" href="https://www.facebook.com/profile.php?id=61594383896937" target="_blank" rel="noopener">' + ICO_FB_WHITE + "Facebook पर Follow करें</a>" +
    "</div>" +
    '<div><a class="back-btn" href="/">← होम पर वापस</a></div>' +
    (related.length
      ? '<div class="related"><h2>संबंधित खबरें</h2><div class="grid">' +
        related.map((x) => cardHTML(x, viewCounts)).join("") +
        "</div></div>"
      : "") +
    "</div></article></div>" +
    footerHTML() +
    "<script>fetch('/api/views?id=" + esc(s.id) + "').catch(function(){});</script>" +
    "</body></html>";

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

async function sitemap() {
  let stories = [];
  try {
    stories = await fetchStories();
  } catch (e) {
    stories = [];
  }
  const latest = stories.reduce(
    (acc, s) => (s.date && s.date > acc ? s.date : acc),
    "2026-11-20"
  );
  let xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "  <url><loc>" + SITE + "/</loc><lastmod>" + esc(latest) +
    "</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>\n";
  for (const s of stories) {
    if (!ID_RE.test(s.id || "")) continue;
    xml +=
      "  <url><loc>" + SITE + "/news/" + esc(s.id) + "</loc><lastmod>" +
      esc(s.date || latest) +
      "</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n";
  }
  xml +=
    "  <url><loc>" + SITE + "/about</loc><lastmod>" + esc(latest) +
    "</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n";
  xml +=
    "  <url><loc>" + SITE + "/privacy</loc><lastmod>" + esc(latest) +
    "</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>\n";
  xml += "</urlset>\n";
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}

/* Google News sitemap — only stories published in the last 2 days, with
   news:news tags (publication name, language, publication date, title).
   This is what Google News / Top Stories / Discover read for freshness. */
async function newsSitemap() {
  let stories = [];
  try {
    stories = await fetchStories();
  } catch (e) {
    stories = [];
  }
  const now = Date.now();
  const cutoff = now - 2 * 24 * 60 * 60 * 1000;
  let xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';
  for (const s of stories) {
    if (!ID_RE.test(s.id || "")) continue;
    const t = Date.parse((s.date || "") + "T00:00:00+05:30");
    if (isNaN(t) || t < cutoff) continue;
    xml +=
      "  <url>\n    <loc>" + SITE + "/news/" + esc(s.id) + "</loc>\n" +
      "    <news:news>\n" +
      "      <news:publication>\n" +
      "        <news:name>Kanpur First</news:name>\n" +
      "        <news:language>hi</news:language>\n" +
      "      </news:publication>\n" +
      "      <news:publication_date>" + esc(s.date) + "</news:publication_date>\n" +
      "      <news:title>" + esc(s.headline) + "</news:title>\n" +
      "    </news:news>\n  </url>\n";
  }
  xml += "</urlset>\n";
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

/* About page — who we are + contact. Google News Publisher Center and
   Discover quality checks look for clear publisher identity on the site. */
async function aboutPage() {
  let stories = [];
  try {
    stories = await fetchStories();
  } catch (e) {
    stories = [];
  }
  const desc =
    "Kanpur First — कानपुर की हर खबर, सबसे पहले! कानपुर और कानपुर देहात की ताज़ा स्थानीय खबरें: क्राइम, राजनीति, व्यापार, हादसे और शहर की हर बड़ी घटना।";
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: "Kanpur First",
    url: SITE + "/",
    logo: { "@type": "ImageObject", url: SITE + "/assets/logo.png" },
    email: "kanpurfirstt@gmail.com",
    sameAs: [
      "https://www.facebook.com/profile.php?id=61594383896937",
      "https://www.instagram.com/kanpurfirst.in/",
      "https://x.com/KanpurFirst",
      "https://www.youtube.com/@KanpurFirst",
    ],
  };
  const orgLdStr = JSON.stringify(orgLd).replace(/</g, "\\u003c");
  const html =
    '<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>हमारे बारे में | Kanpur First</title>" +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<meta name="robots" content="max-image-preview:large">' +
    '<link rel="canonical" href="' + SITE + '/about">' +
    '<meta property="og:title" content="हमारे बारे में | Kanpur First">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:url" content="' + SITE + '/about">' +
    '<meta property="og:image" content="' + SITE + '/assets/cover.jpg">' +
    '<link rel="icon" href="/assets/logo.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap" rel="stylesheet">' +
    '<script type="application/ld+json">' + orgLdStr + "</script>" +
    "<style>" + SITE_CSS + "</style></head><body>" +
    headerHTML(stories) +
    '<div class="container"><article class="article-wrap"><div class="article-inner">' +
    "<h1>हमारे बारे में</h1>" +
    '<div class="article-body">' +
    "<p><b>Kanpur First</b> कानपुर की अपनी स्थानीय न्यूज़ सेवा है — \"कानपुर की हर खबर, सबसे पहले!\" हम कानपुर और कानपुर देहात की ताज़ा खबरें रोज़ अपने पाठकों तक पहुँचाते हैं: क्राइम, राजनीति, व्यापार, हादसे, शहर के विकास कार्य और हर वह घटना जो कानपुर के लोगों के लिए मायने रखती है।</p>" +
    "<p>हमारी खबरें हर दिन अपडेट होती हैं। हर खबर के साथ उसकी पूरी जानकारी और मूल पोस्ट का लिंक दिया जाता है, ताकि पाठक चाहें तो आगे भी पढ़ सकें।</p>" +
    "<h2>संपर्क करें</h2>" +
    '<ul class="contact-list">' +
    '<li>✉️ ईमेल: <a href="mailto:kanpurfirstt@gmail.com">kanpurfirstt@gmail.com</a></li>' +
    '<li>📷 Instagram: <a href="https://www.instagram.com/kanpurfirst.in/" target="_blank" rel="noopener">@kanpurfirst.in</a></li>' +
    '<li>📘 Facebook: <a href="https://www.facebook.com/profile.php?id=61594383896937" target="_blank" rel="noopener">Kanpur First</a></li>' +
    '<li>𝕏 X: <a href="https://x.com/KanpurFirst" target="_blank" rel="noopener">@KanpurFirst</a></li>' +
    '<li>▶️ YouTube: <a href="https://www.youtube.com/@KanpurFirst" target="_blank" rel="noopener">@KanpurFirst</a></li>' +
    "</ul>" +
    "<p>कोई खबर, सुझाव या शिकायत हो तो हमें ईमेल करें — हम हर संदेश पढ़ते हैं।</p>" +
    "</div>" +
    '<div><a class="back-btn" href="/">← होम पर वापस</a></div>' +
    "</div></article></div>" +
    footerHTML() +
    "</body></html>";
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}

/* Privacy Policy — required for Google AdSense approval (added 24 Nov 2026).
   Server-rendered at /privacy, same chrome as /about. */
async function privacyPage() {
  let stories = [];
  try {
    stories = await fetchStories();
  } catch (e) {
    stories = [];
  }
  const desc =
    "Kanpur First की गोपनीयता नीति — हम आपकी कौन सी जानकारी लेते हैं, कुकीज़ का इस्तेमाल कैसे होता है, और विज्ञापन (Google AdSense) के बारे में।";
  const html =
    '<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>गोपनीयता नीति | Kanpur First</title>" +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<meta name="robots" content="max-image-preview:large">' +
    '<link rel="canonical" href="' + SITE + '/privacy">' +
    '<meta property="og:title" content="गोपनीयता नीति | Kanpur First">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:url" content="' + SITE + '/privacy">' +
    '<meta property="og:image" content="' + SITE + '/assets/cover.jpg">' +
    '<link rel="icon" href="/assets/logo.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap" rel="stylesheet">' +
    "<style>" + SITE_CSS + "</style></head><body>" +
    headerHTML(stories) +
    '<div class="container"><article class="article-wrap"><div class="article-inner">' +
    "<h1>गोपनीयता नीति</h1>" +
    '<div class="article-meta"><span>अंतिम अपडेट: 24 नवंबर 2026</span></div>' +
    '<div class="article-body">' +
    "<p><b>Kanpur First</b> (kanpurfirst.com) कानपुर की स्थानीय न्यूज़ वेबसाइट है। आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। यह नीति बताती है कि हम कौन सी जानकारी लेते हैं, उसका इस्तेमाल कैसे करते हैं, और विज्ञापन के बारे में क्या जानना ज़रूरी है।</p>" +
    "<h2>1. हम कौन सी जानकारी लेते हैं</h2>" +
    "<p>हम आपसे नाम, ईमेल पता या फोन नंबर नहीं मांगते। साइट पर कोई लॉगिन, रजिस्ट्रेशन या कमेंट सिस्टम नहीं है। विज़िटर काउंटर सिर्फ कुल विज़िटर की संख्या गिनता है — इससे किसी व्यक्ति की पहचान नहीं की जाती। खबरों पर दिखने वाले व्यू काउंट भी सिर्फ कुल संख्या होते हैं, किसी पाठक की निजी जानकारी नहीं।</p>" +
    "<h2>2. कुकीज़ और विज्ञापन</h2>" +
    "<p>इस समय साइट पर कोई विज्ञापन कुकी नहीं लगाई जाती। भविष्य में इस साइट पर Google AdSense जैसे विज्ञापन दिखाए जा सकते हैं। Google सहित तीसरे पक्ष के विज्ञापनदाता आपकी रुचि के अनुसार विज्ञापन दिखाने के लिए कुकीज़ का इस्तेमाल कर सकते हैं। आप Google विज्ञापन सेटिंग्स (https://adssettings.google.com) पर जाकर वैयक्तिकृत विज्ञापन बंद कर सकते हैं, या www.aboutads.info/choices पर जाकर तीसरे पक्ष की कुकीज़ से बाहर निकल सकते हैं।</p>" +
    "<h2>3. तीसरे पक्ष की वेबसाइटों के लिंक</h2>" +
    "<p>हमारी साइट पर Instagram, Facebook, YouTube, X और WhatsApp के लिंक दिए जाते हैं। उन वेबसाइटों पर उनकी अपनी गोपनीयता नीति लागू होती है — हम उनके लिए ज़िम्मेदार नहीं हैं।</p>" +
    "<h2>4. बच्चों की जानकारी</h2>" +
    "<p>हम जानबूझकर 13 साल से कम उम्र के बच्चों की कोई निजी जानकारी नहीं लेते। अगर आपको लगे कि ऐसी कोई जानकारी हम तक पहुँची है, तो हमें ईमेल करें — हम उसे हटा देंगे।</p>" +
    "<h2>5. नीति में बदलाव</h2>" +
    "<p>यह गोपनीयता नीति समय-समय पर अपडेट हो सकती है। कोई भी बदलाव इसी पेज पर प्रकाशित किया जाएगा।</p>" +
    "<h2>6. संपर्क करें</h2>" +
    '<p>गोपनीयता से जुड़ा कोई सवाल हो तो हमें ईमेल करें: <a href="mailto:kanpurfirstt@gmail.com">kanpurfirstt@gmail.com</a></p>' +
    "</div>" +
    '<div><a class="back-btn" href="/">← होम पर वापस</a></div>' +
    "</div></article></div>" +
    footerHTML() +
    "</body></html>";
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
