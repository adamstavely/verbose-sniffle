# Developer Handoff

This document is the **single source of truth** for a developer taking over this
project. It explains how the app is built, what runs where, every integration
that must be wired up before production, the Elasticsearch indices you must
create, the complete environment-variable reference, and everything that is
currently stubbed, placeholder, or outstanding.

For **content editing** (guides, releases, roadmap, status, etc.) see
[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md). For a deep operational reference on the
Elasticsearch integration see [`ELASTICSEARCH_GUIDE.md`](./ELASTICSEARCH_GUIDE.md)
in this folder.

---

## 1. What this project is

A **Help Center** web app for the platform: a documentation site (User Guide,
Developer Guide, About), a **Release Notes** changelog, a **Product Roadmap**
with community voting, and a live **System Status** page. It is a polished,
accessible front end backed by Elasticsearch for the dynamic data.

The entire application lives in the **`roadmap/`** subdirectory of the repo
(historical name). The git repository root is one level up.

### Top-level sections / routes

| Route | What it is | Rendering |
|-------|------------|-----------|
| `/` | Homepage (hero + 6 section cards + contact CTA) | static |
| `/user-guide` | User Guide landing: Diátaxis category browse | static |
| `/user-guide/tutorials` | Tutorials landing: role "journeys" picker + tutorials list | static |
| `/user-guide/<category>/<page>` | Diátaxis doc pages (tutorials / how-to / reference) | static (MDX) |
| `/user-guide/journeys/<id>` | Generated role-workflow "journey" step pages | static |
| `/developer-guide`, `/developer-guide/*` | Developer docs (API auth, style guide) | static (MDX) |
| `/about`, `/about/*` | About pages | static (MDX) |
| `/releases` | Release Notes changelog (+ `/rss.xml`) | static |
| `/roadmap` | Product Roadmap + feature-request **voting** | **on-demand** |
| `/roadmap/status` | System Status hub | **on-demand** |
| `/roadmap/status/incidents/<id>` | Incident detail | static (SSG) |
| `/roadmap/status/history` | Incident history (resolved incidents) | static |
| `/roadmap/status/external-systems`, `/roadmap/status/workspaces/<id>` | Status detail | **on-demand** |
| `/tags`, `/tags/<slug>` | Doc tag browser | static |
| `/search` | Pagefind full-text search | static (index is a build artifact) |

---

## 2. Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Astro 7** (`astro ^7.0.6`), `output: 'static'` with per-route `export const prerender = false` opt-in |
| Server runtime | **`@astrojs/node` v11, `mode: 'standalone'`** — `npm run build` emits a self-contained Node HTTP server at `dist/server/entry.mjs` |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`, no `tailwind.config.js`) — all config is CSS-native in `src/styles/global.css` via `@theme`. Design System v2.1 tokens, class-based dark mode. |
| Fonts | Self-hosted **Inter** + **JetBrains Mono** via `@fontsource-variable/*` (CSP-safe, same-origin) |
| Content | Astro **content collections** (Markdown) + **MDX** doc pages |
| Data / backend | **Elasticsearch** (`@elastic/elasticsearch ^8.17.0`) — votes, feedback, live status telemetry |
| Interactivity | **Astro Actions** (`vote`, `feedback`) — server-side, form-based |
| Search | **Pagefind** (static index built after `astro build`) |
| Feeds/SEO | `@astrojs/rss`, `@astrojs/sitemap` |

There is **no client-side framework** (no React/Vue/Svelte components).
Interactivity is a handful of tiny hand-written `is:inline` scripts (see
[CSP](#5-security-middleware--csp)) plus the Astro Actions form flow.

---

## 3. Repository layout

```
verbose-sniffle/            # git root
├── README.md               # project overview
└── roadmap/                # THE APP
    ├── HANDOFF.md          # ← this file
    ├── CONTENT_GUIDE.md    # how to edit all content
    ├── ELASTICSEARCH_GUIDE.md   # Elasticsearch topic reference
    ├── .env.example        # every runtime env var
    ├── astro.config.mjs    # build/runtime config
    ├── package.json        # scripts + deps
    ├── tsconfig.json       # strict TS, `shared/*` → src/lib/status/*
    ├── public/             # static assets (favicon, etc.)
    └── src/
        ├── middleware.ts           # CSP + security headers + voter cookie + Actions PRG
        ├── env.d.ts                # types incl. __BUILD_ISO__
        ├── content.config.ts       # 6 content collections + Zod schemas
        ├── actions/index.ts        # Astro Actions: vote, feedback
        ├── layouts/                # BaseLayout (shell), MdxDocLayout (docs)
        ├── components/             # UI components (+ illustrations/, status/)
        ├── pages/                  # routes (.astro, .mdx, rss.xml.ts, api/)
        ├── styles/global.css       # Tailwind v4 + Design System tokens
        ├── content/                # Markdown data (roadmap, releases, status, ...)
        └── lib/                    # helpers + all Elasticsearch access
            ├── site-url.ts         # withBase() base-path helper
            ├── nav.ts, docs.ts     # sidebar nav + MDX doc registry
            ├── role-guides.ts      # role "journeys" data
            ├── tag-utils.ts        # tag slug helpers
            ├── rate-limit.ts       # in-memory fixed-window limiter
            ├── es-utils.ts         # deterministic doc IDs + 409 detection
            ├── remark-*.mjs, rehype-*.mjs  # MDX plugins
            ├── status/             # ES client + status pipeline (aliased `shared`)
            │   └── connected-services.ts  # hand-curated "Connected services" list (no ES)
            ├── votes/elastic-votes.ts
            └── feedback/elastic-feedback.ts
```

---

## 4. Build, run, and deploy

### Prerequisites
- **Node.js 20+** (the `@astrojs/node` v11 adapter targets modern Node; 18 may work but is not guaranteed).
- npm.

### Local development
```bash
cd roadmap
npm install
cp .env.example .env      # then fill in values, or set PUBLIC_USE_MOCK_STATUS=true
npm run dev               # http://localhost:4321
```
> **Search does not work in `dev`.** The Pagefind index is produced by the build
> step, so `/search` only returns results on a built site or `astro preview`.

### Scripts (`package.json`)
| Script | Command | Notes |
|--------|---------|-------|
| `dev` | `astro dev` | dev server |
| `build` | `astro build && pagefind --site dist/client` | **two steps** — Astro build, then Pagefind indexes the built HTML into `dist/client/pagefind/` |
| `preview` | `astro preview` | serve the built output locally |
| `check` | `astro check` | TypeScript / Astro diagnostics (the only static check — see [gaps](#10-outstanding-work--gaps)) |

### Production build & run
```bash
cd roadmap
npm run build                 # → dist/client (static) + dist/server (Node server)
node ./dist/server/entry.mjs  # standalone server; honors PORT
```
`dist/server/entry.mjs` is a self-contained HTTP server that serves the
on-demand routes **and** the static assets in `dist/client`. Prerendered pages
are plain HTML in `dist/client`.

### Deploy checklist
1. Run the **server bundle** (`dist/server/entry.mjs`) — a static-only deploy
   breaks voting, status, and feedback.
2. Provide all required env vars (see §7). At minimum for a real deploy:
   Elasticsearch connection + indices, `SITE_URL`, and the support integrations
   you intend to use.
3. Set security headers for **static** responses at your edge/reverse proxy —
   the middleware only runs for on-demand responses (see §5).
4. `PORT` is read by the Node adapter from the host environment.

---

## 5. Security: middleware & CSP

`src/middleware.ts` runs for **on-demand (non-prerendered) responses only**
(it early-returns for `context.isPrerendered`). It does three things:

1. **Security headers** on every on-demand response: `X-Content-Type-Options`,
   `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and a strict
   **Content-Security-Policy**.
2. **Voter cookie**: sets `roadmap_voter_id` (`randomUUID`, 1-year, `httpOnly`,
   `secure` in prod, `sameSite=lax`) — the identity used for vote/feedback dedup
   and rate limiting.
3. **Astro Actions PRG**: intercepts `vote` form POSTs, runs the
   handler, stores the serialized result, and redirects back (Post/Redirect/Get).
   Errors are logged server-side and surfaced as a generic message.

### ⚠️ The CSP hash allowlist — the most fragile part of the codebase
The CSP `script-src` intentionally omits `'unsafe-inline'`. Each trusted inline
script is written `is:inline`, kept **byte-stable**, and its **SHA-256 is
allowlisted** in `middleware.ts`. There are **6 hashed scripts**:

1. Theme pre-paint init — `BaseLayout.astro`
2. Theme toggle — `BaseLayout.astro`
3. Mobile sidebar drawer — `BaseLayout.astro`
4. Back-to-top FAB — `BaseLayout.astro`
5. Support modal — `SupportModal.astro`
6. Page-feedback module — `PageFeedback.astro` (Astro inlines this bundled script)

**If you change even one byte (including whitespace) of any of these scripts,
its hash no longer matches and the browser will silently block it on the
on-demand pages (roadmap/status).** To update: edit the script, `npm run build`,
load `/roadmap` or `/roadmap/status`, read the CSP console error (it prints the
required `sha256-…`), and replace the corresponding hash in `middleware.ts`.
Static pages have no CSP at runtime, so a break only shows on the on-demand
routes (and anywhere your edge proxy applies the same CSP).

---

## 6. Integrations you must wire up

Everything below is **stubbed or unconfigured** out of the box. The app is a
complete front end with honest data plumbing, but these external systems are the
new developer's responsibility.

### 6.1 Elasticsearch cluster + indices — REQUIRED for dynamic data
- The app **never creates indices**. You must provision a cluster and create all
  6 indices (see [§8](#8-elasticsearch-indices-to-create) for names + mappings).
- Set `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY`.
- **Live status telemetry** — the **Service health** list and the **90-day
  uptime** bar — is *read-only* to this app. An external observability pipeline
  must **write** service-health documents into `status-core-services` (and, for
  the workspace detail page, `status-workspaces`); the uptime bar also reads
  `status-incidents`. Without that pipeline (and with mock mode off) the status
  page honestly shows **"Unknown" / empty**, never fake-healthy.
- **Service health is fully data-driven** — it renders whatever services exist in
  `status-core-services`; there is no hardcoded service catalog. To add a service
  to the page, index a doc with a new `service_id` (see §8 and
  `ELASTICSEARCH_GUIDE.md`). **Connected services is NOT Elasticsearch** — it is a
  hand-curated data file (`src/lib/status/connected-services.ts`, see §9 /
  `CONTENT_GUIDE.md`).
- To develop without a cluster: `PUBLIC_USE_MOCK_STATUS=true` (status page uses
  bundled `src/lib/status/mock-data.ts`; votes/feedback still need ES).

### 6.2 Support modal targets
- **Email:** `PUBLIC_SUPPORT_EMAIL` (placeholder `support@example.com`) → `mailto:`.
- **ServiceNow ticket:** `PUBLIC_SERVICENOW_URL` (placeholder
  `https://example.service-now.com/help`) → external link.
- **Live chat:** the "Live chat" button calls `window.HelpCenterChat.open()` at
  runtime and shows a `window.alert()` fallback if no widget is present. Integrate
  a chat provider that exposes that global. Note: `PUBLIC_SUPPORT_CHAT_ENABLED`
  exists in `.env.example` but is **not read anywhere** — the button always
  renders. Either wire that flag into `SupportModal.astro` or remove it.

### 6.3 Authentication — does not exist
There is **no auth, session, or user model** anywhere. The circular "JD" avatar
in the top-right nav (`BaseLayout.astro`) is a **hardcoded, non-functional
placeholder**. If the product needs accounts/login, it is greenfield work.

---

## 7. Environment variables (complete reference)

`PUBLIC_*` variables are exposed to the browser; everything else is server-only.
Defaults are what the code falls back to when the variable is unset.

| Variable | Public | Default | Purpose |
|----------|:------:|---------|---------|
| `ELASTICSEARCH_URL` | | `http://localhost:9200` | ES node URL |
| `ELASTICSEARCH_API_KEY` | | *(unset → no auth)* | ES API key auth |
| `STATUS_FETCH_TIMEOUT_MS` | | `15000` | Per-request ES timeout (`maxRetries:1`); `0` disables |
| `STATUS_TIME_WINDOW_MINUTES` | | `5` | Telemetry freshness window |
| `STATUS_ENVIRONMENT` | | `production` | Environment label shown on status |
| `ELASTICSEARCH_INDEX_CORE_SERVICES` | | `status-core-services` | index name (Service health) |
| `ELASTICSEARCH_INDEX_WORKSPACES` | | `status-workspaces` | index name (workspace detail page) |
| `ELASTICSEARCH_INDEX_INCIDENTS` | | `status-incidents` | index name (90-day uptime bar) |
| `ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE` | | `status-scheduled-maintenance` | index name (read fn only; not used by the UI) |
| `ELASTICSEARCH_INDEX_ROADMAP_VOTES` | | `roadmap-votes` | index name |
| `ELASTICSEARCH_INDEX_PAGE_FEEDBACK` | | `page-feedback` | index name |
| `SITE_URL` | | `https://example.com` (build) | Canonical site URL (sitemap, RSS) |
| `PUBLIC_USE_MOCK_STATUS` | ✔ | *(unset)* | `true` → status page uses mock data, no ES |
| `PUBLIC_SUPPORT_EMAIL` | ✔ | `support@example.com` | Support modal `mailto:` |
| `PUBLIC_SERVICENOW_URL` | ✔ | `https://example.service-now.com/help` | Support modal ticket link |

**Declared in `.env.example` but NOT read by any code (remove or wire up):**
`PUBLIC_SUPPORT_CHAT_ENABLED` (SupportModal probes `window.HelpCenterChat` instead; see §6.2).
Also note some older guides mention `STATUS_ERROR_RATE_*` / `STATUS_LATENCY_P95_*`
threshold vars — **no code reads these**; `status_level` comes straight from the
ES documents.

Built-ins used: `import.meta.env.PROD` (cookie `secure` flag),
`import.meta.env.BASE_URL` (subpath link prefixing via `withBase`), and the
Vite-injected `__BUILD_ISO__` build timestamp (used as the roadmap "Last Updated").

---

## 8. Elasticsearch indices to create

The app assumes all 6 indices already exist and does **not** create them,
apply templates, or manage ILM. Index names are env-overridable (§7). Fields
used with a `term` filter on `field.keyword` need a `keyword` sub-field
(Elasticsearch's default dynamic mapping for `text` already provides
`.keyword`, so dynamic mapping works, but explicit mappings are recommended).

### 8.1 Live telemetry indices — WRITTEN by your observability pipeline, read by the app
These have no writer in this repo; an external pipeline must populate them.

**1. `status-core-services`** — one doc per service health sample; the sole
source for the **Service health** list (no hardcoded catalog). Fields:
`@timestamp` (date), `service_id` (keyword), `service_name` (text/keyword, the
display label), `status_level` (keyword enum: `HEALTHY|DEGRADED|OUTAGE|UNKNOWN|MAINTENANCE`,
used **directly** — no thresholds computed), `impact_description` (text, optional —
when present the row expands to show it), `error_rate` (float, optional, stored
but not used to derive status), `latency_p95_ms` (float, optional, same).
The app keeps the **latest doc per `service_id`** within `STATUS_TIME_WINDOW_MINUTES`,
and the overall page badge is the worst status across services. **To add a service
to the status page, index a doc with a new `service_id`** — it appears
automatically, no code change (see `ELASTICSEARCH_GUIDE.md`).

**2. `status-workspaces`** — read by the `/roadmap/status/workspaces/<id>` detail
page only. Dual-purpose (workspace rows *and* feature rows).
Workspace row: `@timestamp`, `workspace_id` (keyword), `workspace_name`,
`owner_team?`, `environment?`, `status_level`.
Feature row: `@timestamp`, `workspace_id` (keyword), `feature_id` (keyword),
`feature_name`, `status_level`, `degradation_summary?`.
Feature query filters `term: { workspace_id }` (bare field — keep it exact-matchable).

**3. `status-incidents`** — read by the **90-day uptime bar** (which merges core-service
telemetry with incident spans). The incidents *shown on the page* come from Markdown,
not this index. `@timestamp`, `incident_id` (keyword), `title`, `status_level`,
`started_at` (date), `resolved_at?` (date), `description?`,
`updates?` (array of `{ timestamp, message, status? }`), `affected_workspace_ids?`,
`affected_core_service_ids?`.

**4. `status-scheduled-maintenance`** — a read function exists (`getScheduledMaintenance`)
but **no page uses it** (the maintenance section is Markdown-driven); safe to leave
empty or drop the read path. `@timestamp`, `maintenance_id` (keyword), `title`,
`description?`, `scheduled_start` (date), `scheduled_end` (date),
`status` (keyword: `SCHEDULED|IN_PROGRESS|COMPLETED`), `affected_core_service_ids?`.

### 8.2 Application read+write indices — written by this app
The app writes these with **deterministic document IDs** (`src/lib/es-utils.ts`,
sha256 of the key parts) and `client.create()`, so a duplicate is a harmless
`409` — this is how vote/feedback dedup is race-free.

**5. `roadmap-votes`** — `{ feature_request_id, voter_id, '@timestamp' }`;
id = `hash(vote, featureRequestId, voterId)`. App aggregates counts via a
`terms` agg on `feature_request_id.keyword` and filters `voter_id.keyword`.

**6. `page-feedback`** — `{ page_path, helpful ('yes'|'no'), message?, visitor_id, '@timestamp' }`;
id = `hash(feedback, pagePath, visitorId)` (one vote per page per visitor).

> `ELASTICSEARCH_GUIDE.md` contains deeper detail on queries and index shapes,
> including how to add a service to the Service health list. Where it disagrees
> with this section, **this section and the code are authoritative** (see
> [Documentation map](#documentation-map--accuracy)).

---

## 9. Data flow & runtime behavior notes

- **Reads are cached** ~15s in-memory per Node instance (`src/lib/status/cache.ts`).
- **Rate limiting** (`src/lib/rate-limit.ts`) is an in-memory fixed-window map,
  **per Node instance** — it does not coordinate across replicas. Behind a
  multi-instance deploy, add edge/WAF rate limiting too.
- **Actions:** `vote` (20/60s per voter, 60/60s per IP) and `feedback` (10/60s,
  30/60s per IP). Both validate with Zod and dedup atomically via deterministic
  ES doc IDs.
- **Status page** (`/roadmap/status`) data sources: **Service health** + **90-day
  uptime** come from **Elasticsearch**; **Connected services** comes from the
  hand-curated data file `src/lib/status/connected-services.ts`; the *Known Issues
  / Scheduled maintenance / Recent incidents* sections come from **Markdown**
  collections (`src/content/status/**`). On ES failure the live sections show
  honest `UNKNOWN`/empty.
- **Dead-ish code:** the ES incident/maintenance *read* functions
  (`getIncidents`, `getRecentIncidents`, `getScheduledMaintenance`,
  `getIncidentById`, and their `fetch*` wrappers) are **not used by any page** —
  the page is Markdown-driven — and no longer used by anything else now that the
  email notifier is removed. (Note: the 90-day uptime bar reads `status-incidents`
  directly via `getUptime90Days`, so that index is still live.) A future dev could
  delete the unused read functions or switch the page to ES.
- `getStatusSummary` hardcodes `incidentCount: 0` (unused). **Service health** now
  renders whatever `status-core-services` docs exist — a flat list, no hardcoded
  catalog and no pinned-`HEALTHY` items.

---

## 10. Outstanding work & gaps

**Product naming is unresolved** — three names are used interchangeably and
should be unified to one real product name before launch:
- **"IMAX"** — `index.astro` (About card), `about.astro`, `BaseLayout.astro`
  (nav "About IMAX"), `nav.ts`.
- **"Super App"** — `about/overview.mdx`, root `README.md`.
- **"Help Center"** — the site/brand name in ~15 page titles, the header, and the
  footer.

**Placeholder site config** to replace: `astro.config.mjs` `site`
(`https://example.com`), `rss.xml.ts` fallback, and `.env.example` `SITE_URL`
(`…example.gov`).

**All bundled content is demo/sample data** and should be replaced:
`src/content/roadmap/*`, `feature-requests/*`, `releases/*`,
`status/{active-incidents,maintenance,recent-incidents}/*`, and the ES
`mock-data.ts` fixtures (includes an "Acme Corp" workspace).

**Missing engineering infrastructure** (none of this exists yet):
- **No tests** — no unit/integration/e2e, no test runner. Adding coverage for the
  ES write/dedup paths, actions, and rate limiter is high value.
- **No linting/formatting** — only `astro check` (TypeScript). Consider ESLint +
  Prettier.
- **No CI** — no `.github/workflows`. Add at least build + `astro check` on PRs.
- **No CI-side CSP-hash guard** — because the CSP hashes are hand-maintained,
  consider a check that fails the build if an inline script's hash drifts.

**Deferred accessibility / UX** (front end is otherwise WCAG-AA clean per the
latest review):
- Live-chat fallback uses `window.alert()` — replace with an in-page message.
- `StatusBadge` `dot` variant conveys status by color only (aria-hidden); ensure a
  text label always sits beside it.
- Empty sidebar nav groups render a literal "Coming soon".

**Robustness follow-ups:**
- Distributed rate limiting / caching for multi-instance deploys.
- The orphaned `/roadmap/status/workspaces/<id>` page (reads `status-workspaces`)
  has no inbound link — wire it up or remove it.

---

## Documentation map & accuracy

| Doc | Scope | Status |
|-----|-------|--------|
| `HANDOFF.md` (this) | Architecture, integrations, ES indices, env, outstanding | **Canonical** |
| `CONTENT_GUIDE.md` | How to edit every content type | **Canonical** |
| `ELASTICSEARCH_GUIDE.md` | ES index shapes & queries; how to add a service to Service health | **Canonical** for ES depth |

When in doubt, **the code and this document win.**
