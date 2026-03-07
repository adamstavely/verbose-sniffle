# Product Roadmap

A public product roadmap built with [Astro](https://astro.build/). The product team publishes "coming soon" items via content collections, and users can vote on features.

**Integrating into an existing Astro docs site?** See [INTEGRATION.md](./INTEGRATION.md) for a step-by-step guide.

## Features

- **Roadmap** — Browse planned features, vote on user-submitted requests, and see what's coming (all in one section)
- **Status** — Real-time platform status, incidents, workspaces, and maintenance (at `/roadmap/status`)

## Tech Stack

- **Framework**: Astro 5
- **Styling**: Tailwind CSS
- **Database**: Astro DB (libSQL/SQLite)
- **Content**: Markdown content collections

## Getting Started

### Prerequisites

- Node.js 18+
- npm 11+

### 1. Install dependencies

```bash
cd roadmap
npm install
```

### 2. Run development server

```bash
npm run dev
```

The app runs at **http://localhost:4321**. A local database is created at `.astro/content.db` automatically.

### 3. Build for production

```bash
npm run build
```

For production, set `ASTRO_DATABASE_FILE` (local file) or connect to a remote libSQL database:

```bash
ASTRO_DATABASE_FILE=file:.astro/content.db npm run build
```

For remote databases (e.g. Turso), set `ASTRO_DB_REMOTE_URL` and `ASTRO_DB_APP_TOKEN`, then:

```bash
npx astro db push --remote
npm run build -- --remote
```

## Content Collections (Roadmap Items)

Product team publishes "coming soon" items by adding Markdown files to `src/content/roadmap/`:

```yaml
---
title: "Dark mode support"
description: "Full dark theme across the app"
status: "planned"      # planned | in-progress | shipped
targetQuarter: "Q2 2025"
priority: "high"       # high | medium | low
---
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ASTRO_DATABASE_FILE` | Local DB path (e.g. `file:.astro/content.db`) for dev/build |
| `ASTRO_DB_REMOTE_URL` | Remote libSQL URL (production) |
| `ASTRO_DB_APP_TOKEN` | Auth token for remote DB |
| `PUBLIC_STATUS_API_URL` | Status API base URL (default: `/api/status`; proxied to `localhost:4000` in dev) |
| `PUBLIC_USE_MOCK_STATUS` | Set to `true` to always use mock status data (no backend required) |

### Status Page

The status page at `/roadmap/status` fetches from the Node/Express status API. In dev, requests to `/api/status` are proxied to `http://localhost:4000`. If the backend is unavailable, mock data is used automatically.

**Data sources:** See [docs/STATUS_PAGE_DATA.md](../docs/STATUS_PAGE_DATA.md) for what is automatically pulled from Elasticsearch vs. what can be manually updated via Markdown, and how to update each.

To add quick incident or maintenance updates via Markdown, add files to:
- `src/content/status/incidents/` — incident workarounds and updates
- `src/content/status/announcements/` — maintenance announcements

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
