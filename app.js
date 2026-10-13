const $ = (s) => document.querySelector(s);
const grid = $("#grid");
const tabsEl = $("#tabs");
const searchEl = $("#search");
const sortEl = $("#sortBy");
const emptyEl = $("#empty");

let activeTag = "all";

function fmtFollowers(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "K";
  return n;
}

function allTags() {
  const set = new Set();
  CREATORS.forEach((c) => c.tags.forEach((t) => set.add(t)));
  return [...set].sort();
}

function filtered() {
  const q = searchEl.value.trim().toLowerCase();
  let list = CREATORS.filter((c) => {
    const tagOk = activeTag === "all" || c.tags.includes(activeTag);
    const qOk =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      (c.desc || "").toLowerCase().includes(q);
    return tagOk && qOk;
  });
  const sort = sortEl.value;
  list.sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "followers-asc") return (a.followers || 0) - (b.followers || 0);
    return (b.followers || 0) - (a.followers || 0);
  });
  return list;
}

function avatarHTML(c) {
  const initials = c.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const src = c.img || (staticProfiles[c.handle]?.img ?? `images/${c.handle}.jpg`);
  if (!src) return `<div class="avatar">${initials}</div>`;
  return `<div class="avatar"><img src="${src}" alt="${c.name}" loading="lazy"
       onerror="if(!this.dataset.f){this.dataset.f=1;this.src='/api/avatar?handle=${c.handle}'}else{this.remove();this.parentElement.textContent='${initials}'}"></div>`;
}

function cardHTML(c) {
  const tags = c.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  const followers = `<span class="follower-chip">${
    c.followers ? `· ${fmtFollowers(c.followers)} followers` : ""
  }</span>`;
  return `
  <a class="card" data-handle="${c.handle}" href="https://instagram.com/${c.handle}" target="_blank" rel="noopener noreferrer">
    ${avatarHTML(c)}
    <div class="card-body">
      <div class="card-name">${c.name}</div>
      <div class="card-handle">@${c.handle} ${followers}</div>
      <div class="card-desc">${c.desc || ""}</div>
      <div class="card-meta">${tags}</div>
    </div>
  </a>`;
}

function renderTabs() {
  tabsEl.innerHTML =
    `<button class="tab ${activeTag === "all" ? "active" : ""}" data-tag="all">All (${CREATORS.length})</button>` +
    allTags()
      .map((t) => {
        const n = CREATORS.filter((c) => c.tags.includes(t)).length;
        return `<button class="tab ${activeTag === t ? "active" : ""}" data-tag="${t}">${t} (${n})</button>`;
      })
      .join("");
}

function renderGrid() {
  const list = filtered();
  grid.innerHTML = list.map(cardHTML).join("");
  emptyEl.classList.toggle("hidden", list.length > 0);
  enrichLive();
}

// Live/static profile data. profiles.json is refreshed daily by a GitHub
// Action; the /api/profile endpoint is a runtime fallback for handles the
// Action could not fetch.
let staticProfiles = {};
fetch("profiles.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((p) => {
    if (p) {
      staticProfiles = p;
      enrichRequested.clear(); // allow re-enrichment with the static data
      renderGrid();
    }
  })
  .catch(() => {});

let enrichRequested = new Set();

function enrichLive() {
  grid.querySelectorAll(".card").forEach((card) => {
    const handle = card.dataset.handle;
    if (!handle || enrichRequested.has(handle)) return;
    enrichRequested.add(handle);
    const local = staticProfiles[handle];
    if (local) {
      applyProfile(handle, local);
      updateTopStat(handle, local);
    } else {
      fetch(`/api/profile?handle=${encodeURIComponent(handle)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => {
          if (!p) return;
          applyProfile(handle, p);
          updateTopStat(handle, p);
        })
        .catch(() => {});
    }
  });
}

const liveCounts = {};

function applyProfile(handle, p) {
  liveCounts[handle] = p;
  document
    .querySelectorAll(`.card[data-handle="${CSS.escape(handle)}"]`)
    .forEach((el) => {
      const chip = el.querySelector(".follower-chip");
      if (chip && p.followers) {
        chip.textContent = `· ${fmtFollowers(p.followers)} followers`;
      }
      const nameEl = el.querySelector(".card-name");
      if (nameEl && p.name) nameEl.textContent = p.name;
    });
}

function updateTopStat(handle, p) {
  const best = CREATORS.reduce(
    (max, c) =>
      Math.max(
        max,
        liveCounts[c.handle]?.followers || staticProfiles[c.handle]?.followers || c.followers || 0
      ),
    0
  );
  $("#statTop").textContent = best ? fmtFollowers(best) : "—";
}

function renderStats() {
  $("#statTotal").textContent = CREATORS.length;
  $("#statTags").textContent = allTags().length;
  const top = CREATORS.reduce((a, b) => ((b.followers || 0) > (a.followers || 0) ? b : a), CREATORS[0]);
  $("#statTop").textContent = top && top.followers ? fmtFollowers(top.followers) : "—";
}

function renderSpotlight() {
  const pool = CREATORS.filter((c) => c.pinned).length ? CREATORS.filter((c) => c.pinned) : CREATORS;
  const c = pool[Math.floor(Math.random() * pool.length)];
  $("#spotlightCard").innerHTML = `
    <div style="display:flex; gap:18px; align-items:center;">
      ${avatarHTML(c).replace('class="avatar"', 'class="avatar" style="width:72px;height:72px;font-size:1.6rem"')}
      <div>
        <div class="card-name" style="font-size:1.15rem">${c.name}</div>
        <div class="card-handle">@${c.handle} ${c.followers ? `· ${fmtFollowers(c.followers)} followers` : ""}</div>
        <div class="card-desc">${c.desc || ""}</div>
      </div>
    </div>
    <a class="btn" style="display:inline-block; margin-top:16px; text-decoration:none; color:var(--accent); border-color:var(--accent)"
       href="https://instagram.com/${c.handle}" target="_blank" rel="noopener noreferrer">Open on Instagram ↗</a>`;
}

function initSite() {
  document.title = `${SITE.title} — Curated IG Gallery`;
  $("#siteTitle").textContent = SITE.title;
  $("#siteTagline").textContent = SITE.tagline;
  $("#siteCurator").textContent = SITE.curator;
}

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  activeTag = btn.dataset.tag;
  renderTabs();
  renderGrid();
});
searchEl.addEventListener("input", renderGrid);
sortEl.addEventListener("change", renderGrid);
$("#rerollBtn").addEventListener("click", renderSpotlight);

document.addEventListener("keydown", (e) => {
  if (e.key === "r" && document.activeElement !== searchEl) renderSpotlight();
  if (e.key === "t" && document.activeElement !== searchEl) document.body.classList.toggle("light");
  if (e.key === "/" && document.activeElement !== searchEl) {
    e.preventDefault();
    searchEl.focus();
  }
});

initSite();
renderTabs();
renderGrid();
renderStats();
renderSpotlight();
