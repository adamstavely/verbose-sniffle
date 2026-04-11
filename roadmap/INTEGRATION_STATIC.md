# Static site migration: integration notes for the live codebase

**Read this document first** if you are migrating an existing deployment from Elasticsearch, Astro Actions, API routes, or any SSR adapter to a **fully static** Astro build.

---

## Important: do not use the old integration guides for static-only deployment

The following files in this repository describe the **previous server-backed** architecture (adapters, middleware, Actions, Elasticsearch, email jobs). **Do not follow their deployment or merge instructions** when your goal is static-only hosting:

- [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) — assumes an Astro **adapter**, on-demand routes, and server runtime.
- [`ELASTICSEARCH_GUIDE.md`](ELASTICSEARCH_GUIDE.md) — operational reference for Elasticsearch indices and queries.
- [`EMAIL_NOTIFICATIONS_GUIDE.md`](EMAIL_NOTIFICATIONS_GUIDE.md) — subscribe flow and `/api/notify/run` (removed in static phase).

Use those guides only if you **reintroduce** a server phase. **This file** (`INTEGRATION_STATIC.md`) matches the **current** static + Markdown status hub in this repo.

---

## Scope and path roots

- All paths like `src/…` are relative to the **Astro project root** (the directory that contains `astro.config.mjs`).
- In this repository, that root is **`roadmap/`**. If your app lives in a monorepo subfolder, apply the same paths under that folder.
- Internal links below use paths from the project root (e.g. [`src/content.config.ts`](src/content.config.ts)).

---

## 1. Goals of this migration

- **Output:** `output: 'static'` — deploy `dist/` to any static host (S3 + CloudFront, Netlify static assets, GitHub Pages, nginx, etc.). **No** Node process, **no** serverless SSR adapter on the host for this app.
- **Removed:** Elasticsearch client and all server writes (votes, subscribers, feedback, status reads from ES), email notification job, Astro Actions, middleware, API routes.
- **Status hub:** Active issues, scheduled maintenance, and recent incidents come from **Markdown** under `src/content/status/` (three content collections). The old rich hub sections (capabilities table, core services, workspaces grid on the hub, external systems preview, 90-day uptime, global summary banner from telemetry) were **removed from the hub HTML**.
- **Optional demo subsites:** `/roadmap/status/workspaces/:id` and `/roadmap/status/external-systems` read **`mock-data.ts` only** (this repo does **not** ship `fetch-status.ts`).

---

## 2. Verification commands (“green light” before merge)

Run these from the Astro project root (adjust `src` if your tree differs). **Expected for static-only:** no server output, no Actions, no API folder, no ES imports.

```bash
# Must not request server or hybrid output (unless intentional)
rg "output:\s*['\"]server['\"]|output:\s*['\"]hybrid['\"]" astro.config.*

# Static-only: no adapter block
rg "adapter\s*:" astro.config.*

# No Actions
rg "astro:actions|getActionResult|defineAction" src/

# No Elasticsearch integration in app source
rg "@elastic/elasticsearch|elastic-client|elastic-status" src/

# No forced SSR pages (each must be removed or converted to static data)
rg "prerender\s*=\s*false" src/pages

# No API routes for this app
ls src/pages/api 2>/dev/null || true
```

Interpretation:

- **`adapter:`** — For static-only, the config should **omit** `adapter` entirely. If your search finds one, remove it and any matching npm dependency (`@astrojs/node`, `@astrojs/vercel`, etc.) unless another package in the same repo requires it (monorepo caveat).
- **`src/pages/api`** — Should not exist for this standalone app. If present, delete or move endpoints behind a different service.

---

## 3. `astro.config.mjs` — explicit checklist

| Requirement | Static-only notes |
|-------------|-------------------|
| `output: 'static'` | **Required.** Full prerender; all pages must be buildable without a server. |
| **No** `adapter` | **Required** for pure static hosting. Node / Vercel / Netlify adapters produce a server or serverless bundle; not needed if you only upload `dist/` as static files. |
| `site` | Optional; often set via `SITE_URL` at build time for sitemap and canonical URLs. |
| `base` | Optional; use if the site is served under a subpath; pair with a `withBase()` helper for nav and incident links. |
| `trailingSlash` | Project choice (this repo uses `'never'`). |
| `redirects` | Optional; e.g. `{ '/requests': '/roadmap' }`. Astro emits static redirect pages for many hosts; see [Redirects and static hosting](#13-redirects-and-static-hosting). |
| `integrations` | This repo: `@astrojs/mdx`, `@astrojs/sitemap` — both fine for static. Tailwind via Vite plugin is build-time only. |

**Build vs runtime:** Using `import path from 'node:path'` (or similar) inside `astro.config.mjs` only affects **the machine that runs `npm run build`**. The **production host** serving `dist/` does not need Node.

---

## 4. `package.json` — dependencies to remove

Remove at minimum:

- `@elastic/elasticsearch`
- `@astrojs/node` (and any other SSR adapter you no longer use)

Run `npm install` so `package-lock.json` matches.

---

## 5. Files and folders to delete (server / backend features)

Delete these paths if they exist (relative to project `src/`):

| Path | What it did |
|------|-------------|
| `src/actions/index.ts` (or entire `src/actions/`) | Astro Actions: `vote`, `subscribe`, `feedback`. |
| `src/middleware.ts` | Voter cookie + form POST handling for Actions. |
| `src/pages/api/page-status-data.ts` | API route returning status HTML for client `fetch`. |
| `src/pages/api/notify/run.ts` | Scheduled email notification runner. |
| `src/lib/status/elastic-client.ts` | Elasticsearch client. |
| `src/lib/status/elastic-status.ts` | ES queries for status telemetry. |
| `src/lib/status/status-config.ts` | ES index names and env wiring (when only used by ES). |
| `src/lib/status/fetch-status.ts` | **Removed in this repo** — replaced by Markdown + direct `mock-data` imports. |
| `src/lib/votes/elastic-votes.ts` | Vote persistence in ES. |
| `src/lib/feedback/elastic-feedback.ts` | Page feedback persistence in ES. |
| Entire `src/lib/notifications/` | Subscribers, email client, templates, send job, dedupe state. |
| `src/components/PageFeedback.astro` | “Was this helpful?” (was ES-backed). |
| `src/components/status/SubscribeNotifications.astro` | Email subscribe form. |
| `src/components/Toast.astro` | Vote feedback toasts (if unused after roadmap change). |
| `src/components/status/StatusSkeleton.astro` | Loading shell when hub used client `fetch` for HTML. |
| `src/pages/requests/index.astro` | If replaced by `redirects` in `astro.config`. |

After deletion, **grep** for imports of removed modules and fix call sites.

---

## 6. Dynamic routes matrix (required for `output: 'static'`)

Every `[param]` route must implement `getStaticPaths()` so Astro can emit HTML at build time.

| Route file | `params` | Data source for `getStaticPaths` | If missing |
|------------|----------|-----------------------------------|------------|
| [`src/pages/roadmap/status/incidents/[id].astro`](src/pages/roadmap/status/incidents/[id].astro) | `id` | `getCollection('statusActiveIncidents')` → each `entry.data.id` | Build error or no incident pages. |
| [`src/pages/roadmap/status/workspaces/[id].astro`](src/pages/roadmap/status/workspaces/[id].astro) | `id` | [`MOCK_WORKSPACES.workspaces`](src/lib/status/mock-data.ts) (mock ids) | Build error or empty paths. |

There are no other dynamic segments under `src/pages` in this repo.

---

## 7. Revert vs delete vs replace

- **Delete** — Remove the files listed in [section 5](#5-files-and-folders-to-delete-server--backend-features) when they exist on the live branch.
- **Revert** — If the live site merged server features in git commits, revert those commits or cherry-pick the static migration; avoid leaving half-deleted stubs that still import `astro:actions`.
- **Replace** — Pages that used to call `fetch-status`, Elasticsearch, or Actions must import from [`status-content.ts`](src/lib/status/status-content.ts), Markdown collections, or [`mock-data.ts`](src/lib/status/mock-data.ts) as in this repo.

---

## 8. Status hub vs demo subsites (data sources)

| Area | Source in this repo |
|------|---------------------|
| Status hub `/roadmap/status` (three sections) | Markdown: `src/content/status/active-incidents/`, `maintenance/`, `recent-incidents/` via [`status-content.ts`](src/lib/status/status-content.ts) and [`render-status-html.ts`](src/lib/status/render-status-html.ts). |
| Incident detail `/roadmap/status/incidents/:id` | Same active-incident entries; `render(entry)` for body. |
| Workspaces `/roadmap/status/workspaces/:id` | [`mock-data.ts`](src/lib/status/mock-data.ts) only (`MOCK_WORKSPACES`, `getMockWorkspaceFeatures`, `MOCK_EXTERNAL_SYSTEMS.systems`). |
| External systems `/roadmap/status/external-systems` | [`MOCK_EXTERNAL_SYSTEMS`](src/lib/status/mock-data.ts) only. |

If your live site still calls Elasticsearch from workspace or external pages, replace those calls with static data or Markdown to stay fully static.

[`getMockUptime()`](src/lib/status/mock-data.ts) remains for the optional [`UptimeBar.astro`](src/components/status/UptimeBar.astro) component if you use it; it is **not** imported by any page in this repo (optional cleanup).

---

## 9. Content collections (`src/content.config.ts`)

Replace legacy status collections with:

- `statusActiveIncidents` → `./src/content/status/active-incidents`
- `statusMaintenance` → `./src/content/status/maintenance`
- `statusRecentIncidents` → `./src/content/status/recent-incidents`

Remove obsolete collections (e.g. old `statusIncidents` / `statusAnnouncements` paths).

Schemas: copy [`src/content.config.ts`](src/content.config.ts) from this repo. Human-readable field descriptions: root [`README.md`](../README.md) (section **Status page (Markdown)**).

Add at least one `.md` file per folder so the content loader is non-empty.

---

## 10. New or heavily changed library code

| File | Role |
|------|------|
| [`src/lib/status/status-content.ts`](src/lib/status/status-content.ts) | Maps collections to domain types; sorting; plain-text excerpt from body when `description` is omitted. |
| [`src/lib/site-url.ts`](src/lib/site-url.ts) | `withBase()` for subpath-aware links (nav, back links, incident URLs). |
| [`src/lib/status/render-status-html.ts`](src/lib/status/render-status-html.ts) | Slim HTML: intro + Active issues + Scheduled maintenance + Recent incidents; `incidentDetailPath(id)` for `base`-safe links. |

---

## 11. Pages to update (summary)

| Page | Changes |
|------|---------|
| [`src/pages/roadmap/status/index.astro`](src/pages/roadmap/status/index.astro) | Use `status-content` + `renderStatusContent` + `incidentDetailPath: (id) => withBase(\`roadmap/status/incidents/${id}\`)`. |
| [`src/pages/roadmap/status/incidents/[id].astro`](src/pages/roadmap/status/incidents/[id].astro) | `getStaticPaths` + `getCollection` + `render(entry)`; back link with `withBase('roadmap/status')`. |
| [`src/pages/roadmap/status/workspaces/[id].astro`](src/pages/roadmap/status/workspaces/[id].astro) | Import mocks only; `withBase` for back link. |
| [`src/pages/roadmap/status/external-systems.astro`](src/pages/roadmap/status/external-systems.astro) | Import mocks only; `withBase` for back link. |
| [`src/pages/roadmap.astro`](src/pages/roadmap.astro) | No voting, Actions, cookies, Toast; sort feature requests without vote counts. |
| [`src/components/FeatureRequestCard.astro`](src/components/FeatureRequestCard.astro) | No vote UI; title, description, status. |
| [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro) | No `PageFeedback`. |
| [`src/pages/index.astro`](src/pages/index.astro), [`src/layouts/MdxDocLayout.astro`](src/layouts/MdxDocLayout.astro) | Meta copy consistent with static + MD (no inaccurate “vote” or live ES claims). |

---

## 12. Environment variables

| Variable / pattern | Static-only action |
|--------------------|--------------------|
| `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY`, `ELASTICSEARCH_INDEX_*` | Remove from `.env` and host secrets unless another service uses them. |
| `EMAIL_SERVICE_*`, `NOTIFY_*`, notification index env vars | Remove if email/subscribe job is deleted. |
| `STATUS_TIME_WINDOW_MINUTES`, `NOTIFICATION_INCIDENT_WINDOW_MINUTES`, `STATUS_FETCH_TIMEOUT_MS` | Remove if nothing reads them (old ES/status pipeline). |
| `PUBLIC_USE_MOCK_STATUS` | Remove if present (hub uses Markdown, not env-driven mock switching). |
| `SITE_URL` | **Optional keep** — often used for `site` in `astro.config` / sitemap at **build time**. |
| Other `PUBLIC_*` | Remove only if your app no longer references them in client code. |

Trim [`roadmap/.env.example`](.env.example) to match what you still need.

---

## 13. Redirects and static hosting

Astro `redirects` in [`astro.config.mjs`](astro.config.mjs) generate static responses for many adapters; for pure static output, behavior depends on the host (some emit HTML redirect pages). If redirects misbehave on your CDN (e.g. S3 static website), add equivalent rules (`_redirects`, CloudFront Functions, nginx `rewrite`, etc.). See Astro’s [configuration reference — redirects](https://docs.astro.build/en/reference/configuration-reference/#redirects).

---

## 14. Build and deploy artifacts

- **`npm run build`** produces **`dist/`** with static HTML, JS, CSS, and assets. For `output: 'static'`, you do **not** need a `dist/server/` bundle for hosting.
- **Contrast:** With `@astrojs/node`, `astro build` typically emitted both client and **server** folders; you had to run Node in production. Static-only: upload **`dist/`** contents only.
- **`npm run preview`** — local QA of the static build; not the production server pattern.
- **CI:** Ensure the pipeline runs `npm run build` and publishes **`dist/`**, not `node dist/server/entry.mjs`.

---

## 15. Optional cleanup (not required for static)

These components exist in this repo but are **not imported** by any page. Safe to delete to reduce noise:

- [`src/components/status/Capabilities.astro`](src/components/status/Capabilities.astro)
- [`src/components/status/UptimeBar.astro`](src/components/status/UptimeBar.astro)

---

## 16. Deployment checklist (live site)

1. Apply dependency removals; `npm ci` / `npm install`.
2. Delete server-only files; fix imports until `npm run build` succeeds with `output: 'static'`.
3. Add `src/content/status/**` Markdown and validate collections.
4. Confirm no remaining `astro:actions`, `@elastic/elasticsearch`, or `src/pages/api/*` for this app.
5. Publish **`dist/`** only; no Node `HOST` / SSR env for serving this site.
6. If using **`base`**, test nav and incident links with `withBase()`.

---

## 17. Quick file checklist (copy/paste)

**Delete (if present):**  
`src/actions/*`, `src/middleware.ts`, `src/pages/api/page-status-data.ts`, `src/pages/api/notify/run.ts`, `src/lib/status/elastic-client.ts`, `src/lib/status/elastic-status.ts`, `src/lib/status/status-config.ts`, `src/lib/status/fetch-status.ts`, `src/lib/votes/*`, `src/lib/feedback/*`, `src/lib/notifications/*`, `PageFeedback.astro`, `SubscribeNotifications.astro`, optional `Toast.astro`, `StatusSkeleton.astro`, `src/pages/requests/index.astro` (if using config redirects).

**Add:**  
`src/content/status/active-incidents/*.md`, `maintenance/*.md`, `recent-incidents/*.md`, `src/lib/status/status-content.ts`, slim `render-status-html.ts`, optional `src/lib/site-url.ts`.

**Rewrite:**  
`content.config.ts`, `astro.config.mjs`, status and roadmap pages listed in [section 11](#11-pages-to-update-summary), `mock-data.ts` (trim to mocks you still need).

**Do not reintroduce** `fetch-status.ts` for this architecture — use Markdown collections and `mock-data.ts` directly.

---

## Appendix A: Alphabetized list of removed paths (this migration)

Use this list to diff your live tree against this repo. Paths are under the Astro project `src/` unless noted.

- `src/actions/index.ts` (entire `src/actions/` directory if only Actions lived there)
- `src/components/PageFeedback.astro`
- `src/components/Toast.astro`
- `src/components/status/StatusSkeleton.astro`
- `src/components/status/SubscribeNotifications.astro`
- `src/lib/feedback/elastic-feedback.ts`
- `src/lib/notifications/elastic-subscribers.ts`
- `src/lib/notifications/email-client.ts`
- `src/lib/notifications/email-templates.ts`
- `src/lib/notifications/maintenance-notification-state.ts`
- `src/lib/notifications/notification-state.ts`
- `src/lib/notifications/send-notifications.ts`
- `src/lib/status/elastic-client.ts`
- `src/lib/status/elastic-status.ts`
- `src/lib/status/fetch-status.ts`
- `src/lib/status/status-config.ts`
- `src/lib/votes/elastic-votes.ts`
- `src/middleware.ts`
- `src/pages/api/notify/run.ts`
- `src/pages/api/page-status-data.ts`
- `src/pages/requests/index.astro`

Also remove empty directories: `src/pages/api/` (if no other endpoints), `src/lib/notifications/`, `src/lib/votes/`, `src/lib/feedback/`, `src/actions/` when empty.

---

## Appendix B: Relationship to older docs (short)

| Document | Use when |
|----------|----------|
| **This file (`INTEGRATION_STATIC.md`)** | Migrating **to** static-only; matches current repo. |
| [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) | Historical; describes adapters, SSR, Actions — **not** static-only. |
| [`ELASTICSEARCH_GUIDE.md`](ELASTICSEARCH_GUIDE.md) | Historical ES ops; ignore for static hosting. |
| [`EMAIL_NOTIFICATIONS_GUIDE.md`](EMAIL_NOTIFICATIONS_GUIDE.md) | Historical email pipeline; ignore if notifications removed. |
