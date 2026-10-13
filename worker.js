// Worker entrypoint: serves the static site from ASSETS and handles /api/* routes.
// GET /api/avatar?handle=<instagram handle> — resolves the account's current
// profile picture via oginstagram.com and redirects to the signed image URL,
// edge-cached for an hour.

const AVATAR_TTL = 3600;

async function avatarResponse(url, ctx) {
  const handle = (url.searchParams.get("handle") || "").replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    return new Response("Invalid handle", { status: 400 });
  }

  const cache = caches.default;
  const cacheKey = new Request(`https://avatar.cache/${handle}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let target;
  try {
    const res = await fetch(`https://oginstagram.com/${handle}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GoddessVault/1.0)" },
    });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/<meta property="og:image" content="([^"]+)"/);
      if (m) target = m[1].replace(/&amp;/g, "&");
    }
  } catch {
    // fall through to the 404 below
  }

  const response = target
    ? Response.redirect(target, 302)
    : new Response("Avatar not found", { status: 404 });
  response.headers.set("Cache-Control", `public, max-age=${AVATAR_TTL}`);
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/avatar") return avatarResponse(url, ctx);
    if (url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });

    return env.ASSETS.fetch(request);
  },
};
