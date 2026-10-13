// Worker entrypoint: serves the static site from ASSETS and handles /api/* routes.
// GET /api/avatar?handle=<instagram handle> — resolves the account's current
// profile picture via oginstagram.com and streams the image back, cached at
// the edge for a day.

const AVATAR_TTL = 86400;

async function avatarResponse(url, ctx) {
  const handle = (url.searchParams.get("handle") || "").replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    return new Response("Invalid handle", { status: 400 });
  }

  const cache = caches.default;
  const cacheKey = new Request(`https://avatar.cache/${handle}`);
  try {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  } catch {} // cache misses must never break the response

  try {
    const page = await fetch(`https://oginstagram.com/${handle}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GoddessVault/1.0)" },
    });
    if (page.ok) {
      const m = (await page.text()).match(/<meta property="og:image" content="([^"]+)"/);
      if (m) {
        const img = await fetch(m[1].replace(/&amp;/g, "&"));
        if (img.ok) {
          const response = new Response(img.body, {
            status: 200,
            headers: {
              "Content-Type": img.headers.get("Content-Type") || "image/jpeg",
              "Cache-Control": `public, max-age=${AVATAR_TTL}`,
            },
          });
          ctx.waitUntil(cache.put(cacheKey, response.clone()));
          return response;
        }
      }
    }
  } catch {
    // any failure below falls through to the 404
  }

  return new Response("Avatar not found", {
    status: 404,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/avatar") return avatarResponse(url, ctx);
    if (url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });

    return env.ASSETS.fetch(request);
  },
};
