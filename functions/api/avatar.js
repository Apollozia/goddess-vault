// GET /api/avatar?handle=<instagram handle>
// Resolves the account's current profile picture via oginstagram.com
// (an Open Graph proxy) and redirects to the signed image URL.
// Results are edge-cached so each handle is resolved at most once per hour.
export async function onRequestGet({ request }) {
  const handle = (new URL(request.url).searchParams.get("handle") || "")
    .replace(/^@/, "")
    .trim();

  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    return new Response("Invalid handle", { status: 400 });
  }

  const cache = caches.default;
  const cacheKey = new Request(`https://avatar.cache/${handle}`, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let target;
  try {
    const res = await fetch(`https://oginstagram.com/${handle}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GoddessVault/1.0)" },
    });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(
        /<meta property="og:image" content="([^"]+)"/
      );
      if (m) target = m[1].replace(/&amp;/g, "&");
    }
  } catch {
    // fall through to the fallback below
  }

  const response = target
    ? Response.redirect(target, 302)
    : new Response("Avatar not found", { status: 404 });

  response.headers.set("Cache-Control", "public, max-age=3600");
  await cache.put(cacheKey, response.clone());
  return response;
}
