# Integration Guide: Product Roadmap and Status Page into Existing Astro Docs Site

This guide explains how to integrate the product roadmap pages, status page, and features into an existing Astro site that hosts user guides and developer guides.

**Already integrated with the old backend?** See [INTEGRATION_CHANGES.md](./INTEGRATION_CHANGES.md) for what changed and how to update.

## Overview

**Two integration approaches:**

| Approach | Use when | Pros | Cons |
|----------|----------|------|------|
| **Merge** | Single unified docs + roadmap site | One codebase, shared nav, consistent UX | Requires config changes, DB setup |
| **Subpath / Sub-app** | Roadmap is a separate deploy under a path | Isolated, independent deploys | Two codebases, navigation handoff |

This guide focuses on the **merge** approach for a unified experience.

**What's included:**

- **Roadmap** — Planned features, feature requests, and voting (combined in one section)
- **Status Page** — Platform status, incidents, capabilities, 90-day uptime, subscribe for notifications

---

## Prerequisites

Your existing Astro site should have:

- Astro 4.15+ (for Actions) or Astro 5.x
- Node.js 18+
- An adapter for server output (e.g. `@astrojs/node`, `@astrojs/vercel`) — required for Actions

If your site is currently **static-only**, you must add an adapter and enable server rendering for the roadmap routes.

---

## Step 1: Add Dependencies

From your existing Astro project root:

```bash
npm install @astrojs/node @astrojs/sitemap @elastic/elasticsearch
npx astro add tailwind   # if not already using Tailwind
```

---

## Step 2: Update Astro Config

In `astro.config.mjs` (or `astro.config.ts`):

```js
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';  // if using Tailwind

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  integrations: [sitemap()],
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],  // if using Tailwind
    resolve: {
      alias: {
        shared: path.resolve(__dirname, 'src/lib/status'),  // status types/utils
      },
    },
  },
});
```

Ensure you have an adapter — without it, Actions and Astro DB will not work.

**Sitemap:** The `@astrojs/sitemap` integration generates `sitemap-index.xml` and numbered sitemap files at build time from your prerendered routes. Set `SITE_URL` in your environment so the sitemap uses your production URL. For crawler discovery, add `<link rel="sitemap" href="/sitemap-index.xml" />` to your layout `<head>` and reference the sitemap in `robots.txt`.

**Status page:** The `shared` alias points to `src/lib/status/` (status-models, status-utils, capability-groups, status-labels). Add to `tsconfig.json` if needed: `"paths": { "shared/*": ["src/lib/status/*"] }`. The Astro server queries Elasticsearch directly for status data.

---

## Step 3: Merge Content Collections

If you already have `src/content.config.ts`, add the `roadmap` collection and optionally the status collections.

**Don't use collections yet?** See [MIGRATION_TO_COLLECTIONS.md](./MIGRATION_TO_COLLECTIONS.md) for how to migrate existing site data (import.meta.glob, JSON, static files) to content collections.

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

const featureRequests = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/feature-requests' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
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
  featureRequests,
  statusIncidents,
  statusAnnouncements,
};
```

Create `src/content/roadmap/` and add Markdown files for roadmap items (see `roadmap/src/content/roadmap/` for examples).

For status, create `src/content/status/incidents/` and `src/content/status/announcements/` to add quick incident workarounds and maintenance announcements via Markdown (no API changes required).

---

## Step 5: Add Actions

Create `src/actions/index.ts` (or merge into an existing actions file):

Voting is identity-aware: each visitor gets a `roadmap_voter_id` cookie (set by middleware) so they can vote only once per feature. The vote action checks for existing votes and rejects duplicates.

Create `src/middleware.ts` to assign the voter cookie:

```ts
import { defineMiddleware } from 'astro:middleware';
import { randomUUID } from 'node:crypto';

const VOTER_COOKIE = 'roadmap_voter_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const onRequest = defineMiddleware((context, next) => {
  if (!context.cookies.has(VOTER_COOKIE)) {
    context.cookies.set(VOTER_COOKIE, randomUUID(), {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
    });
  }
  return next();
});
```

Create `src/actions/index.ts`:

```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { recordVote } from '../lib/votes/elastic-votes';

const VOTER_COOKIE = 'roadmap_voter_id';

export const server = {
  vote: defineAction({
    accept: 'form',
    input: z.object({
      featureRequestId: z.string().min(1),
    }),
    handler: async ({ featureRequestId }, { cookies }) => {
      const voterId = cookies.get(VOTER_COOKIE)?.value;
      if (!voterId) {
        return { success: false, error: 'Identity required. Please refresh the page and try again.' };
      }
      return recordVote(featureRequestId, voterId);
    },
  }),
};
```

Copy `src/lib/votes/elastic-votes.ts` from the roadmap app. Votes are stored in Elasticsearch (index `roadmap-votes` by default; set `ELASTICSEARCH_INDEX_ROADMAP_VOTES` to override).

---

## Step 6: Route Structure

Choose a route prefix for the roadmap to avoid clashes with existing docs:

| Existing routes | Suggested roadmap routes |
|-----------------|--------------------------|
| `/docs/`, `/guides/` | `/roadmap`, `/roadmap/status` |
| `/user-guides/`, `/developer-guides/` | `/roadmap`, `/roadmap/status` |

Copy these pages from `roadmap/src/pages/` into your site:

**Roadmap** (roadmap and voting combined in one section):
- `roadmap.astro` → e.g. `src/pages/roadmap/index.astro` (includes planned features + feature requests with voting)
- `requests/index.astro` → redirects to `/roadmap` (optional to copy)

**Status page:**
- `roadmap/status/index.astro` → `src/pages/roadmap/status/index.astro`
- `roadmap/status/workspaces/[id].astro` → `src/pages/roadmap/status/workspaces/[id].astro`
- `roadmap/status/incidents/[id].astro` → `src/pages/roadmap/status/incidents/[id].astro`
- `roadmap/status/external-systems.astro` → `src/pages/roadmap/status/external-systems.astro`

Set `export const prerender = false` on any page that uses the database, Actions, or fetches status data (roadmap and all status pages).

---

## Step 6b: Status Page Setup

The status page fetches from a Node/Express API. Status types and utilities live in `src/lib/status/`:

- `status-models.ts` — TypeScript types (StatusLevel, IncidentSummary, etc.)
- `status-utils.ts` — status ordering, Tailwind classes
- `capability-groups.ts` — capability grouping logic
- `status-labels.ts` — user-facing labels

Copy from `roadmap/src/lib/status/` into your site:

- `elastic-client.ts` — Elasticsearch client (connects to remote cluster)
- `status-config.ts` — index names and time windows
- `elastic-status.ts` — queries Elasticsearch for status data
- `fetch-status.ts` — fetch with mock fallback when Elasticsearch unavailable
- `mock-data.ts` — mock data for development without Elasticsearch

Add `@elastic/elasticsearch` to your dependencies.

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `ELASTICSEARCH_URL` | Elasticsearch endpoint (remote cluster) |
| `ELASTICSEARCH_API_KEY` | API key for authentication |
| `STATUS_ENVIRONMENT` | Environment label (e.g. `production`, `staging`) |
| `STATUS_TIME_WINDOW_MINUTES` | Time window for status aggregation |
| `ELASTICSEARCH_INDEX_*` | Index names for core services, workspaces, incidents, etc. |
| `PUBLIC_USE_MOCK_STATUS` | Set to `true` to always use mock data (no Elasticsearch required) |
| `SITE_URL` | Production URL (e.g. `https://your-status-page.example.gov`). Used by sitemap and incident notification emails. |

If Elasticsearch is unavailable, the status page automatically falls back to mock data.

**90-day uptime:** The Astro server derives daily status from core service telemetry and incidents in Elasticsearch. Each day is classified as `operational`, `degraded`, or `unavailable` based on the worst status observed that day.

**Data sources:** See [STATUS_PAGE_DATA.md](STATUS_PAGE_DATA.md) for a full breakdown of what is automatically pulled from Elasticsearch vs. what can be manually updated via Markdown.

**Status page features:**
- Global status header with overall platform health
- Active incidents with workarounds and links to detail pages
- Capabilities by workspace type (Analyst, Operations, Shared) with expandable accordions for impact details
- Core services table
- Workspace cards with links to feature status
- Connected services (external systems)
- 90-day uptime bar (from Elasticsearch, mock fallback when unavailable)
- Scheduled maintenance
- Recent incidents (resolved, last 90 days)
- Subscribe form for incident notifications (TODO: wire to notification system)

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
  ],
}
```

---

## Step 8: Copy Components

Copy these components from `roadmap/src/components/` into your site:

**Roadmap:**
- `RoadmapList.astro` — renders roadmap items from content collection
- `FeatureRequestCard.astro` — single feature request with vote button

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
- [ ] `@astrojs/node` and `@elastic/elasticsearch` installed
- [ ] `src/middleware.ts` to assign `roadmap_voter_id` cookie (identity-aware voting)
- [ ] `roadmap` and `featureRequests` content collections in `content.config.ts`
- [ ] `src/content/roadmap/*.md` files for coming-soon items
- [ ] `src/content/feature-requests/*.md` files for feature requests (id, title, description, status)
- [ ] `src/lib/votes/elastic-votes.ts` and `src/actions/index.ts` with `vote` (uses Elasticsearch)
- [ ] Pages: `/roadmap` (includes voting)
- [ ] `prerender: false` on roadmap page
- [ ] `ELASTICSEARCH_INDEX_ROADMAP_VOTES` env var (default: `roadmap-votes`)

**Status page:**
- [ ] `src/lib/status/` with status-models, status-utils, capability-groups, status-labels, elastic-client, status-config, elastic-status, fetch-status, mock-data
- [ ] `@elastic/elasticsearch` dependency and Vite alias for `shared` in astro.config
- [ ] `statusIncidents` and `statusAnnouncements` content collections (optional)
- [ ] Pages: `/roadmap/status`, `/roadmap/status/workspaces/[id]`, `/roadmap/status/incidents/[id]`, `/roadmap/status/external-systems`
- [ ] Status components: StatusBadge, Capabilities, UptimeBar, SubscribeNotifications

**Sitemap:**
- [ ] `@astrojs/sitemap` installed and added to `integrations` in astro.config
- [ ] `site` set in astro.config (e.g. `process.env.SITE_URL || 'https://example.com'`)
- [ ] `SITE_URL` env var set for production (used by sitemap and incident emails)

**Incident notifications (optional):**
- [ ] `EMAIL_SERVICE_URL` and `EMAIL_SERVICE_API_KEY` for internal email service
- [ ] `SITE_URL` for incident links in emails
- [ ] `ELASTICSEARCH_INDEX_STATUS_SUBSCRIBERS` and `ELASTICSEARCH_INDEX_STATUS_NOTIFICATION_SENT`
- [ ] Cron or webhook calling `GET` or `POST /api/notify/run` (e.g. every 5 min)
- [ ] `NOTIFY_WEBHOOK_SECRET` if securing webhook trigger

**General:**
- [ ] Nav/sidebar updated with roadmap and status links
- [ ] `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY` set for build (roadmap votes + status page)

---

## Deployment

- **Build**: No database setup required. Feature requests are static Markdown; votes use Elasticsearch.
- **Node adapter**: Your host must support Node.js serverless or standalone (Vercel, Netlify, etc.).
- **Elasticsearch**: Set `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY` for both roadmap votes and the status page. The `roadmap-votes` index is auto-created on first vote.
- **Status page**: Same Elasticsearch cluster; if unavailable, the status page falls back to mock data.
- **Notifications**: Set `EMAIL_SERVICE_URL` and `EMAIL_SERVICE_API_KEY`; schedule `curl https://your-site/api/notify/run` every 5 minutes (or have your pipeline POST when incidents change).

---

## File Reference

| Source (roadmap app) | Destination (your site) |
|----------------------|--------------------------|
| `src/middleware.ts` | `src/middleware.ts` (voter cookie for identity-aware voting) |
| `src/content.config.ts` | Merge `roadmap`, `featureRequests`, and optionally `statusIncidents`, `statusAnnouncements` |
| `src/content/roadmap/*.md` | `src/content/roadmap/*.md` |
| `src/content/feature-requests/*.md` | `src/content/feature-requests/*.md` |
| `src/lib/votes/elastic-votes.ts` | `src/lib/votes/elastic-votes.ts` |
| `src/content/status/incidents/*.md` | `src/content/status/incidents/*.md` (optional) |
| `src/content/status/announcements/*.md` | `src/content/status/announcements/*.md` (optional) |
| `src/actions/index.ts` | `src/actions/index.ts` (merge or create) |
| `src/pages/roadmap.astro` | `src/pages/roadmap/index.astro` (roadmap + voting combined) |
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
| `src/lib/status/elastic-client.ts` | `src/lib/status/elastic-client.ts` |
| `src/lib/status/status-config.ts` | `src/lib/status/status-config.ts` |
| `src/lib/status/elastic-status.ts` | `src/lib/status/elastic-status.ts` |
| `src/lib/status/fetch-status.ts` | `src/lib/status/fetch-status.ts` |
| `src/lib/status/mock-data.ts` | `src/lib/status/mock-data.ts` |
| `src/lib/status/*` | Status types/utils; Vite alias `shared` points to this folder |
| `src/lib/notifications/*` | Subscribers, email client, templates, notification delivery |
| `src/pages/api/notify/run.ts` | `src/pages/api/notify/run.ts` (cron/webhook trigger) |
