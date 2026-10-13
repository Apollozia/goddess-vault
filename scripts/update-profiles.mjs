// Runs on GitHub Actions: refreshes images/<handle>.jpg and profiles.json
// from oginstagram.com. Residential/GitHub runner IPs are not blocked;
// Cloudflare Workers egress is, so the site itself must not scrape at runtime.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = fs.readFileSync(path.join(root, "data.js"), "utf8");
const mod = await import(
  "data:text/javascript;base64," +
    Buffer.from(src + "\nexport {CREATORS};").toString("base64")
);
const creators = mod.CREATORS;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

fs.mkdirSync(path.join(root, "images"), { recursive: true });

const profiles = {};
for (const c of creators) {
  try {
    const res = await fetch(`https://oginstagram.com/${c.handle}`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) throw new Error(`page ${res.status}`);
    const html = await res.text();

    const entry = {};

    const title = html.match(/<meta property="og:title" content="([^"]*)"/);
    if (title) {
      const name = title[1].replace(/\s*\(.*?\)\s*$/, "").trim();
      if (name) entry.name = name;
    }

    const desc = html.match(/<meta property="og:description" content="([^"]*)"/);
    if (desc) {
      const nums = desc[1].match(/\d{1,3}(?:,\d{3})+|\d+/g);
      if (nums && nums.length) {
        entry.followers = parseInt(nums[nums.length - 1].replace(/,/g, ""), 10);
      }
    }

    const img = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (img) {
      const url = img[1].replace(/&amp;/g, "&");
      const bin = await fetch(url, { headers: { "User-Agent": UA } });
      if (bin.ok) {
        fs.writeFileSync(
          path.join(root, "images", `${c.handle}.jpg`),
          Buffer.from(await bin.arrayBuffer())
        );
        entry.img = `images/${c.handle}.jpg`;
      }
    }

    if (Object.keys(entry).length) profiles[c.handle] = entry;
    console.log(`${c.handle}:`, JSON.stringify(entry));
  } catch (e) {
    console.log(`${c.handle}: FAILED (${e.message})`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}

fs.writeFileSync(path.join(root, "profiles.json"), JSON.stringify(profiles, null, 2));
