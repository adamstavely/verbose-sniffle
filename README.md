# Super App Status Page

A status dashboard for the Super App platform, built with Angular and Tailwind, backed by an Elasticsearch-powered Node API.

## Overview

The status page provides real-time visibility into platform health, including core services, workspace capabilities, external dependencies, active incidents, and scheduled maintenance. It supports both live data (via Elasticsearch) and mock data for local development.

## Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Angular 21, Tailwind CSS v4, RxJS |
| **Backend** | Node.js, Express 5, TypeScript |
| **Data** | Elasticsearch (production) / mock data (development) |
| **Shared** | TypeScript models in `shared/` |

## Project Structure

```
├── frontend/          # Angular SPA (status page)
├── backend/           # Node/Express API
├── roadmap/           # Astro product roadmap (see roadmap/README.md)
├── shared/            # Shared TypeScript models (status-models.ts)
└── .env.example       # Environment template
```

## Features

- **Global status header** — Overall platform health at a glance
- **Active incidents** — Current issues with workarounds and updates
- **Capabilities** — Status by workspace type (Analyst Workspace, Operations, Shared Platform)
- **Connected services** — External systems and dependencies
- **90-day uptime** — Daily status visualization
- **Scheduled maintenance** — Upcoming maintenance windows
- **Recent incidents** — Resolved incidents from the last 90 days
- **Subscribe** — Notification signup
- **Workspace detail** — Per-workspace feature status (`/workspaces/:id`)
- **External systems** — Full list of connected services (`/external-systems`)
- **Incident detail** — Individual incident pages (`/incidents/:id`)

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

The API runs on **port 4000** by default. Use `npm run dev` for development with hot reload.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

The Angular app runs on its default dev port (typically 4200). API requests to `/api/*` are proxied to `http://localhost:4000` via `proxy.conf.json`.

### 3. Mock Data (No Backend Required)

The frontend can run without the backend by using mock data. In `frontend/src/app/core/mock-status-data.ts`, set:

```ts
export const USE_MOCK_DATA = true;
```

With this enabled, the UI uses in-memory mock data and does not require Elasticsearch or the backend.

### 4. Product Roadmap (Optional)

A separate Astro app for the public product roadmap. See [roadmap/README.md](roadmap/README.md) for setup and usage.

```bash
cd roadmap
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ELASTICSEARCH_URL` | Elasticsearch endpoint (e.g. `http://localhost:9200`) |
| `ELASTICSEARCH_API_KEY` | API key for authentication |
| `STATUS_ENVIRONMENT` | Environment label (e.g. `production`, `staging`) |
| `STATUS_TIME_WINDOW_MINUTES` | Time window for status aggregation |
| `ELASTICSEARCH_INDEX_*` | Index names for core services, workspaces, incidents, etc. |

See `.env.example` for the full list.

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
| `GET /api/status/uptime` | 90-day daily uptime (days array + percentage) |

## Accessibility

The UI is built for accessibility:

- Semantic landmarks (`main`, `header`, `nav`)
- Accessible tables with captions and scopes
- Visible focus outlines
- Skip links
- `aria-live` regions for status updates

Aimed at Section 508 / WCAG 2.1 AA compliance.

## Scripts

**Frontend**

| Script | Description |
|--------|-------------|
| `npm start` | Start dev server |
| `npm run build` | Production build |
| `npm run test:unit` | Run Vitest unit tests |

**Backend**

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled app |
| `npm run dev` | Run with hot reload |
