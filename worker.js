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

async function profileResponse(url, ctx) {
  const handle = (url.searchParams.get("handle") || "").replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    return new Response("Invalid handle", { status: 400 });
  }

  const cache = caches.default;
  const cacheKey = new Request(`https://profile.cache/${handle}`);
  try {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  } catch {}

  try {
    const page = await fetch(`https://oginstagram.com/${handle}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GoddessVault/1.0)" },
    });
    if (page.ok) {
      const html = await page.text();
      const profile = {};

      const title = html.match(/<meta property="og:title" content="([^"]*)"/);
      if (title) {
        const name = title[1].replace(/\s*\(.*?\)\s*$/, "").trim();
        if (name) profile.name = name;
      }

      const desc = html.match(/<meta property="og:description" content="([^"]*)"/);
      if (desc) {
        const nums = desc[1].match(/\d{1,3}(?:,\d{3})+|\d+/g);
        if (nums && nums.length) {
          profile.followers = parseInt(nums[nums.length - 1].replace(/,/g, ""), 10);
        }
      }

      if (profile.name || profile.followers !== undefined) {
        const response = new Response(JSON.stringify(profile), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=86400}`,
          },
        });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      }
    }
  } catch {
    // fall through to the 404 below
  }

  return new Response("Profile not found", {
    status: 404,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/avatar") return avatarResponse(url, ctx);
    if (url.pathname === "/api/profile") return profileResponse(url, ctx);
    if (url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });

    return env.ASSETS.fetch(request);
  },
};
