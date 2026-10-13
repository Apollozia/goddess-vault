// GET /api/profile?handle=<instagram handle>  (Cloudflare Pages Function)
// Returns { name, followers } scraped from the account's oginstagram.com page,
// cached at the edge for a day.

const TTL = 86400;

async function profileResponse({ request, waitUntil }) {
  const url = new URL(request.url);
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
            "Cache-Control": `public, max-age=${TTL}`,
          },
        });
        waitUntil(cache.put(cacheKey, response.clone()));
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

export const onRequestGet = profileResponse;
