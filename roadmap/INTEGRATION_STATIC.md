# Static site migration: integration notes for the live codebase

Use this document when applying the same **phase 1 static** changes to an existing deployment that still has Elasticsearch, Astro Actions, API routes, or server rendering. It summarizes **what was removed**, **what was added or replaced**, and **what to verify** after the merge.

---

## 1. Goals of this migration

- **Output:** `output: 'static'` — deploy `dist/` to any static host (S3, CloudFront, Netlify static, GitHub Pages, etc.). No Node process, no serverless SSR adapter required for this app.
- **Removed:** Elasticsearch client and all server writes (votes, subscribers, feedback, status reads from ES), email notification job, Astro Actions, middleware, API routes.
- **Status hub:** Active issues, scheduled maintenance, and recent incidents are **Markdown** under `src/content/status/` (three collections). The old rich status dashboard sections were **removed from the hub HTML** only. Optional **demo** subsites (`/roadmap/status/workspaces/:id`, `/roadmap/status/external-systems`) import **`mock-data.ts` directly** (no `fetch-status` indirection).

---

## 2. `astro.config.mjs` — required changes

| Change | Reason |
|--------|--------|
| Set `output: 'static'` | Full static prerender; no hybrid SSR unless you add it back. |
| **Remove** `@astrojs/node` import and `adapter: node({ ... })` | Static export does not use the Node adapter. |
| Add `redirects` as needed | Example: `{ '/requests': '/roadmap' }` if you had a redirect-only route. |
| Keep `site` / `trailingSlash` / MDX / sitemap per your needs | Unchanged conceptually. |

If your live site uses `base: '/some-prefix/'`, keep it; links for the status hub should go through your existing `withBase()` (or equivalent) helper.

---

## 3. `package.json` — dependencies to remove

Remove at minimum:

- `@elastic/elasticsearch`
- `@astrojs/node`

Run `npm install` after editing so the lockfile matches.

---

## 4. Files and folders to delete (server / backend features)

Delete these paths if they exist in your repo (names match this project’s layout):

| Path | What it did |
|------|----------------|
| `src/actions/index.ts` (or entire `src/actions/`) | Astro Actions: `vote`, `subscribe`, `feedback`. |
| `src/middleware.ts` | Voter cookie + form POST handling for actions. |
| `src/pages/api/page-status-data.ts` | API route that returned status HTML for client `fetch`. |
| `src/pages/api/notify/run.ts` | Cron/webhook email notification runner. |
| `src/lib/status/elastic-client.ts` | Elasticsearch client singleton. |
| `src/lib/status/elastic-status.ts` | ES queries for status telemetry. |
| `src/lib/status/status-config.ts` | ES index names and env wiring (if only used by ES). |
| `src/lib/votes/elastic-votes.ts` | Vote persistence in ES. |
| `src/lib/feedback/elastic-feedback.ts` | Page feedback persistence in ES. |
| Entire `src/lib/notifications/` | Subscribers, email client, templates, send job, dedupe state. |
| `src/components/PageFeedback.astro` | “Was this helpful?” (was ES-backed). |
| `src/components/status/SubscribeNotifications.astro` | Email subscribe form. |
| `src/components/Toast.astro` | Vote feedback toasts (if unused after roadmap change). |
| `src/components/status/StatusSkeleton.astro` | If status hub no longer client-fetches HTML. |
| `src/pages/requests/index.astro` | If replaced by `redirects` in config. |

**Grep your codebase** for imports of deleted modules (`astro:actions`, `elastic-client`, `elastic-status`, `notifications`, `elastic-votes`) and remove or rewrite those call sites.

---

## 5. Content collections (`src/content.config.ts`)

**Replace** ad-hoc or legacy status collections with three collections aligned to folders:

- `statusActiveIncidents` → `./src/content/status/active-incidents`
- `statusMaintenance` → `./src/content/status/maintenance`
- `statusRecentIncidents` → `./src/content/status/recent-incidents`

Remove obsolete definitions such as `statusIncidents` / `statusAnnouncements` that pointed at old paths (`incidents/`, `announcements/`).

Schemas and frontmatter fields are documented in the root [`README.md`](../README.md) (Status page Markdown section). Copy [`content.config.ts`](src/content.config.ts) from this repo as the source of truth for Zod shapes.

**On disk:** create the three folders and add at least one `.md` file each so the build does not break empty-loader rules (this repo ships examples).

---

## 6. New or heavily changed library code

| File | Role |
|------|------|
| [`src/lib/status/status-content.ts`](src/lib/status/status-content.ts) | `getCollection()` → maps entries to `IncidentSummary`, `ScheduledMaintenance`, `ResolvedIncidentEntry`; sorting; optional plain-text excerpt from body when `description` is omitted. |
| [`src/lib/status/render-status-html.ts`](src/lib/status/render-status-html.ts) | **Slim renderer:** only intro + Active issues + Scheduled maintenance + Recent incidents. Accepts `incidentDetailPath(id)` so incident links respect `base`. **No** capabilities, core services, workspaces, external systems, uptime, or old summary banner. |

---

## 7. `mock-data.ts` (no `fetch-status.ts`)

- This repo **does not** use `src/lib/status/fetch-status.ts`. Workspace and external-systems pages import **`mock-data.ts` directly** (`MOCK_WORKSPACES`, `MOCK_EXTERNAL_SYSTEMS`, `getMockWorkspaceFeatures`). `getMockUptime()` remains for the optional `UptimeBar.astro` component if you use it elsewhere.
- **`mock-data.ts`:** Contains only mock structs still needed by those subsites (and `getMockUptime`). Hub incident/maintenance/recent data lives in Markdown, not here.

---

## 8. Pages to update

| Page | Changes |
|------|---------|
| [`src/pages/roadmap/status/index.astro`](src/pages/roadmap/status/index.astro) | Load the three collections via `status-content` helpers; call `renderStatusContent` with `incidentDetailPath: (id) => withBase(\`roadmap/status/incidents/${id}\`)`. |
| [`src/pages/roadmap/status/workspaces/[id].astro`](src/pages/roadmap/status/workspaces/[id].astro), [`external-systems.astro`](src/pages/roadmap/status/external-systems.astro) | Import from [`mock-data.ts`](src/lib/status/mock-data.ts) only (no `fetch-status`). |
| [`src/pages/roadmap/status/incidents/[id].astro`](src/pages/roadmap/status/incidents/[id].astro) | `getStaticPaths` from `getCollection('statusActiveIncidents')`; `render(entry)` for body; **no** `fetchIncidentById` from mock. |
| [`src/pages/roadmap.astro`](src/pages/roadmap.astro) | Remove voting, actions, cookies, Toast; sort feature requests without vote counts. |
| [`src/components/FeatureRequestCard.astro`](src/components/FeatureRequestCard.astro) | Remove vote form; title, description, status only. |
| [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro) | Remove `<PageFeedback />` and related imports. |
| [`src/pages/index.astro`](src/pages/index.astro), [`MdxDocLayout.astro`](src/layouts/MdxDocLayout.astro) | Update meta copy (no “vote” / live ES promises if inaccurate). |

**Dynamic routes:** Incident detail must implement `getStaticPaths()` returning every `id` from active-incident Markdown so `output: 'static'` can generate HTML files.

---

## 9. Environment variables

- Trim **`.env.example`**: remove `ELASTICSEARCH_*`, `EMAIL_*`, `NOTIFY_*`, notification index names, etc., unless another part of the monorepo still needs them.
- **Build-time:** optional `SITE_URL` for canonical URLs / sitemap (see `astro.config` `site`).

---

## 10. Deployment checklist (live site)

1. Merge dependency removals; run `npm ci` / `npm install`.
2. Remove deleted files; fix all imports until `npm run build` succeeds with `output: 'static'`.
3. Add `src/content/status/**` Markdown and validate collections.
4. Confirm **no** remaining `astro:actions`, `@elastic/elasticsearch`, or `src/pages/api/*` usage for this app (unless you intentionally keep other routes in a monorepo).
5. Upload **`dist/`** only; no `node server`, no `HOST`/SSR env for this Astro app.
6. If using a **subpath** `base`, test incident links and nav with `withBase()`.

---

## 11. Relationship to older docs

[`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md), [`ELASTICSEARCH_GUIDE.md`](ELASTICSEARCH_GUIDE.md), and [`EMAIL_NOTIFICATIONS_GUIDE.md`](EMAIL_NOTIFICATIONS_GUIDE.md) describe the **pre-static** architecture. Treat them as historical unless you reintroduce a server phase. This file reflects the **current** static + MD status hub in this repository.

---

## 12. Quick file checklist (copy/paste)

**Delete (if present):**  
`src/actions/*`, `src/middleware.ts`, `src/pages/api/page-status-data.ts`, `src/pages/api/notify/run.ts`, `src/lib/status/elastic-client.ts`, `src/lib/status/elastic-status.ts`, `src/lib/status/status-config.ts`, `src/lib/votes/*`, `src/lib/feedback/*`, `src/lib/notifications/*`, `PageFeedback.astro`, `SubscribeNotifications.astro`, optional `Toast.astro`, `StatusSkeleton.astro`.

**Add:**  
`src/content/status/active-incidents/*.md`, `maintenance/*.md`, `recent-incidents/*.md`, `src/lib/status/status-content.ts`, slim `render-status-html.ts`.

**Rewrite:**  
`content.config.ts`, `astro.config.mjs`, `roadmap/status/index.astro`, `roadmap/status/incidents/[id].astro`, `mock-data.ts` (trim to only mocks you still need), `roadmap.astro`, `FeatureRequestCard.astro`, `BaseLayout.astro`.

**Do not add** `fetch-status.ts` — use `mock-data.ts` and/or Markdown collections directly.
