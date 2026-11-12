# TorusMC Website

Official website for TorusMC — https://torusmc.com

Built with Next.js (App Router), TypeScript, Tailwind CSS and pnpm.

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm lint
pnpm build   # static site → out/
```

The site is a static export (`output: "export"` in `next.config.ts`) hosted
on **GitHub Pages**. Server-only Next.js features (route handlers that read
the request, cookies, redirects/rewrites/headers in `next.config.ts`, Server
Actions, default `next/image` optimization) don't work with a static export.

## Structure

- `app/layout.tsx` — root layout, metadata (Open Graph / X card), viewport
- `app/page.tsx` — homepage (currently "Under Construction")
- `lib/site.ts` — site name, URL, server IP, description and social/integration links
- `public/torusmc.png` — favicon and link-preview image (Discord / Open Graph / X)
- `public/CNAME` — custom domain for GitHub Pages (`torusmc.com`)
- `.github/workflows/deploy.yml` — builds and publishes to GitHub Pages on push to `main`

## Deploying to GitHub Pages

### One-time setup

1. **Push the project to a GitHub repository** on the `main` branch:

   ```bash
   git init -b main
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   git push -u origin main
   ```

2. **Turn on Pages:** repository → **Settings → Pages → Build and
   deployment → Source: GitHub Actions**.

3. **Set the custom domain:** on the same page, enter `torusmc.com` under
   **Custom domain** and save. (`public/CNAME` already contains it.)

4. **DNS in Cloudflare** (dashboard → torusmc.com → DNS → Records). Remove
   any old `A`/`AAAA` records for `@` and `www` first, then add:

   | Type    | Name  | Content                  | Proxy status |
   | ------- | ----- | ------------------------ | ------------ |
   | `A`     | `@`   | `185.199.108.153`        | DNS only     |
   | `A`     | `@`   | `185.199.109.153`        | DNS only     |
   | `A`     | `@`   | `185.199.110.153`        | DNS only     |
   | `A`     | `@`   | `185.199.111.153`        | DNS only     |
   | `AAAA`  | `@`   | `2606:50c0:8000::153`    | DNS only     |
   | `AAAA`  | `@`   | `2606:50c0:8001::153`    | DNS only     |
   | `AAAA`  | `@`   | `2606:50c0:8002::153`    | DNS only     |
   | `AAAA`  | `@`   | `2606:50c0:8003::153`    | DNS only     |
   | `CNAME` | `www` | `YOUR_USER.github.io`    | DNS only     |

   Leave the `torusmc.net` and `dc.torusmc.com` records alone.

5. **HTTPS:** wait until GitHub shows the domain check as successful and the
   certificate as issued (can take up to ~an hour), then tick **Enforce
   HTTPS** in Settings → Pages.

6. **Optional, Cloudflare proxy:** once Enforce HTTPS is on, you can switch
   the records above to **Proxied** (orange cloud). If you do, set
   Cloudflare **SSL/TLS → encryption mode** to `Full (strict)`. `Flexible`
   causes a redirect loop. GitHub can't renew its certificate while the
   records are proxied, so if HTTPS on GitHub ever breaks, switch them back
   to DNS only for a while.

7. **Optional, verify the domain** (protects against takeover): GitHub →
   your profile **Settings → Pages → Add a domain**, then add the `TXT`
   record it shows in Cloudflare.

### Updating the site

Push to `main`. The workflow builds and publishes automatically; progress
is under the repository's **Actions** tab. It can also be run by hand from
there (**Deploy to GitHub Pages → Run workflow**).

## Discord

Links to the site unfurl in Discord as a Components V2 card. The card is
declared in `app/layout.tsx` (`discordEmbed`) and rendered into `<head>` as a
`<link rel="discord:component-embed">` and a
`<script id="discord:component-embed" type="application/json">`. It shows
the title, the logo (`public/torusmc.png`), a disabled button with the server
IP and a link button to the website. Standard Open Graph tags remain as a
fallback for other platforms.

## Adding integrations later

Put IDs and URLs in `siteConfig.links` (`lib/site.ts`), then add a small
component per integration under `components/embeds/`:

- **Discord widget / YouTube** — plain `<iframe>` in a Server Component,
  with `loading="lazy"` and a `title`.
- **Discord invite** — a regular link to `siteConfig.links.discordInvite`.
- **X / TikTok** — embed markup plus the provider script via
  `next/script` (`strategy="lazyOnload"`), loaded only on pages that use it.

If a Content Security Policy is added, allow the matching `frame-src` /
`script-src` origins.

The favicon, Apple touch icon and link-preview image all use
`public/torusmc.png` (set via `siteConfig.image` in `app/layout.tsx`).
