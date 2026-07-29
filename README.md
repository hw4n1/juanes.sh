# juanes.sh

Personal site + technical blog for Juan Esteban Muñoz Díaz ("Juanes"). Static Astro, Markdown/MDX content via content collections, Tailwind v4. No tracking by default.

## Stack

- [Astro](https://astro.build) with the [`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) adapter — pages are prerendered at build time and served as static assets from a Worker
- Content collections via the Content Layer API (`src/content.config.ts`) + schema validated with `zod`
- Tailwind CSS v4 (CSS-first config in `src/styles/global.css`, no `tailwind.config.js`)
- Self-hosted fonts: JetBrains Mono + Public Sans (via `@fontsource`, zero external requests)
- Shiki for syntax highlighting (dual light/dark theme)

## Run locally

```sh
npm install
npm run dev
```

Site available at `http://localhost:4321`.

```sh
npm run build    # static build into ./dist/
npm run preview  # serves ./dist/ to review the production build
```

## Add a new post

1. Create a file at `src/content/blog/my-post.md` (or `.mdx` if you need components).
2. Fill in the frontmatter:

   ```yaml
   ---
   title: 'Post title'
   description: 'Description for SEO/OG (1-2 sentences).'
   pubDate: 2026-06-24
   updatedDate: 2026-07-01 # optional
   tags: ['networking', 'bgp']
   lang: 'en' # 'en' | 'es'
   canonicalURL: 'https://...' # optional, see note below
   draft: false
   ---
   ```

3. Write the content in Markdown below the frontmatter.
4. `draft: true` hides the post from production builds (`npm run build`), but it's still visible in `npm run dev` for previewing.

### Canonical and syndication

Every post lives on `juanes.sh` first. If you later syndicate it to Medium or LinkedIn, set its `rel=canonical` (or that platform's own "canonical" setting) to point back to the post's URL on `juanes.sh`.

The frontmatter's `canonicalURL` field is for the reverse case: a post whose canonical source actually lives elsewhere (e.g. something migrated from another platform). Leave it unset and the canonical is automatically the post's own URL on this site (`https://juanes.sh/blog/<slug>/`).

## Optional analytics (privacy-first, self-hosted)

No analytics run by default. The site includes a component (`src/components/Analytics.astro`) that only loads a script if you set these environment variables:

```sh
PUBLIC_UMAMI_URL=https://your-self-hosted-umami.example/script.js
PUBLIC_UMAMI_WEBSITE_ID=your-website-id
```

Built for self-hosted [Umami](https://umami.is) or [Plausible](https://plausible.io). Without those variables, no third-party script loads at all.

## Deploy to Cloudflare Workers

The site is deployed as a **Worker** (not Cloudflare Pages). `wrangler.jsonc` holds the config: the build output in `./dist` is served through the `ASSETS` binding.

- Build command: `npm run build`
- Deploy: `npx wrangler deploy` (or `npm run deploy`, which builds first)
- With the Git integration ([Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)), a push to `main` builds and deploys on its own.

`public/_headers` defines aggressive cache-control for hashed assets (`/_astro/*`) and a few basic security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

## Pointing the juanes.sh domain

In the Cloudflare dashboard → **Workers & Pages** → your Worker → **Settings** → **Domains & Routes** → add `juanes.sh` as a custom domain.

This repo doesn't touch DNS or secrets — that part stays in the Cloudflare dashboard.

## Build-time data and the scheduled rebuild

`/network` and `/projects` resolve their data (RIPE Atlas, OONI, GitHub) **during the build**, so that no third-party request leaves the reader's browser: zero client-side JavaScript, zero tracking.

The trade-off is that the data is frozen until the next deploy. A daily rebuild fixes that.

### 1. Create the Deploy Hook

Workers Builds supports [Deploy Hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/) — a URL that triggers a build when it gets an HTTP `POST`.

1. Cloudflare dashboard → **Workers & Pages** → your Worker.
2. **Settings** → **Builds** → **Deploy Hooks**.
3. Give it a name (e.g. `daily-rebuild`), pick the `main` branch, and select **Create**.
4. Copy the generated URL. It looks like:

   ```text
   https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<DEPLOY_HOOK_ID>
   ```

> **The ID in that URL _is_ the credential.** There's no `Authorization` header: anyone who has the URL can trigger builds. It never goes in this repo, in a versioned `.env`, or in a commit.

### 2. Fire it once a day

From any machine that's always on (the homelab is fine), a daily cron entry:

```cron
17 4 * * *  curl -fsS -X POST "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<DEPLOY_HOOK_ID>" >/dev/null
```

Or the equivalent as a one-liner:

```sh
curl -fsS -X POST "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<DEPLOY_HOOK_ID>"
```

Once a day is plenty for probe uptime — hourly just burns build minutes for nothing. Deploy Hooks are rate limited to 10 builds/minute per Worker, and a repeat `POST` while the previous build is still initializing doesn't create a duplicate.

## `GITHUB_TOKEN` (optional, recommended)

`src/components/GithubRepos.astro` reads the GitHub API at build time. Unauthenticated, that API allows **60 requests/hour per IP**, and Cloudflare's builders go out through shared IPs — so the build can hit the limit through no fault of yours. With a token it goes to **5,000/hour**.

- The component works fine without it: if the call fails, the section just doesn't render, and the build doesn't break.
- The token needs **no scopes at all** — it only reads public data.
- Set it in the Cloudflare dashboard → your Worker → **Settings** → **Variables and Secrets**, as a secret named `GITHUB_TOKEN`.
- Locally, an untracked `.env` (`GITHUB_TOKEN=...`) works; `.env` is already in `.gitignore`.

Never commit it, and never give it scopes.

## Structure

```text
src/
├── content.config.ts       # schema for the "blog" collection
├── content/blog/           # posts in .md/.mdx
├── components/             # PromptLogo, Header, Footer, Seo, AtlasProbe, OoniNetwork, GithubRepos, etc.
├── layouts/                # BaseLayout, PostLayout
├── lib/fetch-json.ts       # build-time fetch with timeout; returns null instead of breaking the build
├── pages/                  # routes: home, blog, tag, projects, network, about, rss, 404
├── styles/global.css       # design tokens (typography, palette, theme)
└── utils/                  # readingTime, seo (canonical), posts (listing)
```

## Roadmap

Future features (search, command palette, .onion mirror, self-hosting, etc.) are documented in [`ROADMAP.md`](./ROADMAP.md) — intentionally not implemented yet.
