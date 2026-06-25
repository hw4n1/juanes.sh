# juanes.sh

Personal site + technical blog for Juan Esteban Muñoz Díaz ("Juanes"). Static Astro, Markdown/MDX content via content collections, Tailwind v4. No tracking by default.

## Stack

- [Astro](https://astro.build) (`output: 'static'`, no adapter)
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

## Deploy to Cloudflare Pages

1. Connect the repo in Cloudflare Pages.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Framework preset: Astro (or "None" + the values above)
5. No Astro adapter is needed: the site is 100% static (`output: 'static'`).

`public/_headers` already defines aggressive cache-control for hashed assets (`/_astro/*`) and a few basic security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`); Cloudflare Pages picks it up automatically from the build root.

## Pointing the juanes.sh domain

In Cloudflare Pages → your project → **Custom domains** → add `juanes.sh` (and `www.juanes.sh` if you want it to redirect). If the domain is already on Cloudflare, validation is automatic; if not, Cloudflare will ask you to add the corresponding DNS records (usually a `CNAME` to `<project>.pages.dev`).

This repo doesn't touch DNS or secrets — that part stays in the Cloudflare dashboard.

## Structure

```text
src/
├── content.config.ts       # schema for the "blog" collection
├── content/blog/           # posts in .md/.mdx
├── components/             # PromptLogo, Header, Footer, Seo, etc.
├── layouts/                # BaseLayout, PostLayout
├── pages/                  # routes: home, blog, tag, about, rss, 404
├── styles/global.css       # design tokens (typography, palette, theme)
└── utils/                  # readingTime, seo (canonical), posts (listing)
```

## Roadmap

Future features (search, command palette, .onion mirror, hosting on my own ASN, etc.) are documented in [`ROADMAP.md`](./ROADMAP.md) — intentionally not implemented yet.
