# Product Roadmap

A public product roadmap built with [Astro](https://astro.build/). The product team publishes "coming soon" items via content collections, and users can vote on features and submit new requests.

## Features

- **Roadmap** — Browse planned, in-progress, and shipped features (content collections)
- **Feature Requests** — Vote on user-submitted features
- **Submit Request** — Propose new features for others to vote on

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

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
