# Status Page & Product Roadmap

A status dashboard and product roadmap for the Super App platform. Built with Astro and Tailwind, with the Astro server querying Elasticsearch directly for status data.

**Integrating into an existing Astro docs site?** See [roadmap/INTEGRATION.md](roadmap/INTEGRATION.md) for a step-by-step guide.

## Overview

- **Status page** — Real-time visibility into platform health: core services, workspace capabilities, external dependencies, active incidents, and scheduled maintenance. Supports live data (via Elasticsearch) and mock data for local development.
- **Product roadmap** — Planned features, user-submitted requests with voting, and "coming soon" items via content collections.

## Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Astro 5, Tailwind CSS (in `roadmap/`) |
| **Status data** | Elasticsearch (production) / mock data (development) |
| **Roadmap data** | Content collections (feature requests) + Elasticsearch (votes) |

## Project Structure

```
├── roadmap/           # Astro app (product roadmap + status page)
└── roadmap/.env.example
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

### 1. Roadmap (Status Page + Product Roadmap)

```bash
cd roadmap
npm install
cp .env.example .env   # Edit with your Elasticsearch URL and API key (or use mock)
npm run dev
```

The app runs at **http://localhost:4321**. The status page is at `/roadmap/status`. Feature requests are stored as Markdown in `src/content/feature-requests/`; votes are stored in Elasticsearch.

### 2. Mock Data (No Elasticsearch Required)

Set `PUBLIC_USE_MOCK_STATUS=true` in the roadmap environment. The status page will use in-memory mock data without Elasticsearch.

## Environment Variables

**Roadmap** (see `roadmap/.env.example`)

| Variable | Description |
|----------|-------------|
| `ELASTICSEARCH_URL` | Elasticsearch endpoint (remote cluster) |
| `ELASTICSEARCH_API_KEY` | API key for authentication |
| `STATUS_ENVIRONMENT` | Environment label (e.g. `production`, `staging`) |
| `STATUS_TIME_WINDOW_MINUTES` | Time window for status aggregation |
| `ELASTICSEARCH_INDEX_*` | Index names for core services, workspaces, incidents, roadmap votes, etc. |
| `PUBLIC_USE_MOCK_STATUS` | Set to `true` to always use mock status data |
| `STATUS_FETCH_TIMEOUT_MS` | Timeout for status fetches in ms (default: 15000). Set to `0` to disable |

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

See [roadmap/STATUS_PAGE_DATA.md](roadmap/STATUS_PAGE_DATA.md) for what is pulled from Elasticsearch vs. manually updated (Markdown, subscribe form).

To add incident workarounds or maintenance announcements via Markdown:
- `roadmap/src/content/status/incidents/`
- `roadmap/src/content/status/announcements/`

## Accessibility

Semantic landmarks, accessible tables, visible focus outlines, skip links, `aria-live` regions. Aimed at Section 508 / WCAG 2.1 AA compliance.

## Scripts

**Roadmap** (`cd roadmap`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
