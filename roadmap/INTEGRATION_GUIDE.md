# Integration and deployment guide: roadmap and status page

This document is the **single reference** for merging the roadmap and status features into your Astro site and deploying them safely. It includes every **Astro server-side** requirement (adapter, middleware, API routes, Actions, and on-demand pages) so expectations stay aligned with the architecture.

If anything here conflicts with an older note elsewhere in the repo, **this file wins**.

---

## Table of contents

1. [What the refactor changed (and what it did not)](#1-what-the-refactor-changed-and-what-it-did-not)
2. [Server-side surface area (complete inventory)](#2-server-side-surface-area-complete-inventory)
3. [Who this guide is for](#3-who-this-guide-is-for)
4. [Prerequisites](#4-prerequisites)
5. [Integration: dependencies and Astro config](#5-integration-dependencies-and-astro-config)
6. [Integration: content collections](#6-integration-content-collections)
7. [Integration: middleware](#7-integration-middleware)
8. [Integration: Actions](#8-integration-actions)
9. [Integration: libraries to copy](#9-integration-libraries-to-copy)
10. [Integration: pages and API routes](#10-integration-pages-and-api-routes)
11. [Integration: components](#11-integration-components)
12. [Integration: layout, navigation, styling](#12-integration-layout-navigation-styling)
13. [Environment variables](#13-environment-variables)
14. [File copy checklist](#14-file-copy-checklist)
15. [Deployment overview](#15-deployment-overview)
16. [Deployment: @astrojs/node (standalone)](#16-deployment-astrojsnode-standalone)
17. [Deployment: Vercel](#17-deployment-vercel)
18. [Deployment: Netlify](#18-deployment-netlify)
19. [Deployment: incident notification job](#19-deployment-incident-notification-job)
20. [Post-deploy verification](#20-post-deploy-verification)
21. [Migrating from the old Express backend or Astro DB](#21-migrating-from-the-old-express-backend-or-astro-db)
22. [Troubleshooting](#22-troubleshooting)
23. [Related documentation](#23-related-documentation)

---

## 1. What the refactor changed (and what it did not)

| Statement | Accurate? |
|-----------|-----------|
| **There is no second application** (no separate Express/Node service on another port, no Vite proxy to a status backend). | **Yes.** One Astro project handles docs, roadmap, status UI, and server endpoints. |
| **Nothing runs server-side.** | **No.** voting, subscribe, feedback, status HTML generation, and notification job endpoints all run **inside Astro’s server runtime** on each request (or on each invocation of a serverless function, depending on the host). |
| **You can deploy only static HTML** (e.g. upload `dist/` to a bucket with no Node/serverless). | **No**, not while keeping voting, live status from Elasticsearch, Actions, and `/api/*` as implemented in this repo. Those features require a **hosted Astro server** (Node process, or a platform adapter that provides serverless SSR). |

**Plain-language summary:** the refactor removed the **extra backend service**. It did **not** remove the need for a **server**. The “backend” is now **your Astro app’s server bundle**, produced by an **adapter**.

---

## 2. Server-side surface area (complete inventory)

Everything below requires an **adapter** and a hosting model where **on-demand rendering** and **endpoints** work. In Astro 5, with an adapter installed, most pages can still **prerender** while specific routes stay **server-rendered** (`prerender = false`) or implemented as **API routes**.

### 2.1 Middleware (`src/middleware.ts`)

Runs on **every HTTP request** into the app (unless your host excludes certain paths—uncommon).

| Responsibility | Notes |
|----------------|--------|
| Sets `roadmap_voter_id` cookie if missing | Used for identity-aware voting and page feedback visitor id. |
| Intercepts **vote** and **subscribe** form posts | Uses `getActionContext` from `astro:actions`, runs the handler, stores the action result, **redirects** back to `Referer` (or `/roadmap`). |

**Merge caveat:** if your site already has `src/middleware.ts`, you must **merge** this logic into yours (same `onRequest` pipeline, or compose helpers). There must be only one middleware entry.

### 2.2 Astro Actions (`src/actions/index.ts`)

Server-only handlers invoked from the browser (forms use `method="POST"` and `action={actions.vote}` etc.).

| Action | Purpose | External systems |
|--------|---------|------------------|
| `vote` | One vote per feature per cookie id | Writes to Elasticsearch (`roadmap-votes` index by default). |
| `subscribe` | Email signup for status notifications | Writes to Elasticsearch subscribers index; may call email service for confirmation. |
| `feedback` | “Was this helpful?” | Writes to Elasticsearch page-feedback index (if configured). |

**Merge caveat:** if you already export `server` from actions, **merge** the `vote` / `subscribe` / `feedback` definitions into your existing object (and resolve naming conflicts).

### 2.3 On-demand pages (`export const prerender = false`)

In the reference `roadmap` app these files use on-demand rendering:

| File | URL (default layout) | Server work |
|------|----------------------|-------------|
| `src/pages/roadmap.astro` | `/roadmap` | `getCollection`, `getVoteCounts`, `getVotedByMe`, `Astro.getActionResult`, cookies |
| `src/pages/requests/index.astro` | `/requests` | Redirect to `/roadmap` |
| `src/pages/roadmap/status/index.astro` | `/roadmap/status` | Shell + subscribe result; client fetches `/api/page-status-data` |
| `src/pages/roadmap/status/workspaces/[id].astro` | `/roadmap/status/workspaces/:id` | Status data for one workspace |
| `src/pages/roadmap/status/incidents/[id].astro` | `/roadmap/status/incidents/:id` | Incident detail |
| `src/pages/roadmap/status/external-systems.astro` | `/roadmap/status/external-systems` | External systems view |

If you move `roadmap.astro` to `src/pages/roadmap/index.astro`, the URL is still `/roadmap`; keep `prerender = false` on that file.

### 2.4 API routes (`src/pages/api/**`)

| File | Methods | Purpose |
|------|---------|--------|
| `src/pages/api/page-status-data.ts` | `GET` | Loads all status slices via `fetch-status` (Elasticsearch or mock), returns **HTML** fragment for the status page client script. |
| `src/pages/api/notify/run.ts` | `GET`, `POST` | Runs scheduled notification delivery (`runNotificationDelivery`). Optional `Authorization: Bearer <NOTIFY_WEBHOOK_SECRET>` on `POST`. |

Both files **must** keep `export const prerender = false`.

### 2.5 Elasticsearch and email (server runtime only)

Uses **`ELASTICSEARCH_URL`** and **`ELASTICSEARCH_API_KEY`** (and other index env vars) **only in server code**—never exposed as `PUBLIC_*`. The browser talks only to **your origin** (`/api/...`, Actions), not directly to Elasticsearch.

Details: [ELASTICSEARCH_GUIDE.md](./ELASTICSEARCH_GUIDE.md), [EMAIL_NOTIFICATIONS_GUIDE.md](./EMAIL_NOTIFICATIONS_GUIDE.md).

### 2.6 What stays build-time / static

- **Content collections** are built and validated at build time; Markdown lives in the repo.
- **Docs pages** that omit `prerender = false` are **prerendered** like a normal Astro site, as long as you do not need request-only data on them.

---

## 3. Who this guide is for

| Situation | Where to start |
|-----------|----------------|
| New integration into an existing Astro site | Sections [5](#5-integration-dependencies-and-astro-config)–[12](#12-integration-layout-navigation-styling), then [15](#15-deployment-overview)–[20](#20-post-deploy-verification). |
| You used the old Express + proxy setup or Astro DB | Section [21](#21-migrating-from-the-old-express-backend-or-astro-db), then the integration steps. |
| Your site does not use content collections yet | [Astro: Content collections](https://docs.astro.build/en/guides/content-collections/) and section [6](#6-integration-content-collections) below. |

---

## 4. Prerequisites

- **Astro** 4.15+ (Actions) or **5.x** (this repo uses 5.x patterns).
- **Node.js** 18+ at build time; match your host’s Node version when possible.
- **Exactly one** official **adapter** in `astro.config`, appropriate for **production** (see [15](#15-deployment-overview)).
- **Network path** from your deployed server to **Elasticsearch** (allowlist IP/VPC or HTTPS endpoint), unless you rely on **`PUBLIC_USE_MOCK_STATUS=true`** (status only, mock data).

---

## 5. Integration: dependencies and Astro config

### 5.1 Packages

```bash
npm install @astrojs/sitemap @elastic/elasticsearch
```

Add **one** adapter package for where you deploy, for example:

- **Node / Docker / many traditional hosts:** `npm install @astrojs/node`
- **Vercel:** `npm install @astrojs/vercel` (do not use `@astrojs/node` as the deploy adapter on Vercel)
- **Netlify:** `npm install @astrojs/netlify`

If you already have an adapter, **do not add a second**—merge new dependencies only.

Optional but common for this UI:

```bash
npx astro add tailwind
```

### 5.2 `astro.config.mjs` (baseline pattern)

```js
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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

**Replace `node(...)`** with `vercel()`, `netlify()`, etc., when that matches production.

**Do not** add a Vite **`server.proxy`** for `/api/status`. Status is served from **`/api/page-status-data`** on the same app.

### 5.3 TypeScript paths

If you use the `shared/*` imports from status libraries, add paths in `tsconfig.json`:

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

## 6. Integration: content collections

Create or extend **`src/content.config.ts`** at the project root (same level Astro expects).

Reference schema from this repo: `roadmap/src/content.config.ts` — collections:

- `roadmap` → `src/content/roadmap/**/*.md`
- `featureRequests` → `src/content/feature-requests/**/*.md`
- `statusIncidents` → `src/content/status/incidents/**/*.md` (optional)
- `statusAnnouncements` → `src/content/status/announcements/**/*.md` (optional)

Example frontmatter for feature requests (see `roadmap/src/content/feature-requests/*.md`):

```yaml
---
id: "req-example"
title: "Example request"
description: "Short description"
status: "pending"
---
```

---

## 7. Integration: middleware

Copy the behavior from `roadmap/src/middleware.ts`:

- Cookie `roadmap_voter_id`
- Vote and subscribe **form** handling via `getActionContext` + redirect

**If you already have middleware:** combine into a single `onRequest` (or export a shared helper) so cookie handling and action handling still run. Pay attention to ordering relative to auth or locale middleware.

**Path hard-coding:** default fallback redirect uses `/roadmap`; change if your roadmap lives elsewhere.

---

## 8. Integration: Actions

Copy or merge `roadmap/src/actions/index.ts`.

Minimum for **roadmap only:** `vote` action + `recordVote` from `elastic-votes.ts`.

For **status subscribe** section:

- `subscribe` + notification helpers and Elasticsearch subscriber modules.

For **page feedback** component:

- `feedback` + `elastic-feedback.ts`.

---

## 9. Integration: libraries to copy

### Votes (roadmap voting)

- `src/lib/votes/elastic-votes.ts`

### Status (status page and `page-status-data`)

From `roadmap/src/lib/status/`:

- `elastic-client.ts`, `status-config.ts`, `elastic-status.ts`, `fetch-status.ts`, `mock-data.ts`
- `status-models.ts`, `status-utils.ts`, `capability-groups.ts`, `status-labels.ts`, `render-status-html.ts`

### Notifications (subscribe + `/api/notify/run`)

From `roadmap/src/lib/notifications/`:

- `elastic-subscribers.ts`, `email-client.ts`, `email-templates.ts`
- `send-notifications.ts`, `notification-state.ts`, `maintenance-notification-state.ts`

### Feedback (optional)

- `src/lib/feedback/elastic-feedback.ts`

---

## 10. Integration: pages and API routes

### Pages

| From `roadmap/src/pages/` | Suggested location in your app | `prerender` |
|---------------------------|--------------------------------|-------------|
| `roadmap.astro` | `src/pages/roadmap/index.astro` (or keep `roadmap.astro` for `/roadmap`) | `false` |
| `requests/index.astro` | optional; redirects to `/roadmap` | `false` |
| `roadmap/status/index.astro` | same path under `src/pages/` | `false` |
| `roadmap/status/workspaces/[id].astro` | same | `false` |
| `roadmap/status/incidents/[id].astro` | same | `false` |
| `roadmap/status/external-systems.astro` | same | `false` |

### API routes (required for current status UX)

| File | Must copy? |
|------|------------|
| `src/pages/api/page-status-data.ts` | **Yes**, unless you redesign status to avoid it |
| `src/pages/api/notify/run.ts` | Only if you use email notifications |

**Client contract:** `roadmap/status/index.astro` expects `GET /api/page-status-data` to return **HTML** (`text/html`). If you change the path, update the `fetch` URL in that page’s `<script>`.

---

## 11. Integration: components

**Roadmap**

- `RoadmapList.astro`, `FeatureRequestCard.astro`, `Toast.astro`

**Status**

- `status/StatusBadge.astro`, `Capabilities.astro`, `UptimeBar.astro`
- `SubscribeNotifications.astro`, `StatusSkeleton.astro`

**Optional**

- `PageFeedback.astro`

Switch layout imports from `BaseLayout.astro` to your site’s layout as needed.

---

## 12. Integration: layout, navigation, styling

- Wrap roadmap and status pages in your shared layout.
- Add navigation links, for example `/roadmap` and `/roadmap/status`.
- Tailwind utility classes are used heavily; align with your design system if you are not on Tailwind.

---

## 13. Environment variables

See **`roadmap/.env.example`** for the authoritative list.

**Critical for server behavior**

| Variable | Role |
|----------|------|
| `ELASTICSEARCH_URL` | Elasticsearch endpoint |
| `ELASTICSEARCH_API_KEY` | Server-only auth |
| `ELASTICSEARCH_INDEX_*` | Index names (core services, workspaces, incidents, votes, subscribers, etc.) |
| `SITE_URL` | Canonical site URL (sitemap, emails) |
| `PUBLIC_USE_MOCK_STATUS` | When `true`, status fetch uses mock data (no ES required for **status** paths) |

**Email / notifications (optional)**

| Variable | Role |
|----------|------|
| `EMAIL_SERVICE_URL`, `EMAIL_SERVICE_API_KEY` | Outbound mail for subscribe confirm and incidents |
| `NOTIFY_WEBHOOK_SECRET` | Protects `POST /api/notify/run` |

Set these on the **hosting provider** (dashboard or secrets), not only in local `.env`, for production.

**Operational deep dives:** [ELASTICSEARCH_GUIDE.md](./ELASTICSEARCH_GUIDE.md) (cluster connectivity, index names, field expectations, query semantics) and [EMAIL_NOTIFICATIONS_GUIDE.md](./EMAIL_NOTIFICATIONS_GUIDE.md) (HTTP email service contract, environment variables, scheduling `/api/notify/run`).

---

## 14. File copy checklist

| Source in `roadmap/` | Destination in your app |
|----------------------|-------------------------|
| `src/middleware.ts` | merge into your `src/middleware.ts` |
| `src/content.config.ts` | merge collections |
| `src/content/roadmap/**` | `src/content/roadmap/**` |
| `src/content/feature-requests/**` | `src/content/feature-requests/**` |
| `src/content/status/**` | optional |
| `src/lib/votes/**` | `src/lib/votes/**` |
| `src/lib/status/**` | `src/lib/status/**` |
| `src/lib/notifications/**` | if using subscribe / notify job |
| `src/lib/feedback/**` | optional |
| `src/actions/index.ts` | merge |
| `src/pages/roadmap.astro` or `roadmap/**` | per section 10 |
| `src/pages/api/page-status-data.ts` | same path recommended |
| `src/pages/api/notify/run.ts` | if using notifications |
| `src/components/**` (roadmap + status) | merge |

---

## 15. Deployment overview

1. With **an adapter**, running **`astro build`** produces:

- **Prerendered** assets for pages that do not opt out.
- A **server bundle** for on-demand pages, Actions, and `/api/*` routes.

2. Your host must run that server (Node process, or the platform’s serverless SSR).

3. You must inject **production environment variables** so Elasticsearch and email work.

| Platform | Adapter package | Typical pattern |
|----------|-----------------|-----------------|
| VM, Docker, bare metal, many “Node” PaaS | `@astrojs/node` | Long-lived Node process |
| Vercel | `@astrojs/vercel` | Serverless functions for SSR/API |
| Netlify | `@astrojs/netlify` | Netlify Functions for SSR/API |

**Elasticsearch:** ensure outbound HTTPS (or VPC routing) is allowed from the runtime to your cluster.

---

## 16. Deployment: @astrojs/node (standalone)

1. **Build**

   ```bash
   npm run build
   ```

2. **Artifacts** — Astro emits a **client** folder and a **server** folder under `dist/` (exact layout is versioned; see [Node adapter docs](https://docs.astro.build/en/guides/integrations-guide/node/)).

3. **Runtime** — run the server entry with Node (exact command is in the adapter docs / build output). Example pattern:

   ```bash
   node ./dist/server/entry.mjs
   ```

   Your platform should set `PORT` (or your app reads `process.env.PORT`).

4. **Environment** — set all server variables from section [13](#13-environment-variables) in the process environment or secret manager.

5. **Do not** deploy only static files if you need voting or `/api/page-status-data`. Deploy the **server** output as well.

---

## 17. Deployment: Vercel

1. **`npm install @astrojs/vercel`**; in `astro.config`, use `adapter: vercel({ ... })` per [Vercel adapter docs](https://docs.astro.build/en/guides/integrations-guide/vercel/).

2. Set environment variables in the Vercel project settings (Production / Preview).

3. Confirm **Elasticsearch** is reachable from Vercel’s serverless region (firewall / IP allowlist may block).

4. Connect the repo and deploy; `astro build` runs on Vercel.

---

## 18. Deployment: Netlify

1. **`npm install @astrojs/netlify`**; use `adapter: netlify()` per [Netlify adapter docs](https://docs.astro.build/en/guides/integrations-guide/netlify/).

2. Set environment variables in Netlify UI.

3. Confirm network path to Elasticsearch from Netlify Functions.

---

## 19. Deployment: incident notification job

The endpoint **`/api/notify/run`** runs `runNotificationDelivery()`:

- **`GET`** — no auth in the reference app (protect with network rules or front-door auth in production).
- **`POST`** — if `NOTIFY_WEBHOOK_SECRET` is set, require header `Authorization: Bearer <secret>`.

Schedule (cron), for example every few minutes:

```bash
curl -sS "https://YOUR_DOMAIN/api/notify/run"
```

Or `POST` with Bearer token if the secret is configured.

---

## 20. Post-deploy verification

| Check | How |
|-------|-----|
| Prerendered docs | Open existing static pages; confirm they still load. |
| Roadmap | Visit `/roadmap` (or your path); vote; confirm duplicate vote is rejected. |
| Status | Visit `/roadmap/status`; confirm content loads (or mock when `PUBLIC_USE_MOCK_STATUS=true`). |
| Status API | `curl -I https://YOUR_DOMAIN/api/page-status-data` → `200` and `text/html`. |
| Notify job | Hit `/api/notify/run` in a safe environment; inspect JSON response. |

---

## 21. Migrating from the old Express backend or Astro DB

| Before | After |
|--------|-------|
| Express (or similar) on another port | No separate service; Elasticsearch from Astro server code |
| `PUBLIC_STATUS_API_URL` + HTTP client | `ELASTICSEARCH_URL` + `@elastic/elasticsearch` |
| Astro DB for requests/votes | Markdown `featureRequests` + Elasticsearch `roadmap-votes` |
| Vite `proxy` for `/api/status` | Remove proxy; use `/api/page-status-data` |

Steps:

1. Remove backend process from deploy and delete proxy config.
2. Replace old `api.ts` with `elastic-client`, `status-config`, `elastic-status`; align `fetch-status.ts` with this repo.
3. Move feature requests to content collection; add `elastic-votes.ts` and vote Action.
4. Remove `@astrojs/db` if present.
5. Migrate env vars per section [13](#13-environment-variables).

---

## 22. Troubleshooting

| Symptom | Likely cause | Direction |
|---------|--------------|-----------|
| Build: adapter required | SSR pages or API routes without adapter | Install platform adapter; add to `astro.config` |
| Two adapters configured | Merge added `node` while host needs `vercel` | Exactly one `adapter` |
| 404 on `/api/page-status-data` | Static-only deploy or wrong base path | Ensure server output is deployed; check `base` in config |
| Votes never persist | ES credentials or index env wrong | Check server env and logs |
| Status empty but no error | `PUBLIC_USE_MOCK_STATUS=true` or ES returned empty | Verify env |

---

## 23. Related documentation

- [STATUS_PAGE_DATA.md](./STATUS_PAGE_DATA.md) — what comes from Elasticsearch vs Markdown vs forms
- [ELASTICSEARCH_GUIDE.md](./ELASTICSEARCH_GUIDE.md) — Elasticsearch indices, fields, queries, and verification
- [EMAIL_NOTIFICATIONS_GUIDE.md](./EMAIL_NOTIFICATIONS_GUIDE.md) — email HTTP service, subscribers, and `/api/notify/run`
- [Astro: Content collections](https://docs.astro.build/en/guides/content-collections/) — adopting content collections
- [Astro: on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) — adapters and `prerender`
- [Astro: server endpoints](https://docs.astro.build/en/guides/endpoints/) — `/api` routes
