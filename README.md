# Goddess Vault

A static, zero-dependency gallery of curated Instagram creators — deployable to Cloudflare Pages in seconds.

## Editing the list

Open `data.js` — everything lives there:

- `CREATORS`: one object per person (`handle`, `name`, `desc`, `tags`, `img`, `followers`, `pinned`)
- `SITE`: site title, tagline, curator credit

No build step. Save, push, done.

## Deploy to Cloudflare Pages

1. Put this folder in a git repo and push it to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Framework preset: **None**. Build command: *(leave empty)*. Output directory: `/`.
4. Deploy — you'll get `<name>.pages.dev`.

Or drag-and-drop: **Create → Pages → Upload assets** and drop `index.html`, `style.css`, `app.js`, `data.js`.

## Run locally

Just open `index.html`, or serve it:

```
python -m http.server 8080
```
