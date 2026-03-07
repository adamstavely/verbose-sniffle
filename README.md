# Status Page & Product Roadmap

A status dashboard and product roadmap for the Super App platform. Built with Astro and Tailwind, backed by an Elasticsearch-powered Node API.

**Integrating into an existing Astro docs site?** See [roadmap/INTEGRATION.md](roadmap/INTEGRATION.md) for a step-by-step guide.

## Overview

- **Status page** — Real-time visibility into platform health: core services, workspace capabilities, external dependencies, active incidents, and scheduled maintenance. Supports live data (via Elasticsearch) and mock data for local development.
- **Product roadmap** — Planned features, user-submitted requests with voting, and "coming soon" items via content collections.

## Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Astro 5, Tailwind CSS (in `roadmap/`) |
| **Backend** | Node.js, Express 5, TypeScript |
| **Data** | Elasticsearch (production) / mock data (development) |
| **Roadmap DB** | Astro DB (libSQL/SQLite) |

## Project Structure

```
├── backend/           # Node/Express status API
├── roadmap/           # Astro app (product roadmap + status page)
└── .env.example       # Environment template
```

## Features

**Status page** (`/roadmap/status`)

- Global status header, active incidents, capabilities by workspace type
- Connected services, 90-day uptime, scheduled maintenance, recent incidents
- Workspace detail (`/roadmap/status/workspaces/:id`), external systems, incident detail

**Product roadmap** (`/roadmap`)

- Browse planned features, vote on user-submitted requests
- Content collections for "coming soon" items

## Getting Started

### Prerequisites

- Node.js 18+
- npm 11+

### 1. Backend

```bash
cd backend
npm install
cp ../.env.example .env   # Edit with your Elasticsearch URL and API key
npm run build
npm start
```

The API runs on **port 4000**. Use `npm run dev` for hot reload.

### 2. Roadmap (Status Page + Product Roadmap)

```bash
cd roadmap
npm install
npm run dev
```

The app runs at **http://localhost:4321**. The status page is at `/roadmap/status`. API requests to `/api/status` are proxied to `http://localhost:4000` in development. A local database is created at `roadmap/.astro/content.db` automatically.

### 3. Mock Data (No Backend Required)

Set `PUBLIC_USE_MOCK_STATUS=true` in the roadmap environment. The status page will use in-memory mock data without Elasticsearch or the backend.

## Environment Variables

**Backend** (see `.env.example`)

| Variable | Description |
|----------|-------------|
| `ELASTICSEARCH_URL` | Elasticsearch endpoint |
| `ELASTICSEARCH_API_KEY` | API key for authentication |
| `STATUS_ENVIRONMENT` | Environment label (e.g. `production`, `staging`) |
| `STATUS_TIME_WINDOW_MINUTES` | Time window for status aggregation |
| `ELASTICSEARCH_INDEX_*` | Index names for core services, workspaces, incidents, etc. |

**Roadmap**

| Variable | Description |
|----------|-------------|
| `ASTRO_DATABASE_FILE` | Local DB path (e.g. `file:.astro/content.db`) |
| `ASTRO_DB_REMOTE_URL` | Remote libSQL URL (production) |
| `ASTRO_DB_APP_TOKEN` | Auth token for remote DB |
| `PUBLIC_STATUS_API_URL` | Status API base URL (default: `/api/status`) |
| `PUBLIC_USE_MOCK_STATUS` | Set to `true` to always use mock status data |
| `STATUS_FETCH_TIMEOUT_MS` | Timeout for status API fetches in ms (default: 15000). Set to `0` to disable |

## Content Collections (Roadmap Items)

Add Markdown files to `roadmap/src/content/roadmap/`:

```yaml
---
title: "Dark mode support"
description: "Full dark theme across the app"
status: "planned"      # planned | in-progress | shipped
targetQuarter: "Q2 2025"
priority: "high"       # high | medium | low
---
```

## Status Page Data Sources

See [docs/STATUS_PAGE_DATA.md](docs/STATUS_PAGE_DATA.md) for what is pulled from Elasticsearch vs. manually updated (Markdown, subscribe form).

To add incident workarounds or maintenance announcements via Markdown:
- `roadmap/src/content/status/incidents/`
- `roadmap/src/content/status/announcements/`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/status/summary` | Overall status and core services |
| `GET /api/status/workspaces` | Workspace list |
| `GET /api/status/workspaces/:id/features` | Feature status for a workspace |
| `GET /api/status/external-systems` | External system status |
| `GET /api/status/incidents` | Active incidents |
| `GET /api/status/incidents/recent` | Resolved incidents (90 days) |
| `GET /api/status/incidents/:id` | Single incident detail |
| `GET /api/status/scheduled-maintenance` | Scheduled maintenance windows |
| `GET /api/status/uptime` | 90-day daily uptime |

## Accessibility

Semantic landmarks, accessible tables, visible focus outlines, skip links, `aria-live` regions. Aimed at Section 508 / WCAG 2.1 AA compliance.

## Scripts

**Roadmap** (`cd roadmap`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

**Backend** (`cd backend`)

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled app |
| `npm run dev` | Run with hot reload |
