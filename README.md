# Kanpur First — website (production files)

Hindi news website for **kanpurfirst.com**. Static site, no build step.

## Files

- `index.html` — the whole site (HTML + CSS + JS inline). Loads news at runtime.
- `news.json` — all news stories (structured data). The page fetches this file.
- `assets/` — logo, cover banner and story poster images.
- `sitemap.xml` — sitemap for search engines (homepage URL only; the site is
  a single-page app with hash routing).
- `robots.txt` — allows all crawlers and points to the sitemap.
- `functions/api/visitor-count.js` — Cloudflare Pages Function behind the
  footer visitor counter (see "Visitor counter" below).
- `functions/api/views.js` — Cloudflare Pages Function behind the real
  per-article view counts (see "View counts" below).

## Deploy (Cloudflare Pages)

The site deploys via **Cloudflare Pages** from a Git-connected repository
with these site files at the repo root. No build command, no framework —
the publish/output directory is the repo root itself. (The `functions/`
folder is picked up automatically by Cloudflare Pages Functions.)

One-time setup in the Cloudflare dashboard: create a KV namespace and bind
it to the Pages project as **`COUNTERS`** (Pages project → Settings →
Functions → KV namespace bindings). The visitor counter needs this binding;
without it the counter line simply stays hidden.

## Updating news (no redeploy needed)

News lives in `news.json`, which is hosted **separately on GitHub** so news
updates never need a site redeploy:

1. Edit `news.json` in the GitHub repo (add/edit story objects).
2. The live page fetches the GitHub raw URL on every visit (with a
   cache-buster), so new stories appear immediately.

The fetch URL is a single constant near the top of the `<script>` in
`index.html`:

```js
const NEWS_JSON_URL = "news.json";   // <-- change to the GitHub raw URL before deploy
```

Change it to e.g.
`https://raw.githubusercontent.com/<user>/<repo>/main/news.json` — a one-line
change. If the fetch ever fails, the page falls back to an embedded copy of
the news data inside `index.html`, so it never renders empty. (When the
embedded copy needs refreshing, regenerate `index.html` from the latest
`news.json`.)

### Story object format

```json
{
  "id": "unique-slug",
  "headline": "हेडलाइन",
  "category": "कानपुर | क्राइम | राजनीति | व्यापार | कानपुर देहात",
  "body": "पूरी खबर… (blank line = new paragraph)",
  "image": "assets/poster-xyz.png or https://… or null",
  "sourceUrl": "https://… or null",
  "date": "2026-11-20",
  "hero": false,
  "views": 12300
}
```

`image: null` shows a category-coloured placeholder block. Exactly one story
should have `"hero": true` (the top story on the homepage).

## Visitor counter

The footer shows a total visitor count ("👁 कुल विज़िटर: N"). It is powered
by a Cloudflare Pages Function + Workers KV, fully inside this Cloudflare
account:

- Endpoint: `/api/visitor-count`
  (`functions/api/visitor-count.js`).
- Requires a KV namespace bound to the Pages project as **`COUNTERS`**
  (see "Deploy" above).
- On each call it reads the count from KV key `visits` (JSON
  `{"count": N}`), increments it by 1, writes it back and returns
  `{"count": N}`.
- The page calls the endpoint once on load and formats the number with
  Indian digit grouping. If the call fails for any reason, the counter line
  is hidden — the page never shows a broken counter.
- The count is cumulative page loads (not unique visitors).

## View counts (per article, real)

Each story shows a real read count ("👁 1.2 हजार बार पढ़ी गई") in the hero,
the "सबसे ज़्यादा पढ़ी गई" sidebar and the article view. Counts are real —
the `views` field in `news.json` is ignored and never displayed.

- Endpoint: `/api/views` (`functions/api/views.js`), same **`COUNTERS`**
  KV namespace as the visitor counter. Each story's count lives under the
  KV key `view:<story-id>` as JSON `{"count": N}`.
- `GET /api/views` returns all counts as `{"<story-id>": <count>, ...}`.
  The homepage fetches this once on load.
- `GET /api/views?id=<story-id>` increments that story's count and returns
  `{"id": "<story-id>", "count": N}`. The page calls it when an article is
  opened. Only slug ids (`^[a-z0-9-]+$`) are accepted.
- Display rules: count ≥ 1000 → "X.Y हजार बार पढ़ी गई"; 1–999 → "N बार पढ़ी
  गई"; 0 or missing → no count shown at all. If the endpoint fails, all
  count elements stay hidden — the page never shows fake numbers.
- The sidebar sorts by real views (desc), ties by date (desc).

## Test locally

```bash
cd site
python3 -m http.server 8000
# open http://localhost:8000
```

(Note: opening `index.html` directly as a `file://` URL will use the embedded
fallback data, because browsers block `fetch()` of local files — the site
still works, it just won't pick up `news.json` edits until served over HTTP.)

## Notes

- News is added only through `news.json` on GitHub (see "Updating news"
  above). There is no on-site add-news form — visitors cannot publish
  stories from the website.
- No CDN dependency: fonts use a system Devanagari stack, with Google Fonts
  as progressive enhancement only.
