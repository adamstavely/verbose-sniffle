# Status Page & Product Roadmap

**Phase 1:** This roadmap app is built as a **fully static** Astro site (no Elasticsearch, voting, or email). The **status hub** (`/roadmap/status`) is edited via **Markdown** under `roadmap/src/content/status/` (active incidents, maintenance, recent incidents). Subpages for workspaces and external systems still use bundled mock telemetry until phase 2.

A status dashboard and product roadmap for the Super App platform. Built with Astro and Tailwind.

Legacy integration guides ([roadmap/INTEGRATION_GUIDE.md](roadmap/INTEGRATION_GUIDE.md), [roadmap/ELASTICSEARCH_GUIDE.md](roadmap/ELASTICSEARCH_GUIDE.md), [roadmap/EMAIL_NOTIFICATIONS_GUIDE.md](roadmap/EMAIL_NOTIFICATIONS_GUIDE.md)) describe the previous server + Elasticsearch architecture and are not required for the static build.

## Overview

- **Status page** — Active issues, scheduled maintenance, and recent incidents from Markdown collections; workspace and external-system drill-downs still use mock data.
- **Product roadmap** — Planned features and community feature requests via content collections.

## Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Astro 5, Tailwind CSS (in `roadmap/`) |
| **Status hub** | Markdown (`src/content/status/`) + helpers in `src/lib/status/status-content.ts` |
| **Status drill-downs (workspaces / external systems)** | Mock data (`src/lib/status/mock-data.ts`) |
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

### Build (static output)

```bash
cd roadmap
npm run build
```

Deploy the `roadmap/dist/` directory to any static host (no Node server required).

## Environment Variables

Optional: set `SITE_URL` at build time for canonical URLs in the sitemap (see `roadmap/astro.config.mjs`).

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
