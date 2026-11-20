// Cloudflare Pages Function — footer visitor counter.
//
// KV namespace binding: COUNTERS (created and bound in the Cloudflare
// dashboard: Pages project → Settings → Functions → KV namespace bindings).
// Stores the running total under the key "visits" as JSON {"count": N}.
//
// The homepage calls GET /api/visitor-count once on load; each call
// increments the count by 1 and returns {"count": N}. If anything fails
// (including a missing KV binding) it returns HTTP 500 and the page hides
// the counter line.

export async function onRequest(context) {
  const headers = {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const kv = context.env.COUNTERS;

    let count = 0;
    const existing = await kv.get("visits", "json");
    if (existing && typeof existing.count === "number") {
      count = existing.count;
    }

    count += 1;
    await kv.put("visits", JSON.stringify({ count }));

    return Response.json({ count }, { headers });
  } catch (err) {
    return Response.json(
      { error: "counter unavailable" },
      { status: 500, headers }
    );
  }
}
