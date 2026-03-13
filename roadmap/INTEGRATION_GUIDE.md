# Integration Guide: Product Roadmap & Status Page into Your Astro Site

This guide walks you through integrating the product roadmap and status page into an existing Astro docs site. It consolidates setup instructions, migration steps, and troubleshooting in one place.

---

## Table of Contents

1. [Quick Start: Which Path Are You On?](#quick-start-which-path-are-you-on)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Migrating from the Old Setup](#migrating-from-the-old-setup)
6. [Environment Variables Reference](#environment-variables-reference)
7. [File Copy Reference](#file-copy-reference)
8. [Checklist](#checklist)
9. [Deployment](#deployment)

---

## Quick Start: Which Path Are You On?

| Your situation | What to do |
|----------------|------------|
| **New integration** — Adding roadmap + status to a fresh or existing Astro site | Follow [Step-by-Step Integration](#step-by-step-integration) |
| **Upgrading** — You previously used the Node/Express backend, Vite proxy, or Astro DB | Read [Migrating from the Old Setup](#migrating-from-the-old-setup) first, then follow the integration steps |
| **No content collections yet** — Your site uses `import.meta.glob`, JSON, or static files for content | See [MIGRATION_TO_COLLECTIONS.md](./MIGRATION_TO_COLLECTIONS.md) before adding roadmap collections |

---

## Architecture Overview

**Current design (no separate backend):**

- **Roadmap:** Content collections (Markdown) for planned features and feature requests; votes stored in Elasticsearch
- **Status page:** Astro server queries Elasticsearch directly via `@elastic/elasticsearch`; client fetches HTML from `/api/page-status-data`
- **Notifications:** Subscribers stored in Elasticsearch; email sent via your internal email service; cron/webhook triggers `GET /api/notify/run`

**What’s included:**

| Feature | Description |
|---------|-------------|
| **Roadmap** | Planned features, feature requests with voting, “coming soon” items |
| **Status page** | Platform health, incidents, capabilities, 90-day uptime, subscribe for notifications |
| **Page feedback** (optional) | “Was this helpful?” buttons with yes/no and optional message |

---

## Prerequisites

- Astro 4.15+ (for Actions) or Astro 5.x
- Node.js 18+
- Server adapter (e.g. `@astrojs/node`, `@astrojs/vercel`) — required for Actions and API routes

If your site is **static-only**, add an adapter and enable server rendering for roadmap and status routes.

---

## Step-by-Step Integration

### Step 1: Install Dependencies

```bash
npm install @astrojs/node @astrojs/sitemap @elastic/elasticsearch
npx astro add tailwind   # if not already using Tailwind
```

---

### Step 2: Update Astro Config

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
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        shared: path.resolve(__dirname, 'src/lib/status'),
      },
    },
  },
});
```

**Important:** Do **not** add a Vite proxy for `/api/status`. The status page uses `/api/page-status-data` and queries Elasticsearch directly from the Astro server.

Add to `tsconfig.json` if needed:

```json
{
  "compilerOptions": {
    "paths": {
      "shared/*": ["src/lib/status/*"]
    }
  }
}
```

---

### Step 3: Content Collections

Create or update `src/content.config.ts`. Add the roadmap and feature request collections (and optionally status collections):

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Your existing collections (e.g. userGuides, developerGuides)
// const userGuides = defineCollection({ ... });
// const developerGuides = defineCollection({ ... });

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

// Optional: incident workarounds and maintenance announcements
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
  roadmap,
  featureRequests,
  statusIncidents,
  statusAnnouncements,
  // ... your existing collections
};
```

Create directories and add Markdown files:

- `src/content/roadmap/` — planned features (see `roadmap/src/content/roadmap/` for examples)
- `src/content/feature-requests/` — feature requests with `id`, `title`, `description`, `status`
- `src/content/status/incidents/` — optional incident overrides
- `src/content/status/announcements/` — optional maintenance announcements

---

### Step 4: Middleware (Voter Cookie + Form Handling)

Create `src/middleware.ts` to assign a visitor cookie (used for voting and feedback) and handle vote/subscribe form redirects:

```ts
import { defineMiddleware } from 'astro:middleware';
import { getActionContext } from 'astro:actions';
import { randomUUID } from 'node:crypto';

const VOTER_COOKIE = 'roadmap_voter_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const onRequest = defineMiddleware(async (context, next) => {
  if (!context.cookies.has(VOTER_COOKIE)) {
    context.cookies.set(VOTER_COOKIE, randomUUID(), {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
    });
  }

  const { action, setActionResult, serializeActionResult } = getActionContext(context);
  const isVoteForm = action?.calledFrom === 'form' && action.name?.endsWith('vote');
  const isSubscribeForm = action?.calledFrom === 'form' && action.name?.endsWith('subscribe');
  if (isVoteForm || isSubscribeForm) {
    try {
      const result = await action.handler();
      setActionResult(action.name, serializeActionResult(result));
      const referer = context.request.headers.get('Referer');
      const redirectTo = referer ? new URL(referer).pathname : '/roadmap';
      return context.redirect(redirectTo);
    } catch (err) {
      setActionResult(action.name, serializeActionResult({ success: false, error: String(err) }));
      const referer = context.request.headers.get('Referer');
      const redirectTo = referer ? new URL(referer).pathname : '/roadmap';
      return context.redirect(redirectTo);
    }
  }

  return next();
});
```

---

### Step 5: Actions

Create or merge into `src/actions/index.ts`:

```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { recordVote } from '../lib/votes/elastic-votes';
import { addSubscriber } from '../lib/notifications/elastic-subscribers';
import { recordFeedback } from '../lib/feedback/elastic-feedback';
import { sendEmail, isEmailServiceConfigured } from '../lib/notifications/email-client';
import {
  buildSubscribeConfirmation,
  buildSubscribeConfirmationSubject,
} from '../lib/notifications/email-templates';

const VOTER_COOKIE = 'roadmap_voter_id';

export const server = {
  vote: defineAction({
    accept: 'form',
    input: z.object({
      featureRequestId: z.string().min(1, 'Feature request ID is required'),
    }),
    handler: async ({ featureRequestId }, { cookies }) => {
      const voterId = cookies.get(VOTER_COOKIE)?.value;
      if (!voterId) {
        return { success: false, error: 'Identity required. Please refresh the page and try again.' };
      }
      return recordVote(featureRequestId, voterId);
    },
  }),

  subscribe: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email('Please enter a valid email address'),
    }),
    handler: async ({ email }) => {
      const normalized = email.trim().toLowerCase();
      const result = await addSubscriber(normalized);
      if (result.success && isEmailServiceConfigured()) {
        await sendEmail(
          normalized,
          buildSubscribeConfirmationSubject(),
          buildSubscribeConfirmation(normalized)
        );
      }
      return result;
    },
  }),

  feedback: defineAction({
    accept: 'form',
    input: z.object({
      pagePath: z.string().min(1, 'Page path is required'),
      helpful: z.enum(['yes', 'no']),
      message: z.string().max(500).optional(),
    }),
    handler: async ({ pagePath, helpful, message }, { cookies }) => {
      const visitorId = cookies.get(VOTER_COOKIE)?.value;
      if (!visitorId) {
        return { success: false, error: 'Please refresh and try again.' };
      }
      return recordFeedback(pagePath, helpful, visitorId, message);
    },
  }),
};
```

You can omit `subscribe` and `feedback` if you only want roadmap voting. Copy the corresponding lib files only if you use them.

---

### Step 6: Copy Lib Files

**Votes (required for roadmap):**

- `src/lib/votes/elastic-votes.ts`

**Status (required for status page):**

Copy from `roadmap/src/lib/status/`:

- `elastic-client.ts`
- `status-config.ts`
- `elastic-status.ts`
- `fetch-status.ts`
- `mock-data.ts`
- `status-models.ts`
- `status-utils.ts`
- `capability-groups.ts`
- `status-labels.ts`
- `render-status-html.ts`

**Notifications (required for subscribe form):**

Copy from `roadmap/src/lib/notifications/`:

- `elastic-subscribers.ts`
- `email-client.ts`
- `email-templates.ts`
- `send-notifications.ts`
- `notification-state.ts`
- `maintenance-notification-state.ts`

**Feedback (optional):**

- `src/lib/feedback/elastic-feedback.ts`

---

### Step 7: Route Structure

Choose a route prefix to avoid clashes with existing docs. Example: `/roadmap` and `/roadmap/status`.

| Source (roadmap app) | Destination (your site) |
|---------------------|--------------------------|
| `src/pages/roadmap.astro` | `src/pages/roadmap/index.astro` |
| `src/pages/roadmap/status/index.astro` | `src/pages/roadmap/status/index.astro` |
| `src/pages/roadmap/status/workspaces/[id].astro` | `src/pages/roadmap/status/workspaces/[id].astro` |
| `src/pages/roadmap/status/incidents/[id].astro` | `src/pages/roadmap/status/incidents/[id].astro` |
| `src/pages/roadmap/status/external-systems.astro` | `src/pages/roadmap/status/external-systems.astro` |
| `src/pages/api/page-status-data.ts` | `src/pages/api/page-status-data.ts` |
| `src/pages/api/notify/run.ts` | `src/pages/api/notify/run.ts` |

Set `export const prerender = false` on all roadmap and status pages, and on the API routes.

**Path updates:** If your roadmap lives at `/roadmap`, update internal links (e.g. redirect targets in middleware) from `/roadmap` to your chosen path. The status page fetches from `/api/page-status-data` — keep that path.

---

### Step 8: Copy Components

**Roadmap:**

- `RoadmapList.astro`
- `FeatureRequestCard.astro`
- `Toast.astro`

**Status:**

- `status/StatusBadge.astro`
- `status/Capabilities.astro`
- `status/UptimeBar.astro`
- `status/SubscribeNotifications.astro`
- `status/StatusSkeleton.astro`

**Optional:**

- `PageFeedback.astro` — for “Was this helpful?” on pages

Update layout imports (e.g. `BaseLayout` → your `DocsLayout`) and any path references.

---

### Step 9: Layout and Navigation

Use your existing layout for roadmap and status pages:

```astro
---
import DocsLayout from '../layouts/DocsLayout.astro';
// ...
---

<DocsLayout title="Roadmap" description="What's coming soon">
  <!-- content -->
</DocsLayout>
```

Add nav links:

```html
<a href="/roadmap">Roadmap</a>
<a href="/roadmap/status">Status</a>
```

---

### Step 10: Styling

If you use Tailwind, the components should work with minimal changes. If you use custom CSS or Starlight, map the Tailwind classes to your design system or add a small roadmap-specific stylesheet.

---

## Migrating from the Old Setup

If you previously integrated using the **Node/Express backend**, **Vite proxy**, or **Astro DB**, apply these changes.

### Summary of Changes

| Before | After |
|--------|-------|
| Separate Node/Express backend on port 4000 | No backend; Astro queries Elasticsearch directly |
| Vite proxy `/api/status` → `localhost:4000` | No proxy; status uses `/api/page-status-data` |
| `api.ts` fetches from backend HTTP endpoints | `elastic-status.ts` uses `@elastic/elasticsearch` client |
| `PUBLIC_STATUS_API_URL` env var | Removed; use `ELASTICSEARCH_URL` |
| Astro DB for feature requests and votes | Content collection + Elasticsearch (`roadmap-votes` index) |
| `@astrojs/db` | Removed |

### Migration Steps

1. **Stop and remove the backend** — Stop `cd backend && npm start`; delete or ignore the `backend/` directory.

2. **Remove Vite proxy** — Delete any `proxy` config for `/api/status` from `astro.config.mjs`.

3. **Replace status lib files:**
   - Remove: `src/lib/status/api.ts`
   - Add: `elastic-client.ts`, `status-config.ts`, `elastic-status.ts`
   - Update `fetch-status.ts` to import from `elastic-status` (see `roadmap/src/lib/status/fetch-status.ts`).

4. **Update environment variables:**
   - Remove: `PUBLIC_STATUS_API_URL`
   - Add: `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY`, and index names (see [Environment Variables Reference](#environment-variables-reference)).

5. **Feature requests & votes (Astro DB → Content + Elasticsearch):**
   - Add `featureRequests` content collection and create Markdown files in `src/content/feature-requests/`.
   - Copy `src/lib/votes/elastic-votes.ts` and update `src/actions/index.ts` to use `recordVote()`.
   - Remove `@astrojs/db`, `db/config.ts`, db integration from config.
   - Add `ELASTICSEARCH_INDEX_ROADMAP_VOTES=roadmap-votes` to `.env`.

6. **DTO types** — If `render-status-html.ts` or `mock-data.ts` imported types from `api.ts`, move them to `status-models.ts` and update imports.

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `ELASTICSEARCH_URL` | Elasticsearch endpoint (e.g. `https://your-cluster.example.com:9200`) |
| `ELASTICSEARCH_API_KEY` | API key for authentication |
| `STATUS_ENVIRONMENT` | Label (e.g. `production`, `staging`) |
| `STATUS_TIME_WINDOW_MINUTES` | Time window for status aggregation (default: 5) |
| `ELASTICSEARCH_INDEX_CORE_SERVICES` | Index for core services |
| `ELASTICSEARCH_INDEX_WORKSPACES` | Index for workspaces |
| `ELASTICSEARCH_INDEX_EXTERNAL_SYSTEMS` | Index for external systems |
| `ELASTICSEARCH_INDEX_INCIDENTS` | Index for incidents |
| `ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE` | Index for scheduled maintenance |
| `ELASTICSEARCH_INDEX_ROADMAP_VOTES` | Index for roadmap votes (default: `roadmap-votes`) |
| `ELASTICSEARCH_INDEX_STATUS_SUBSCRIBERS` | Index for notification subscribers |
| `ELASTICSEARCH_INDEX_STATUS_NOTIFICATION_SENT` | Index for sent incident notifications |
| `ELASTICSEARCH_INDEX_STATUS_MAINTENANCE_NOTIFICATION_SENT` | Index for sent maintenance notifications |
| `ELASTICSEARCH_INDEX_PAGE_FEEDBACK` | Index for page feedback (optional) |
| `EMAIL_SERVICE_URL` | Internal email service URL |
| `EMAIL_SERVICE_API_KEY` | API key for email service |
| `EMAIL_SERVICE_PATH` | Email API path (default: `/send`) |
| `SITE_URL` | Production URL (sitemap, incident links in emails) |
| `NOTIFICATION_INCIDENT_WINDOW_MINUTES` | Window for incident notifications (default: 1440) |
| `NOTIFY_WEBHOOK_SECRET` | Optional secret for webhook auth |
| `PUBLIC_USE_MOCK_STATUS` | Set to `true` to use mock data (no Elasticsearch) |

See `roadmap/.env.example` for a full template.

---

## File Copy Reference

| Source (roadmap app) | Destination (your site) |
|----------------------|--------------------------|
| `src/middleware.ts` | `src/middleware.ts` |
| `src/content.config.ts` | Merge collections into your `content.config.ts` |
| `src/content/roadmap/*.md` | `src/content/roadmap/*.md` |
| `src/content/feature-requests/*.md` | `src/content/feature-requests/*.md` |
| `src/content/status/incidents/*.md` | `src/content/status/incidents/*.md` (optional) |
| `src/content/status/announcements/*.md` | `src/content/status/announcements/*.md` (optional) |
| `src/lib/votes/elastic-votes.ts` | `src/lib/votes/elastic-votes.ts` |
| `src/lib/status/*` | `src/lib/status/*` |
| `src/lib/notifications/*` | `src/lib/notifications/*` |
| `src/lib/feedback/elastic-feedback.ts` | `src/lib/feedback/elastic-feedback.ts` (optional) |
| `src/actions/index.ts` | Merge into `src/actions/index.ts` |
| `src/pages/roadmap.astro` | `src/pages/roadmap/index.astro` |
| `src/pages/roadmap/status/index.astro` | `src/pages/roadmap/status/index.astro` |
| `src/pages/roadmap/status/workspaces/[id].astro` | `src/pages/roadmap/status/workspaces/[id].astro` |
| `src/pages/roadmap/status/incidents/[id].astro` | `src/pages/roadmap/status/incidents/[id].astro` |
| `src/pages/roadmap/status/external-systems.astro` | `src/pages/roadmap/status/external-systems.astro` |
| `src/pages/api/page-status-data.ts` | `src/pages/api/page-status-data.ts` |
| `src/pages/api/notify/run.ts` | `src/pages/api/notify/run.ts` |
| `src/components/RoadmapList.astro` | `src/components/RoadmapList.astro` |
| `src/components/FeatureRequestCard.astro` | `src/components/FeatureRequestCard.astro` |
| `src/components/Toast.astro` | `src/components/Toast.astro` |
| `src/components/PageFeedback.astro` | `src/components/PageFeedback.astro` (optional) |
| `src/components/status/*` | `src/components/status/*` |

---

## Checklist

**Roadmap**

- [ ] `@astrojs/node` and `@elastic/elasticsearch` installed
- [ ] `src/middleware.ts` with voter cookie and form handling
- [ ] `roadmap` and `featureRequests` collections in `content.config.ts`
- [ ] `src/content/roadmap/*.md` and `src/content/feature-requests/*.md`
- [ ] `src/lib/votes/elastic-votes.ts` and vote action in `src/actions/index.ts`
- [ ] Roadmap page at `/roadmap` with `prerender: false`
- [ ] `ELASTICSEARCH_INDEX_ROADMAP_VOTES` set (default: `roadmap-votes`)

**Status page**

- [ ] `src/lib/status/` with all status lib files
- [ ] `shared` Vite alias pointing to `src/lib/status`
- [ ] `src/pages/api/page-status-data.ts`
- [ ] Status pages: `/roadmap/status`, workspaces, incidents, external-systems
- [ ] Status components: StatusBadge, Capabilities, UptimeBar, SubscribeNotifications, StatusSkeleton

**Notifications (optional)**

- [ ] `src/lib/notifications/*` and subscribe action
- [ ] `EMAIL_SERVICE_URL`, `EMAIL_SERVICE_API_KEY`, `SITE_URL`
- [ ] `src/pages/api/notify/run.ts`
- [ ] Cron or webhook calling `GET` or `POST /api/notify/run`

**General**

- [ ] Nav/sidebar links to `/roadmap` and `/roadmap/status`
- [ ] `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY` set
- [ ] `PUBLIC_USE_MOCK_STATUS=true` for local dev without Elasticsearch

---

## Deployment

- **Build:** No separate database setup. Feature requests are Markdown; votes and status use Elasticsearch.
- **Adapter:** Use a Node adapter (e.g. `@astrojs/node`) for serverless or standalone.
- **Elasticsearch:** Set `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY`. The `roadmap-votes` index is created on first vote.
- **Status:** Uses the same Elasticsearch cluster. If unavailable, the status page falls back to mock data when `PUBLIC_USE_MOCK_STATUS=true` or when the client catches errors.
- **Notifications:** Configure `EMAIL_SERVICE_URL` and `EMAIL_SERVICE_API_KEY`; schedule `curl https://your-site/api/notify/run` (e.g. every 5 minutes) or trigger via webhook.

---

## Related Docs

- [STATUS_PAGE_DATA.md](./STATUS_PAGE_DATA.md) — Data sources and how to update status content
- [MIGRATION_TO_COLLECTIONS.md](./MIGRATION_TO_COLLECTIONS.md) — Migrating existing content to Astro collections
