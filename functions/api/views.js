// Cloudflare Pages Function — real per-article view counts.
//
// KV namespace binding: COUNTERS (same namespace as the visitor counter;
// created and bound in the Cloudflare dashboard: Pages project → Settings →
// Functions → KV namespace bindings). Each story's count lives under the
// key "view:<story-id>" as JSON {"count": N}.
//
//   GET /api/views             → all counts: {"<story-id>": <count>, ...}
//   GET /api/views?id=<slug>   → increment that story, return {"id","count"}
//
// The homepage fetches the full map once on load and shows each story's real
// count (stories with no count show nothing). Opening an article calls the
// ?id= form once to register the view. Read-modify-write races are acceptable
// for this casual counter.

const ID_RE = /^[a-z0-9-]+$/;

export async function onRequest(context) {
  const headers = {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const kv = context.env.COUNTERS;
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (id !== null) {
      if (!ID_RE.test(id)) {
        return Response.json({ error: "bad id" }, { status: 400, headers });
      }
      const key = "view:" + id;
      let count = 0;
      const existing = await kv.get(key, "json");
      if (existing && typeof existing.count === "number") {
        count = existing.count;
      }
      count += 1;
      await kv.put(key, JSON.stringify({ count }));
      return Response.json({ id, count }, { headers });
    }

    const counts = {};
    let cursor;
    do {
      const page = await kv.list({ prefix: "view:", cursor });
      for (const key of page.keys) {
        const value = await kv.get(key.name, "json");
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
