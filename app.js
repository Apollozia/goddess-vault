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
  return c.img
    ? `<div class="avatar"><img src="${c.img}" alt="${c.name}" loading="lazy"
         onerror="this.remove(); this.parentElement.textContent='${initials}'"></div>`
    : `<div class="avatar">${initials}</div>`;
}

function cardHTML(c) {
  const tags = c.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  const followers = c.followers
    ? `<span class="follower-chip">· ${fmtFollowers(c.followers)} followers</span>`
    : "";
  return `
  <a class="card" href="https://instagram.com/${c.handle}" target="_blank" rel="noopener noreferrer">
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
