# Help Center

A Help Center web app: product **documentation** (User Guide, Developer Guide,
About), a **Release Notes** changelog, a **Product Roadmap** with community
voting, and a live **System Status** page.

Built with **Astro 7** (static-by-default, served by a standalone Node server for
the interactive routes) and **Tailwind CSS v4**. Dynamic data — feature-request
votes, page feedback, and live service telemetry — is backed by
**Elasticsearch**. Full-text search is powered by **Pagefind**.

> The entire application lives in the **[`roadmap/`](roadmap/)** subdirectory
> (a historical name). Run all commands from there.

## Documentation

| Doc | Read it for |
|-----|-------------|
| **[roadmap/HANDOFF.md](roadmap/HANDOFF.md)** | **Start here.** Architecture, rendering model, CSP, the Elasticsearch indices to create, the full env-var reference, integrations to wire up, and everything outstanding. |
| **[roadmap/CONTENT_GUIDE.md](roadmap/CONTENT_GUIDE.md)** | How to add/edit every content type — guides, releases, roadmap, feature requests, status, journeys, homepage, tags. |
| [roadmap/ELASTICSEARCH_GUIDE.md](roadmap/ELASTICSEARCH_GUIDE.md) | Deep Elasticsearch operations — cluster privileges, query semantics, per-index field tables, example mappings, and how to add a service to the status page. |

> `HANDOFF.md` and `CONTENT_GUIDE.md` are the canonical entry points;
> `ELASTICSEARCH_GUIDE.md` adds operational depth for the Elasticsearch
> integration.

## What's inside

| Area | Route | Data source |
|------|-------|-------------|
| Homepage | `/` | inline |
| User Guide (Diátaxis) + role "journeys" | `/user-guide`, `/user-guide/**` | MDX + `role-guides.ts` |
| Developer Guide | `/developer-guide/**` | MDX |
| About | `/about/**` | MDX |
| Release Notes (+ RSS) | `/releases`, `/rss.xml` | `releases` content collection |
| Product Roadmap + voting | `/roadmap` | content collections + Elasticsearch |
| System Status | `/roadmap/status` | Elasticsearch (service health, uptime) + Markdown (incidents/maintenance) + data file (connected services) |
| Tags browser | `/tags`, `/tags/<slug>` | doc frontmatter |
| Search | `/search` | Pagefind (build artifact) |

## Tech stack

| Layer | Stack |
|-------|-------|
| Framework | Astro 7, `output: 'static'` + per-route `prerender = false`; `@astrojs/node` standalone adapter |
| Styling | Tailwind CSS v4 (CSS-native config), Design System v2.1 tokens, class-based dark mode, self-hosted Inter + JetBrains Mono |
| Content | Astro content collections (Markdown) + MDX doc pages |
| Backend | Elasticsearch (`@elastic/elasticsearch`) — votes, feedback, live service health & uptime |
| Interactivity | Astro Actions (`vote`, `feedback`) |
| Search / feeds | Pagefind, `@astrojs/rss`, `@astrojs/sitemap` |

## Quick start

```bash
cd roadmap
npm install
cp .env.example .env        # fill in values, or set PUBLIC_USE_MOCK_STATUS=true to run without Elasticsearch
npm run dev                 # http://localhost:4321
```

> **Search** only works on a built site (its index is a build step), not in `dev`.

### Build & run the production server

```bash
cd roadmap
npm run build                 # astro build + pagefind → dist/client (static) + dist/server (Node server)
npm run check                 # TypeScript / Astro diagnostics
node ./dist/server/entry.mjs  # standalone server (serves on-demand routes + static assets); honors PORT
```

Static pages are emitted as HTML in `dist/client`; interactive routes (roadmap
voting, status hub, Actions) are served on demand by the Node server.
**Deploy the server bundle** — a static-only deploy breaks the dynamic features.

## Configuration

Runtime configuration is entirely via environment variables — see
[`roadmap/.env.example`](roadmap/.env.example) and the complete table in
[`roadmap/HANDOFF.md`](roadmap/HANDOFF.md#7-environment-variables-complete-reference).
Highlights:

- **Elasticsearch:** `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY`, and the
  `ELASTICSEARCH_INDEX_*` names (6 indices — the app does **not** create them;
  see `HANDOFF.md`).
- **Support modal:** `PUBLIC_SUPPORT_EMAIL`, `PUBLIC_SERVICENOW_URL`.
- **Site:** `SITE_URL` (canonical URLs, RSS).
- **No Elasticsearch handy?** `PUBLIC_USE_MOCK_STATUS=true` serves bundled mock
  status data. When ES is configured but unreachable, the status page shows an
  honest "Unknown" state rather than fake-healthy data.

## Project status

The front end is complete, accessible (WCAG-AA reviewed), and content-driven.
Before production a new developer must wire up the external integrations
(Elasticsearch cluster + indices, support/chat targets), replace the demo
content and placeholder product name, and add test/CI/lint infrastructure.
**All of this is enumerated in [`roadmap/HANDOFF.md`](roadmap/HANDOFF.md).**
