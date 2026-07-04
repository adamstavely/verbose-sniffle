# Developer Handoff

This document is the **single source of truth** for a developer taking over this
project. It explains how the app is built, what runs where, every integration
that must be wired up before production, the Elasticsearch indices you must
create, the complete environment-variable reference, and everything that is
currently stubbed, placeholder, or outstanding.

For **content editing** (guides, releases, roadmap, status, etc.) see
[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md). For deep operational references see the
four topic guides in this folder — but read the [Documentation map](#documentation-map--accuracy)
section below first, because some of them contain stale details that this
document corrects.

---

## 1. What this project is

A **Help Center** web app for the platform: a documentation site (User Guide,
Developer Guide, About), a **Release Notes** changelog, a **Product Roadmap**
with community voting, and a live **System Status** page with incident/email
subscriptions. It is a polished, accessible front end backed by Elasticsearch
for the dynamic data.

The entire application lives in the **`roadmap/`** subdirectory of the repo
(historical name). The git repository root is one level up.

### Top-level sections / routes

| Route | What it is | Rendering |
|-------|------------|-----------|
| `/` | Homepage (hero + 6 section cards + contact CTA) | static |
| `/user-guide` | User Guide landing: role "journeys" + Diátaxis browse | static |
| `/user-guide/<category>/<page>` | Diátaxis doc pages (tutorials / how-to / reference / explanation) | static (MDX) |
| `/user-guide/journeys/<id>` | Generated role-workflow "journey" step pages | static |
| `/developer-guide`, `/developer-guide/*` | Developer docs (API auth, style guide) | static (MDX) |
| `/about`, `/about/*` | About pages | static (MDX) |
| `/releases` | Release Notes changelog (+ `/rss.xml`) | static |
| `/roadmap` | Product Roadmap + feature-request **voting** | **on-demand** |
| `/roadmap/status` | System Status hub + email **subscribe** | **on-demand** |
| `/roadmap/status/incidents/<id>` | Incident detail | static (SSG) |
| `/roadmap/status/external-systems`, `/roadmap/status/workspaces/<id>` | Status detail | **on-demand** |
| `/tags`, `/tags/<slug>` | Doc tag browser | static |
| `/search` | Pagefind full-text search | static (index is a build artifact) |
| `/api/notify/run` | Authenticated webhook that sends incident emails | **on-demand** (POST only) |

---

## 2. Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Astro 7** (`astro ^7.0.6`), `output: 'static'` with per-route `export const prerender = false` opt-in |
| Server runtime | **`@astrojs/node` v11, `mode: 'standalone'`** — `npm run build` emits a self-contained Node HTTP server at `dist/server/entry.mjs` |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`, no `tailwind.config.js`) — all config is CSS-native in `src/styles/global.css` via `@theme`. Design System v2.1 tokens, class-based dark mode. |
| Fonts | Self-hosted **Inter** + **JetBrains Mono** via `@fontsource-variable/*` (CSP-safe, same-origin) |
| Content | Astro **content collections** (Markdown) + **MDX** doc pages |
| Data / backend | **Elasticsearch** (`@elastic/elasticsearch ^8.17.0`) — votes, subscribers, feedback, live status telemetry |
| Interactivity | **Astro Actions** (`vote`, `subscribe`, `feedback`) — server-side, form-based |
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
    ├── INTEGRATION_GUIDE.md, ELASTICSEARCH_GUIDE.md,
    │   EMAIL_NOTIFICATIONS_GUIDE.md, STATUS_PAGE_DATA.md   # topic references
    ├── .env.example        # every runtime env var
    ├── astro.config.mjs    # build/runtime config
    ├── package.json        # scripts + deps
    ├── tsconfig.json       # strict TS, `shared/*` → src/lib/status/*
    ├── public/             # static assets (favicon, etc.)
    └── src/
        ├── middleware.ts           # CSP + security headers + voter cookie + Actions PRG
        ├── env.d.ts                # types incl. __BUILD_ISO__
        ├── content.config.ts       # 6 content collections + Zod schemas
        ├── actions/index.ts        # Astro Actions: vote, subscribe, feedback
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
            ├── votes/elastic-votes.ts
            ├── feedback/elastic-feedback.ts
            └── notifications/      # subscribers, email client/templates, delivery
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
   breaks voting, status, subscribe, feedback, and the notify webhook.
2. Provide all required env vars (see §7). At minimum for a real deploy:
   Elasticsearch connection + indices, `SITE_URL`, and the support/email/webhook
   integrations you intend to use.
3. Set security headers for **static** responses at your edge/reverse proxy —
   the middleware only runs for on-demand responses (see §5).
4. Schedule the **notification cron** (§6) if you want incident emails.
5. `PORT` is read by the Node adapter from the host environment.

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
3. **Astro Actions PRG**: intercepts `vote`/`subscribe` form POSTs, runs the
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
  10 indices (see [§8](#8-elasticsearch-indices-to-create) for names + mappings).
- Set `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY`.
- **Live status telemetry** (indices 1–5 in §8) is *read-only* to this app — an
  external observability pipeline must **write** service/workspace/external-system
  health documents into those indices. Without that pipeline (and with mock mode
  off) the status page honestly shows **"Unknown" / empty**, never fake-healthy.
- To develop without a cluster: `PUBLIC_USE_MOCK_STATUS=true` (status page uses
  bundled `src/lib/status/mock-data.ts`; votes/subscribe/feedback still need ES).

### 6.2 Email delivery — stubbed behind an HTTP contract
- There is **no SMTP/SendGrid/SES integration.** `src/lib/notifications/email-client.ts`
  POSTs JSON `{ to, subject, body }` to `${EMAIL_SERVICE_URL}/${EMAIL_SERVICE_PATH}`
  (default path `send`), optionally with `Authorization: Bearer ${EMAIL_SERVICE_API_KEY}`.
- Stand up a relay that honors that contract and set `EMAIL_SERVICE_URL`
  (+ `EMAIL_SERVICE_API_KEY`, `EMAIL_SERVICE_PATH`). If `EMAIL_SERVICE_URL` is
  blank, all email sends are skipped (subscribe confirmations and incident
  emails silently do nothing).
- **Known limitation (in code):** a partially-failed incident batch is retried
  wholesale on the next run, so some subscribers may receive duplicates.
  Per-subscriber delivery tracking is the fuller fix and is not implemented.

### 6.3 Notification cron — schedule the webhook
- `POST /api/notify/run` with header `Authorization: Bearer <NOTIFY_WEBHOOK_SECRET>`
  triggers incident/maintenance email delivery. It is **POST-only**, uses a
  constant-time secret compare, **fails closed with 503 if `NOTIFY_WEBHOOK_SECRET`
  is unset**, and returns `401` on a bad token. Response body is only
  `{ ok, sent, failed }`.
- Set `NOTIFY_WEBHOOK_SECRET` and schedule an external cron/CI job to POST it
  (every ~2–5 min). **No scheduler ships with the app.**
- **Gotcha (source-of-truth split):** the status *page* renders incidents and
  maintenance from **Markdown** (`src/content/status/**`), but the email notifier
  reads incidents/maintenance from the **Elasticsearch** `status-incidents` /
  `status-scheduled-maintenance` indices. So editing Markdown updates the page
  but sends no emails, and writing ES docs sends emails but doesn't change the
  page. Decide on one source of truth or write to both. (See §9.)

### 6.4 Support modal targets
- **Email:** `PUBLIC_SUPPORT_EMAIL` (placeholder `support@example.com`) → `mailto:`.
- **ServiceNow ticket:** `PUBLIC_SERVICENOW_URL` (placeholder
  `https://example.service-now.com/help`) → external link.
- **Live chat:** the "Live chat" button calls `window.HelpCenterChat.open()` at
  runtime and shows a `window.alert()` fallback if no widget is present. Integrate
  a chat provider that exposes that global. Note: `PUBLIC_SUPPORT_CHAT_ENABLED`
  exists in `.env.example` but is **not read anywhere** — the button always
  renders. Either wire that flag into `SupportModal.astro` or remove it.

### 6.5 Authentication — does not exist
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
| `NOTIFICATION_INCIDENT_WINDOW_MINUTES` | | `1440` | Incident/maintenance lookback for emails |
| `STATUS_ENVIRONMENT` | | `production` | Environment label shown on status |
| `ELASTICSEARCH_INDEX_CORE_SERVICES` | | `status-core-services` | index name |
| `ELASTICSEARCH_INDEX_WORKSPACES` | | `status-workspaces` | index name |
| `ELASTICSEARCH_INDEX_EXTERNAL_SYSTEMS` | | `status-external-systems` | index name |
| `ELASTICSEARCH_INDEX_INCIDENTS` | | `status-incidents` | index name (email notifier) |
| `ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE` | | `status-scheduled-maintenance` | index name (email notifier) |
| `ELASTICSEARCH_INDEX_ROADMAP_VOTES` | | `roadmap-votes` | index name |
| `ELASTICSEARCH_INDEX_STATUS_SUBSCRIBERS` | | `status-subscribers` | index name |
| `ELASTICSEARCH_INDEX_STATUS_NOTIFICATION_SENT` | | `status-notification-sent` | index name |
| `ELASTICSEARCH_INDEX_STATUS_MAINTENANCE_NOTIFICATION_SENT` | | `status-maintenance-notification-sent` | index name |
| `ELASTICSEARCH_INDEX_PAGE_FEEDBACK` | | `page-feedback` | index name |
| `EMAIL_SERVICE_URL` | | `''` *(blank disables email)* | Mail relay base URL |
| `EMAIL_SERVICE_PATH` | | `send` | Mail relay path segment |
| `EMAIL_SERVICE_API_KEY` | | *(unset)* | Mail relay bearer token |
| `NOTIFY_WEBHOOK_SECRET` | | *(unset → endpoint 503)* | Bearer secret for `/api/notify/run` |
| `SITE_URL` | | `https://example.com` (build) | Canonical site URL (sitemap, RSS, email links) |
| `STATUS_PAGE_BASE_URL` | | `''` | Fallback base for absolute email links |
| `PUBLIC_USE_MOCK_STATUS` | ✔ | *(unset)* | `true` → status page uses mock data, no ES |
| `PUBLIC_SUPPORT_EMAIL` | ✔ | `support@example.com` | Support modal `mailto:` |
| `PUBLIC_SERVICENOW_URL` | ✔ | `https://example.service-now.com/help` | Support modal ticket link |

**Declared in `.env.example` but NOT read by any code (remove or wire up):**
`PUBLIC_SUPPORT_CHAT_ENABLED` (SupportModal probes `window.HelpCenterChat` instead).
Also note some older guides mention `STATUS_ERROR_RATE_*` / `STATUS_LATENCY_P95_*`
threshold vars — **no code reads these**; `status_level` comes straight from the
ES documents.

Built-ins used: `import.meta.env.PROD` (cookie `secure` flag),
`import.meta.env.BASE_URL` (subpath link prefixing via `withBase`), and the
Vite-injected `__BUILD_ISO__` build timestamp (used as the roadmap "Last Updated").

---

## 8. Elasticsearch indices to create

The app assumes all 10 indices already exist and does **not** create them,
apply templates, or manage ILM. Index names are env-overridable (§7). Fields
used with a `term` filter on `field.keyword` need a `keyword` sub-field
(Elasticsearch's default dynamic mapping for `text` already provides
`.keyword`, so dynamic mapping works, but explicit mappings are recommended).

### 8.1 Live telemetry indices — WRITTEN by your observability pipeline, read by the app
These have no writer in this repo; an external pipeline must populate them.

**1. `status-core-services`** — one doc per service health sample.
`@timestamp` (date), `service_id` (keyword), `service_name` (text/keyword),
`status_level` (keyword enum: `HEALTHY|DEGRADED|OUTAGE|UNKNOWN|MAINTENANCE`),
`error_rate` (float, optional), `latency_p95_ms` (float, optional).
The app keeps the **latest doc per `service_id`** within `STATUS_TIME_WINDOW_MINUTES`.
Known service ids grouped by `capability-groups.ts`: `auth-service`,
`billing-service`, `messaging-service`, `search-service`, `storage-service`.

**2. `status-workspaces`** — dual-purpose (workspace rows *and* feature rows).
Workspace row: `@timestamp`, `workspace_id` (keyword), `workspace_name`,
`owner_team?`, `environment?`, `status_level`.
Feature row: `@timestamp`, `workspace_id` (keyword), `feature_id` (keyword),
`feature_name`, `status_level`, `degradation_summary?`,
`impacting_external_system_ids?` (keyword[]).
Feature query filters `term: { workspace_id }` (bare field — keep it exact-matchable).

**3. `status-external-systems`** — `@timestamp`, `system_id` (keyword),
`system_name`, `system_type` (keyword: `SAAS|INTERNAL|THIRD_PARTY_API`),
`status_level`, `latency_p95_ms?`, `error_rate?`, `impacted_core_service_ids?` (keyword[]),
`impacted_feature_ids?` (keyword[]). Latest per `system_id`.

**4. `status-incidents`** — used by the **email notifier only** (not the page).
`@timestamp`, `incident_id` (keyword), `title`, `status_level`, `started_at` (date),
`resolved_at?` (date), `description?`, `updates?` (array of `{ timestamp, message, status? }`),
`affected_workspace_ids?`, `affected_core_service_ids?`, `affected_external_system_ids?`.

**5. `status-scheduled-maintenance`** — used by the **email notifier only**.
`@timestamp`, `maintenance_id` (keyword), `title`, `description?`,
`scheduled_start` (date), `scheduled_end` (date),
`status` (keyword: `SCHEDULED|IN_PROGRESS|COMPLETED`),
`affected_core_service_ids?`, `affected_external_system_ids?`.

### 8.2 Application read+write indices — written by this app
The app writes these with **deterministic document IDs** (`src/lib/es-utils.ts`,
sha256 of the key parts) and `client.create()`, so a duplicate is a harmless
`409` — this is how vote/subscribe/feedback dedup is race-free.

**6. `roadmap-votes`** — `{ feature_request_id, voter_id, '@timestamp' }`;
id = `hash(vote, featureRequestId, voterId)`. App aggregates counts via a
`terms` agg on `feature_request_id.keyword` and filters `voter_id.keyword`.

**7. `status-subscribers`** — `{ email, '@timestamp' }`;
id = `hash(subscriber, normalizedEmail)`. Paginated read sorted by `email.keyword`.

**8. `status-notification-sent`** — append-only send-state for incidents:
`{ incident_id, type, last_updated_at, updates_signature?, '@timestamp' }`.
Read: latest by `incident_id.keyword`, `@timestamp desc`, size 1.

**9. `status-maintenance-notification-sent`** — `{ maintenance_id, '@timestamp' }`;
existence of any doc for `maintenance_id.keyword` means "already emailed".

**10. `page-feedback`** — `{ page_path, helpful ('yes'|'no'), message?, visitor_id, '@timestamp' }`;
id = `hash(feedback, pagePath, visitorId)` (one vote per page per visitor).

> The four topic guides (`ELASTICSEARCH_GUIDE.md`, `INTEGRATION_GUIDE.md`,
> `EMAIL_NOTIFICATIONS_GUIDE.md`, `STATUS_PAGE_DATA.md`) contain deeper detail on
> queries and index shapes. Where they disagree with this section, **this section
> and the code are authoritative** (see [Documentation map](#documentation-map--accuracy)).

---

## 9. Data flow & runtime behavior notes

- **Reads are cached** ~15s in-memory per Node instance (`src/lib/status/cache.ts`).
- **Rate limiting** (`src/lib/rate-limit.ts`) is an in-memory fixed-window map,
  **per Node instance** — it does not coordinate across replicas. Behind a
  multi-instance deploy, add edge/WAF rate limiting too.
- **Actions:** `vote` (20/60s per voter, 60/60s per IP), `subscribe` (5/60s,
  15/60s per IP), `feedback` (10/60s, 30/60s per IP). All validate with Zod and
  dedup atomically via deterministic ES doc IDs.
- **Status page** (`/roadmap/status`): service health + 90-day uptime + external
  systems come from **ES**; the *Known Issues / Scheduled maintenance / Recent
  incidents* sections come from **Markdown** collections. On ES failure it shows
  honest `UNKNOWN`/empty.
- **Dead-ish code:** the ES incident/maintenance *read* functions
  (`getIncidents`, `getRecentIncidents`, `getScheduledMaintenance`,
  `getIncidentById`, and the `fetch*` wrappers) are **not used by any page** — the
  page is Markdown-driven. They remain alive only through the notification job.
  A future dev could either delete them or switch the page to ES.
- `getStatusSummary` hardcodes `incidentCount: 0`. Capability descriptions are
  never populated from real ES (only mock data has descriptions). Several
  capability items are hardcoded `HEALTHY`.

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
(`https://example.com`), `rss.xml.ts` fallback, `.env.example` `SITE_URL`
(`…example.gov`), and the subscribe input placeholder `your@email.gov`.

**All bundled content is demo/sample data** and should be replaced:
`src/content/roadmap/*`, `feature-requests/*`, `releases/*`,
`status/{active-incidents,maintenance,recent-incidents}/*`, and the ES
`mock-data.ts` fixtures (includes an "Acme Corp" workspace).

**Missing engineering infrastructure** (none of this exists yet):
- **No tests** — no unit/integration/e2e, no test runner. Adding coverage for the
  ES write/dedup paths, actions, rate limiter, and the notification decision
  logic is high value.
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
- Per-subscriber email delivery tracking (to stop duplicate incident emails on
  partial-batch retry).
- Distributed rate limiting / caching for multi-instance deploys.
- Reconcile the incidents/maintenance source-of-truth split (§6.3).

---

## Documentation map & accuracy

| Doc | Scope | Status |
|-----|-------|--------|
| `HANDOFF.md` (this) | Architecture, integrations, ES indices, env, outstanding | **Canonical** |
| `CONTENT_GUIDE.md` | How to edit every content type | **Canonical** |
| `STATUS_PAGE_DATA.md` | Status page Markdown sections | Accurate |
| `ELASTICSEARCH_GUIDE.md` | ES index shapes & queries | Useful, but: incorrectly says `STATUS_FETCH_TIMEOUT_MS` is unused (it **is** read); lists `STATUS_ERROR_RATE_*`/`STATUS_LATENCY_P95_*` threshold vars that **no code reads**; implies ES drives the incidents/maintenance UI (it's Markdown). |
| `INTEGRATION_GUIDE.md` | End-to-end integration | Useful, but: collection names/paths are **stale** (says `statusIncidents`/`statusAnnouncements` under `src/content/status/incidents|announcements`; actual are `statusActiveIncidents`/`statusMaintenance`/`statusRecentIncidents` + `releases`); says Astro 5.x (actual **7.x**). |
| `EMAIL_NOTIFICATIONS_GUIDE.md` | Subscribe + email pipeline | Mostly accurate; the email body contract is `{ to, subject, body }`. |

When in doubt, **the code and this document win.**
