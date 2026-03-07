# Integration Guide: Product Roadmap and Status Page into Existing Astro Docs Site

This guide explains how to integrate the product roadmap pages, status page, and features into an existing Astro site that hosts user guides and developer guides.

## Overview

**Two integration approaches:**

| Approach | Use when | Pros | Cons |
|----------|----------|------|------|
| **Merge** | Single unified docs + roadmap site | One codebase, shared nav, consistent UX | Requires config changes, DB setup |
| **Subpath / Sub-app** | Roadmap is a separate deploy under a path | Isolated, independent deploys | Two codebases, navigation handoff |

This guide focuses on the **merge** approach for a unified experience.

**What's included:**

- **Roadmap** — Planned features, feature requests, voting
- **Status Page** — Platform status, incidents, capabilities, 90-day uptime, subscribe for notifications

---

## Prerequisites

Your existing Astro site should have:

- Astro 4.15+ (for Actions) or Astro 5.x
- Node.js 18+
- An adapter for server output (e.g. `@astrojs/node`, `@astrojs/vercel`) — required for Actions and Astro DB

If your site is currently **static-only**, you must add an adapter and enable server rendering for the roadmap routes.

---

## Step 1: Add Dependencies

From your existing Astro project root:

```bash
npm install @astrojs/db @astrojs/node
npx astro add tailwind   # if not already using Tailwind
```

---

## Step 2: Update Astro Config

In `astro.config.mjs` (or `astro.config.ts`):

```js
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '@astrojs/db';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';  // if using Tailwind

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  integrations: [db()],
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],  // if using Tailwind
    resolve: {
      alias: {
        shared: path.resolve(__dirname, '../shared'),  // for status page types/utils
      },
    },
    server: {
      proxy: {
        '/api/status': {
          target: 'http://localhost:4000',  // status API backend
          changeOrigin: true,
        },
      },
    },
  },
});
```

Ensure you have an adapter — without it, Actions and Astro DB will not work.

**Status page:** The `shared` alias points to the monorepo's `shared/` folder (status-models, status-utils, capability-groups, status-labels). Add to `tsconfig.json` if needed: `"paths": { "shared/*": ["../shared/*"] }`. The proxy forwards `/api/status` to your Node/Express status API in development.

---

## Step 3: Add Database Schema

Create or merge into `db/config.ts`:

```ts
import { defineDb, defineTable, column } from 'astro:db';

const FeatureRequest = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    title: column.text(),
    description: column.text(),
    createdAt: column.date(),
    status: column.text({ enum: ['pending', 'approved', 'rejected'] }),
  },
});

const Vote = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    featureRequestId: column.text({ references: () => FeatureRequest.columns.id }),
    createdAt: column.date(),
  },
});

export default defineDb({
  tables: {
    FeatureRequest,
    Vote,
  },
});
```

Run:

```bash
npx astro db push
```

For production, set `ASTRO_DATABASE_FILE` (local) or `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN` (remote).

---

## Step 4: Merge Content Collections

If you already have `src/content.config.ts`, add the `roadmap` collection and optionally the status collections:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Your existing collections (e.g. user-guides, developer-guides)
const userGuides = defineCollection({ /* ... */ });
const developerGuides = defineCollection({ /* ... */ });

const roadmap = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/roadmap' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['planned', 'in-progress', 'shipped']),
    targetQuarter: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
  }),
});

// Optional: for quick incident/maintenance updates via Markdown
const statusIncidents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/incidents' }),
  schema: z.object({
    incidentId: z.string().optional(),
    title: z.string(),
    severity: z.enum(['HEALTHY', 'DEGRADED', 'OUTAGE', 'MAINTENANCE', 'UNKNOWN']).optional(),
    workaround: z.string().optional(),
  }),
});

const statusAnnouncements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/announcements' }),
  schema: z.object({
    title: z.string(),
    scheduledStart: z.string().optional(),
    scheduledEnd: z.string().optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed']).optional(),
  }),
});

export const collections = {
  userGuides,
  developerGuides,
  roadmap,
  statusIncidents,
  statusAnnouncements,
};
```

Create `src/content/roadmap/` and add Markdown files for roadmap items (see `roadmap/src/content/roadmap/` for examples).

For status, create `src/content/status/incidents/` and `src/content/status/announcements/` to add quick incident workarounds and maintenance announcements via Markdown (no API changes required).

---

## Step 5: Add Actions

Create `src/actions/index.ts` (or merge into an existing actions file):

```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { db, FeatureRequest, Vote } from 'astro:db';
import { randomUUID } from 'node:crypto';

export const server = {
  submitFeatureRequest: defineAction({
    accept: 'form',
    input: z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
    }),
    handler: async ({ title, description }) => {
      const id = randomUUID();
      await db.insert(FeatureRequest).values({
        id,
        title,
        description,
        createdAt: new Date(),
        status: 'pending',
      });
      return { success: true, id };
    },
  }),

  vote: defineAction({
    accept: 'form',
    input: z.object({
      featureRequestId: z.string().min(1),
    }),
    handler: async ({ featureRequestId }) => {
      await db.insert(Vote).values({
        id: randomUUID(),
        featureRequestId,
        createdAt: new Date(),
      });
      return { success: true };
    },
  }),
};
```

---

## Step 6: Route Structure

Choose a route prefix for the roadmap to avoid clashes with existing docs:

| Existing routes | Suggested roadmap routes |
|-----------------|--------------------------|
| `/docs/`, `/guides/` | `/roadmap`, `/roadmap/requests`, `/roadmap/requests/new`, `/roadmap/status` |
| `/user-guides/`, `/developer-guides/` | `/roadmap`, `/roadmap/requests`, `/roadmap/requests/new`, `/roadmap/status` |

Copy these pages from `roadmap/src/pages/` into your site:

**Roadmap:**
- `roadmap.astro` → e.g. `src/pages/roadmap/index.astro`
- `requests/index.astro` → `src/pages/roadmap/requests/index.astro`
- `requests/new.astro` → `src/pages/roadmap/requests/new.astro`

**Status page:**
- `roadmap/status/index.astro` → `src/pages/roadmap/status/index.astro`
- `roadmap/status/workspaces/[id].astro` → `src/pages/roadmap/status/workspaces/[id].astro`
- `roadmap/status/incidents/[id].astro` → `src/pages/roadmap/status/incidents/[id].astro`
- `roadmap/status/external-systems.astro` → `src/pages/roadmap/status/external-systems.astro`

Set `export const prerender = false` on any page that uses the database, Actions, or fetches status data (requests index, requests new, and all status pages).

---

## Step 6b: Status Page Setup

The status page fetches from a Node/Express API. Ensure the `shared/` folder exists at the monorepo root (or adjust the Vite alias path) with:

- `shared/status-models.ts` — TypeScript types (StatusLevel, IncidentSummary, etc.)
- `shared/status-utils.ts` — status ordering, Tailwind classes
- `shared/capability-groups.ts` — capability grouping logic
- `shared/status-labels.ts` — user-facing labels

Copy from `roadmap/src/lib/status/` into your site:

- `api.ts` — fetch helpers for status endpoints
- `fetch-status.ts` — fetch with mock fallback when API unavailable
- `mock-data.ts` — mock data for development without backend

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `PUBLIC_STATUS_API_URL` | Status API base URL (default: `/api/status` in browser; `http://localhost:4000/api/status` for SSR) |
| `PUBLIC_USE_MOCK_STATUS` | Set to `true` to always use mock data (no backend required) |

**Status API endpoints** (your backend must implement these):

- `GET /api/status/summary` — overall status and core services
- `GET /api/status/workspaces` — workspace list
- `GET /api/status/workspaces/:id/features` — feature status for a workspace
- `GET /api/status/external-systems` — external system status
- `GET /api/status/incidents` — active incidents
- `GET /api/status/incidents/recent` — resolved incidents (90 days)
- `GET /api/status/incidents/:id` — single incident detail
- `GET /api/status/scheduled-maintenance` — scheduled maintenance windows
- `GET /api/status/uptime` — 90-day daily uptime (`{ days: DailyStatus[], percentage: number }`)

If the API is unavailable, the status page automatically falls back to mock data.

**90-day uptime:** The backend derives daily status from core service telemetry and incidents in Elasticsearch. Each day is classified as `operational`, `degraded`, or `unavailable` based on the worst status observed that day.

**Status page features:**
- Global status header with overall platform health
- Active incidents with workarounds and links to detail pages
- Capabilities by workspace type (Analyst, Operations, Shared) with expandable accordions for impact details
- Core services table
- Workspace cards with links to feature status
- Connected services (external systems)
- 90-day uptime bar (from `/api/status/uptime`, mock fallback when API unavailable)
- Scheduled maintenance
- Recent incidents (resolved, last 90 days)
- Subscribe form for incident notifications (TODO: wire to backend)

---

## Step 7: Layout and Navigation

**Option A: Use your existing layout**

Update roadmap pages to use your docs layout instead of `BaseLayout.astro`:

```astro
---
import DocsLayout from '../layouts/DocsLayout.astro';  // your existing layout
import RoadmapList from '../components/RoadmapList.astro';
import { getCollection } from 'astro:content';

const roadmapItems = await getCollection('roadmap');
---

<DocsLayout title="Roadmap" description="What's coming soon">
  <h1>What's Coming Soon</h1>
  <RoadmapList items={roadmapItems} />
</DocsLayout>
```

**Option B: Add roadmap and status to your nav**

In your shared header/nav component, add links:

```html
<nav>
  <a href="/user-guides">User Guides</a>
  <a href="/developer-guides">Developer Guides</a>
  <a href="/roadmap">Roadmap</a>
  <a href="/roadmap/status">Status</a>
  <a href="/roadmap/requests">Feature Requests</a>
  <a href="/roadmap/requests/new">Submit Request</a>
</nav>
```

**Option C: Add roadmap and status to sidebar**

If you use a sidebar (e.g. Starlight-style), add a "Product" or "Roadmap" section:

```ts
// Example sidebar config
{
  label: 'Product',
  items: [
    { label: 'Roadmap', link: '/roadmap' },
    { label: 'Status', link: '/roadmap/status' },
    { label: 'Feature Requests', link: '/roadmap/requests' },
    { label: 'Submit Request', link: '/roadmap/requests/new' },
  ],
}
```

---

## Step 8: Copy Components

Copy these components from `roadmap/src/components/` into your site:

**Roadmap:**
- `RoadmapList.astro` — renders roadmap items from content collection
- `FeatureRequestCard.astro` — single feature request with vote button
- `SubmitRequestForm.astro` — form for new feature requests

**Status page** (from `roadmap/src/components/status/`):
- `StatusBadge.astro` — status indicator (operational, degraded, outage, etc.)
- `Capabilities.astro` — capability groups with expandable accordions for impact details
- `UptimeBar.astro` — 90-day uptime visualization
- `SubscribeNotifications.astro` — email/webhook signup for incident notifications

Update any internal paths (e.g. `actions.vote` stays the same; layout imports may change).

---

## Step 9: Styling

If your docs site uses **Tailwind**, the roadmap components should work with minimal changes. They use utility classes like `rounded-lg`, `border-slate-200`, `bg-indigo-600`.

If you use **different CSS** (e.g. custom, Starlight theme):

1. Map Tailwind classes to your design system, or
2. Add a small roadmap-specific stylesheet that defines equivalent classes.

Ensure your layout includes the roadmap pages in the same CSS scope.

---

## Step 10: Landing Page (Optional)

If you want a dedicated roadmap landing page, copy `roadmap/src/pages/index.astro` and adjust links to match your route structure (e.g. `/roadmap` instead of `/` for the roadmap hero).

If your site already has a home page, add a prominent link to `/roadmap` instead.

---

## Checklist

**Roadmap:**
- [ ] `@astrojs/db` and `@astrojs/node` installed
- [ ] `db/config.ts` with `FeatureRequest` and `Vote` tables
- [ ] `astro db push` run (and `--remote` for production)
- [ ] `roadmap` content collection in `content.config.ts`
- [ ] `src/content/roadmap/*.md` files for coming-soon items
- [ ] `src/actions/index.ts` with `submitFeatureRequest` and `vote`
- [ ] Pages: `/roadmap`, `/roadmap/requests`, `/roadmap/requests/new`
- [ ] `prerender: false` on requests pages

**Status page:**
- [ ] `shared/` folder with status-models, status-utils, capability-groups, status-labels
- [ ] `src/lib/status/` with api.ts, fetch-status.ts, mock-data.ts
- [ ] Vite alias for `shared` and proxy for `/api/status` in astro.config
- [ ] `statusIncidents` and `statusAnnouncements` content collections (optional)
- [ ] Pages: `/roadmap/status`, `/roadmap/status/workspaces/[id]`, `/roadmap/status/incidents/[id]`, `/roadmap/status/external-systems`
- [ ] Status components: StatusBadge, Capabilities, UptimeBar, SubscribeNotifications

**General:**
- [ ] Nav/sidebar updated with roadmap and status links
- [ ] `ASTRO_DATABASE_FILE` or `ASTRO_DB_REMOTE_URL` set for build

---

## Deployment

- **Build**: Ensure `ASTRO_DATABASE_FILE` (or remote DB env vars) is set in your CI/deploy environment.
- **Node adapter**: Your host must support Node.js serverless or standalone (Vercel, Netlify, etc.).
- **Remote DB**: For production, use Turso or another libSQL host; run `astro db push --remote` in CI before build.
- **Status page**: Set `PUBLIC_STATUS_API_URL` to your production status API URL. If the API is unavailable, the page falls back to mock data. For production, ensure the status backend is deployed and reachable.

---

## File Reference

| Source (roadmap app) | Destination (your site) |
|----------------------|--------------------------|
| `db/config.ts` | `db/config.ts` (merge tables) |
| `src/content.config.ts` | Merge `roadmap` and optionally `statusIncidents`, `statusAnnouncements` |
| `src/content/roadmap/*.md` | `src/content/roadmap/*.md` |
| `src/content/status/incidents/*.md` | `src/content/status/incidents/*.md` (optional) |
| `src/content/status/announcements/*.md` | `src/content/status/announcements/*.md` (optional) |
| `src/actions/index.ts` | `src/actions/index.ts` (merge or create) |
| `src/pages/roadmap.astro` | `src/pages/roadmap/index.astro` |
| `src/pages/requests/index.astro` | `src/pages/roadmap/requests/index.astro` |
| `src/pages/requests/new.astro` | `src/pages/roadmap/requests/new.astro` |
| `src/pages/roadmap/status/index.astro` | `src/pages/roadmap/status/index.astro` |
| `src/pages/roadmap/status/workspaces/[id].astro` | `src/pages/roadmap/status/workspaces/[id].astro` |
| `src/pages/roadmap/status/incidents/[id].astro` | `src/pages/roadmap/status/incidents/[id].astro` |
| `src/pages/roadmap/status/external-systems.astro` | `src/pages/roadmap/status/external-systems.astro` |
| `src/components/RoadmapList.astro` | `src/components/RoadmapList.astro` |
| `src/components/FeatureRequestCard.astro` | `src/components/FeatureRequestCard.astro` |
| `src/components/SubmitRequestForm.astro` | `src/components/SubmitRequestForm.astro` |
| `src/components/status/StatusBadge.astro` | `src/components/status/StatusBadge.astro` |
| `src/components/status/Capabilities.astro` | `src/components/status/Capabilities.astro` |
| `src/components/status/UptimeBar.astro` | `src/components/status/UptimeBar.astro` |
| `src/components/status/SubscribeNotifications.astro` | `src/components/status/SubscribeNotifications.astro` |
| `src/lib/status/api.ts` | `src/lib/status/api.ts` |
| `src/lib/status/fetch-status.ts` | `src/lib/status/fetch-status.ts` |
| `src/lib/status/mock-data.ts` | `src/lib/status/mock-data.ts` |
| `shared/*` (monorepo root) | Ensure `shared/` exists; Vite alias points to it |
