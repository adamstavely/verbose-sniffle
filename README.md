# Status Page & Product Roadmap

A status dashboard and product roadmap for the Super App platform. Built with **Astro** (server-rendered via the Node adapter) and **Tailwind CSS**.

The app is **static by default** and opts the interactive routes into on-demand rendering (`export const prerender = false`). Live service health, workspace, and external-system telemetry come from **Elasticsearch** (with a mock-data fallback when ES is unavailable). Feature-request **voting**, incident **email subscriptions**, and page **feedback** are handled server-side with **Astro Actions**. Incident/maintenance content is authored in **Markdown** under `roadmap/src/content/status/`.

See [roadmap/INTEGRATION_GUIDE.md](roadmap/INTEGRATION_GUIDE.md), [roadmap/ELASTICSEARCH_GUIDE.md](roadmap/ELASTICSEARCH_GUIDE.md), [roadmap/EMAIL_NOTIFICATIONS_GUIDE.md](roadmap/EMAIL_NOTIFICATIONS_GUIDE.md), and [roadmap/STATUS_PAGE_DATA.md](roadmap/STATUS_PAGE_DATA.md) for the server + Elasticsearch operational reference.

## Overview

- **Status page** — Live service health + 90-day uptime from Elasticsearch; active issues, scheduled maintenance, and recent incidents from Markdown collections; email incident subscriptions.
- **Product roadmap** — Planned features and community feature requests (with voting) via content collections + Elasticsearch.

## Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Astro 7 + Node adapter (`@astrojs/node`), Tailwind CSS (in `roadmap/`) |
| **Live telemetry** | Elasticsearch (`src/lib/status/elastic-status.ts`) via `fetch-status.ts`, with `mock-data.ts` fallback |
| **Interactivity** | Astro Actions (`src/actions/`) — voting, subscribe, feedback |
| **Incident content** | Markdown (`src/content/status/`) + helpers in `src/lib/status/status-content.ts` |
| **Roadmap data** | Content collections |

## Project Structure

```
├── roadmap/           # Astro app (product roadmap + status page)
└── roadmap/.env.example
```

## Features

**Status page** (`/roadmap/status`)

- **Active issues**, **scheduled maintenance**, and **recent incidents** (edit `.md` files under `roadmap/src/content/status/active-incidents/`, `maintenance/`, `recent-incidents/`)
- Incident detail pages at `/roadmap/status/incidents/:id` (one page per active incident file)
- Optional: workspace (`/roadmap/status/workspaces/:id`) and external systems pages still use mock telemetry for demo layout

**Product roadmap** (`/roadmap`)

- Browse planned features and community-submitted requests
- Content collections for "coming soon" items

## Getting Started

### Prerequisites

- Node.js 18+
- npm 11+

### Roadmap app

```bash
cd roadmap
npm install
npm run dev
```

The app runs at **http://localhost:4321**. The status page is at `/roadmap/status`. Edit status content in `roadmap/src/content/status/`. Feature requests live in `roadmap/src/content/feature-requests/`.

### Build & run (Node server)

```bash
cd roadmap
npm run build          # emits dist/client (static assets) + dist/server (Node entry)
npm run check          # type-check (astro check)
node ./dist/server/entry.mjs   # serves on-demand routes + static assets
```

The build produces a standalone Node server (`@astrojs/node`). Prerendered pages are emitted as static HTML in `dist/client`; interactive routes (roadmap voting, status hub, Actions, `/api/*`) are served on demand by `dist/server`.

## Environment Variables

Set Elasticsearch and email/notification variables at runtime (see [`roadmap/.env.example`](roadmap/.env.example) and the guides). Key ones:

- `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY`, and the `ELASTICSEARCH_INDEX_*` names — live status/telemetry, votes, subscribers, feedback.
- `EMAIL_SERVICE_URL` / `EMAIL_SERVICE_API_KEY` — incident notification email delivery.
- `SITE_URL` — canonical URLs in the sitemap (see `roadmap/astro.config.mjs`).
- `PUBLIC_USE_MOCK_STATUS=true` — force the mock-data fallback without an Elasticsearch cluster.

When Elasticsearch is unreachable, status/telemetry reads fall back to bundled mock data so the app still renders.

## Content Collections (Roadmap Items)

Add Markdown files to `roadmap/src/content/roadmap/`:

```yaml
---
title: "Dark mode support"
description: "Full dark theme across the app"
status: "planned"      # planned | in-progress | shipped
---

Details here.
```

## Content Collections (Feature Requests)

Add Markdown to `roadmap/src/content/feature-requests/` with frontmatter `id`, `title`, `description`, `status`.

## Status page (Markdown)

| Folder | Collection | Purpose |
|--------|------------|---------|
| `roadmap/src/content/status/active-incidents/` | `statusActiveIncidents` | Active issues list + `/roadmap/status/incidents/:id` — frontmatter: `id`, `title`, `level` (HEALTHY, DEGRADED, OUTAGE, MAINTENANCE, UNKNOWN), `startedAt` (ISO), optional `description`, `workaround`, `resolvedAt`, `aiNote`, `updates` (array of `timestamp`, `message`, optional `status`). Body is optional extra copy. |
| `roadmap/src/content/status/maintenance/` | `statusMaintenance` | Scheduled maintenance — `id`, `title`, `scheduledStart`, `scheduledEnd`, `status` (SCHEDULED, IN_PROGRESS, COMPLETED), optional `description`. |
| `roadmap/src/content/status/recent-incidents/` | `statusRecentIncidents` | Recent resolved incidents table — `id`, `date`, `title`, `duration`, `severity`, `cause`, optional `sortOrder` (higher sorts first). |
