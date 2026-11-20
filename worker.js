// Kanpur First — Worker entry: serves the static site and the counter APIs.
//
// Static files come from the ASSETS binding (repo root). Two API routes use
// the COUNTERS KV namespace (seeded 20 Nov 2026: visits starts at 80,768;
// per-article views start from the numbers previously shown on the site):
//   GET /api/visitor-count   → increment + return {"count": N}
//   GET /api/views           → all counts {"<story-id>": <count>, ...}
//   GET /api/views?id=<slug> → increment that story, return {"id","count"}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/visitor-count") return visitorCount(env);
    if (url.pathname === "/api/views") return views(request, env);
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

const ID_RE = /^[a-z0-9-]+$/;

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
