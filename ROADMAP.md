# Roadmap

Future features for juanes.sh, organized by phase. None of this is implemented in v1 — it's the north star for iterating later.

## v2 — reading and UX

- **Client-side search with [Pagefind](https://pagefind.app/)**: indexes the static build, no backend or external service.
- **Cmd-K style command palette** that navigates the site like a terminal (fits the "instrument" identity): jump to posts, tags, sections, toggle theme.
- **Post series/collections**: group related posts (e.g. a series on the ASN process) with prev/next navigation within the series.
- **Per-post Open Graph images** (instead of v1's single `og-default.png`): a dynamic template with each post's title/tags, generated at build time (e.g. with `satori` or an Astro endpoint that renders to PNG).
- **JSON feed** (`feed.json`) alongside the current RSS, following the [JSON Feed](https://www.jsonfeed.org/) spec.

## v3 — self-hosted signals (depend on my own infrastructure)

- **`.onion` mirror of the site** as a Tor hidden service.
- **Hosting on my own infrastructure and ASN** — "this blog runs on my own autonomous system," once the LACNIC application is resolved.
- **Live status page** with read-only metrics from my cluster (exposed carefully, without opening up unnecessary attack surface).
- **`security.txt`** and a page with a public PGP key, for vulnerability reports and encrypted contact.
- **`/uses`, `/now`, `/talks`, and `/projects` pages** — hardware/software I use, what I'm doing now, talks given (DEF CON and others), open source projects.
