# Help Center

A Help Center web app: product **documentation** (User Guide, Developer Guide,
About), a **Release Notes** changelog, a **Product Roadmap** with community
voting, and a live **System Status** page with incident email subscriptions.

Built with **Astro 7** (static-by-default, served by a standalone Node server for
the interactive routes) and **Tailwind CSS v4**. Dynamic data — feature-request
votes, incident subscribers, page feedback, and live service telemetry — is
backed by **Elasticsearch**. Full-text search is powered by **Pagefind**.

> The entire application lives in the **[`roadmap/`](roadmap/)** subdirectory
> (a historical name). Run all commands from there.

## Documentation

| Doc | Read it for |
|-----|-------------|
| **[roadmap/HANDOFF.md](roadmap/HANDOFF.md)** | **Start here.** Architecture, rendering model, CSP, the Elasticsearch indices to create, the full env-var reference, integrations to wire up, and everything outstanding. |
| **[roadmap/CONTENT_GUIDE.md](roadmap/CONTENT_GUIDE.md)** | How to add/edit every content type — guides, releases, roadmap, feature requests, status, journeys, homepage, tags. |
| [roadmap/STATUS_PAGE_DATA.md](roadmap/STATUS_PAGE_DATA.md) | Status-page Markdown sections in depth. |
| [roadmap/ELASTICSEARCH_GUIDE.md](roadmap/ELASTICSEARCH_GUIDE.md) | Elasticsearch index shapes & queries. |
| [roadmap/EMAIL_NOTIFICATIONS_GUIDE.md](roadmap/EMAIL_NOTIFICATIONS_GUIDE.md) | Subscribe + incident-email pipeline. |
| [roadmap/INTEGRATION_GUIDE.md](roadmap/INTEGRATION_GUIDE.md) | End-to-end integration reference. |

> Some of the four topic guides predate recent changes and contain a few stale
> details. Where they disagree with the code, **`HANDOFF.md` and `CONTENT_GUIDE.md`
> are authoritative** (see the "Documentation map" section of `HANDOFF.md`).

## What's inside

| Area | Route | Data source |
|------|-------|-------------|
| Homepage | `/` | inline |
| User Guide (Diátaxis) + role "journeys" | `/user-guide`, `/user-guide/**` | MDX + `role-guides.ts` |
| Developer Guide | `/developer-guide/**` | MDX |
| About | `/about/**` | MDX |
| Release Notes (+ RSS) | `/releases`, `/rss.xml` | `releases` content collection |
| Product Roadmap + voting | `/roadmap` | content collections + Elasticsearch |
| System Status + subscribe | `/roadmap/status` | Elasticsearch (telemetry) + Markdown (incidents) |
| Tags browser | `/tags`, `/tags/<slug>` | doc frontmatter |
| Search | `/search` | Pagefind (build artifact) |
| Notification webhook | `POST /api/notify/run` | Elasticsearch + email relay |

## Tech stack

| Layer | Stack |
|-------|-------|
| Framework | Astro 7, `output: 'static'` + per-route `prerender = false`; `@astrojs/node` standalone adapter |
| Styling | Tailwind CSS v4 (CSS-native config), Design System v2.1 tokens, class-based dark mode, self-hosted Inter + JetBrains Mono |
| Content | Astro content collections (Markdown) + MDX doc pages |
| Backend | Elasticsearch (`@elastic/elasticsearch`) — votes, subscribers, feedback, live status |
| Interactivity | Astro Actions (`vote`, `subscribe`, `feedback`) |
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
voting, status hub, Actions, `/api/notify/run`) are served on demand by the Node
server. **Deploy the server bundle** — a static-only deploy breaks the dynamic
features.

## Configuration

Runtime configuration is entirely via environment variables — see
[`roadmap/.env.example`](roadmap/.env.example) and the complete table in
[`roadmap/HANDOFF.md`](roadmap/HANDOFF.md#7-environment-variables-complete-reference).
Highlights:

- **Elasticsearch:** `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY`, and the
  `ELASTICSEARCH_INDEX_*` names (10 indices — the app does **not** create them;
  see `HANDOFF.md`).
- **Email/notifications:** `EMAIL_SERVICE_URL` / `EMAIL_SERVICE_API_KEY` (an HTTP
  mail relay you provide) and `NOTIFY_WEBHOOK_SECRET` (auth for the cron webhook).
- **Support modal:** `PUBLIC_SUPPORT_EMAIL`, `PUBLIC_SERVICENOW_URL`.
- **Site:** `SITE_URL` (canonical URLs, RSS, email links).
- **No Elasticsearch handy?** `PUBLIC_USE_MOCK_STATUS=true` serves bundled mock
  status data. When ES is configured but unreachable, the status page shows an
  honest "Unknown" state rather than fake-healthy data.

## Project status

The front end is complete, accessible (WCAG-AA reviewed), and content-driven.
Before production a new developer must wire up the external integrations
(Elasticsearch cluster + indices, email relay, notification cron, support/chat
targets), replace the demo content and placeholder product name, and add
test/CI/lint infrastructure. **All of this is enumerated in
[`roadmap/HANDOFF.md`](roadmap/HANDOFF.md).**
