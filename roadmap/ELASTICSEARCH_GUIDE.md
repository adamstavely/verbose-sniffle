# Elasticsearch setup and operations

> **Companion to [HANDOFF.md](./HANDOFF.md).** HANDOFF §8 is the quick index +
> env reference; this guide adds the operational depth — cluster privileges,
> query semantics, per-index field tables, and example mappings.

This guide is the **operational reference** for connecting Elasticsearch to the
app. **Normative field shapes** are defined in TypeScript in
`src/lib/status/elastic-status.ts` (read paths) and in the
vote/subscriber/feedback/notification modules (write paths). This document
describes behavior and tuning so platform engineers can provision indices,
credentials, and pipelines correctly.

> **Two things people get wrong — read this first:**
> - The status **page** renders its Known Issues (active incidents), Scheduled
>   Maintenance, and Recent Incidents from **Markdown** (`src/content/status/**`),
>   **not** from the `status-incidents` / `status-scheduled-maintenance` ES
>   indices. Those two ES indices are read **only** by the email-notification job
>   (`/api/notify/run`). Editing Markdown updates the page; writing those ES docs
>   sends emails. See [CONTENT_GUIDE.md §6](./CONTENT_GUIDE.md#6-system-status-content).
> - `status-core-services`, `status-workspaces`, and `status-external-systems`
>   **are** read live by the status page (service health, 90-day uptime,
>   connected systems).

---

## Table of contents

1. [Architecture and responsibilities](#1-architecture-and-responsibilities)
2. [Connectivity and authentication](#2-connectivity-and-authentication)
3. [Suggested cluster privileges](#3-suggested-cluster-privileges)
4. [Environment variables](#4-environment-variables)
5. [Query semantics and tuning](#5-query-semantics-and-tuning)
6. [Indices and fields](#6-indices-and-fields)
7. [Mappings and index creation](#7-mappings-and-index-creation)
8. [Verification checklist](#8-verification-checklist)
9. [Related documentation](#9-related-documentation)

---

## 1. Architecture and responsibilities

The app uses a single Elasticsearch client (`@elastic/elasticsearch`) created in `src/lib/status/elastic-client.ts`. All server-side access goes through that client; the browser never talks to Elasticsearch directly.

### 1.1 Pipeline / observability–owned indices

These indices hold **telemetry and operational documents** that **your stack must write**. The app **reads only** (search, aggregate, latest-per-entity logic).

| Concern | Default index name | Env override |
|---------|-------------------|--------------|
| Core services | `status-core-services` | `ELASTICSEARCH_INDEX_CORE_SERVICES` |
| Workspaces and workspace features | `status-workspaces` | `ELASTICSEARCH_INDEX_WORKSPACES` |
| External systems | `status-external-systems` | `ELASTICSEARCH_INDEX_EXTERNAL_SYSTEMS` |
| Incidents | `status-incidents` | `ELASTICSEARCH_INDEX_INCIDENTS` |
| Scheduled maintenance | `status-scheduled-maintenance` | `ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE` |

**Workspaces index:** Both **workspace-level** rows (aggregate workspace status) and **feature-level** rows (per feature inside a workspace) use the **same** index. Documents are distinguished by populated fields (`workspace_id` + optional `feature_id`).

### 1.2 Application-owned indices

The Astro server **writes** these via Actions and notification jobs.

| Concern | Default index name | Env override | Source module |
|---------|-------------------|--------------|---------------|
| Roadmap votes | `roadmap-votes` | `ELASTICSEARCH_INDEX_ROADMAP_VOTES` | `src/lib/votes/elastic-votes.ts` |
| Status email subscribers | `status-subscribers` | `ELASTICSEARCH_INDEX_STATUS_SUBSCRIBERS` | `src/lib/notifications/elastic-subscribers.ts` |
| Incident notification dedupe | `status-notification-sent` | `ELASTICSEARCH_INDEX_STATUS_NOTIFICATION_SENT` | `src/lib/notifications/notification-state.ts` |
| Maintenance notification dedupe | `status-maintenance-notification-sent` | `ELASTICSEARCH_INDEX_STATUS_MAINTENANCE_NOTIFICATION_SENT` | `src/lib/notifications/maintenance-notification-state.ts` |
| Page feedback | `page-feedback` | `ELASTICSEARCH_INDEX_PAGE_FEEDBACK` | `src/lib/feedback/elastic-feedback.ts` |

---

## 2. Connectivity and authentication

### 2.1 URL

| Variable | Description |
|----------|-------------|
| `ELASTICSEARCH_URL` | Cluster URL, e.g. `https://my-deployment.es.region.cloud.es.io:443`. If unset, the client defaults to `http://localhost:9200` (local development). |

Use **HTTPS** in production. The Node server resolves DNS and opens TLS to this host from your **deployment runtime** (container, VM, etc.).

### 2.2 API key

| Variable | Description |
|----------|-------------|
| `ELASTICSEARCH_API_KEY` | Optional. When set, the client uses Elasticsearch **API key** authentication (`auth: { apiKey }`). When unset, the client connects without API key (appropriate only for local/dev or network-isolated clusters). |

Create an API key in Kibana **Stack Management → API keys** (or your cloud console) with privileges matching [section 3](#3-suggested-cluster-privileges). Store the key in the host’s secret manager, not in the repo.

### 2.3 Network path

- The Node server opens connections to Elasticsearch from the **deployment
  runtime** (container/VM). The cluster must accept those connections — public
  internet with TLS + API key, or an in-VPC/tunnelled endpoint.
- **VPC / private clusters**: run the Astro server in the same VPC or use a
  secure tunnel/proxy so `ELASTICSEARCH_URL` is reachable from the process.
- Corporate clusters often require **IP allowlisting** or a **proxy** in front of
  Elasticsearch.

---

## 3. Suggested cluster privileges

Adjust names if you override `ELASTICSEARCH_INDEX_*`. Principle: **read** telemetry indices; **read + write** app-owned indices.

**Read** (e.g. `read` cross-index or index patterns):

- `status-core-services`
- `status-workspaces`
- `status-external-systems`
- `status-incidents`
- `status-scheduled-maintenance`

**Read + write** (index + `write` for bulk/index APIs):

- `roadmap-votes`
- `status-subscribers`
- `status-notification-sent`
- `status-maintenance-notification-sent`
- `page-feedback`

The app uses `search`, `index` (single-document writes), and aggregations (`terms` on `.keyword` fields). It does **not** use Elasticsearch index lifecycle APIs or `reindex` in this repository.

---

## 4. Environment variables

### 4.1 Connection and indices

| Variable | Default | Role |
|----------|---------|------|
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Cluster endpoint |
| `ELASTICSEARCH_API_KEY` | _(empty)_ | API key auth |
| `ELASTICSEARCH_INDEX_CORE_SERVICES` | `status-core-services` | Core service telemetry |
| `ELASTICSEARCH_INDEX_WORKSPACES` | `status-workspaces` | Workspaces + features |
| `ELASTICSEARCH_INDEX_EXTERNAL_SYSTEMS` | `status-external-systems` | External systems |
| `ELASTICSEARCH_INDEX_INCIDENTS` | `status-incidents` | Incidents |
| `ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE` | `status-scheduled-maintenance` | Maintenance windows |
| `ELASTICSEARCH_INDEX_ROADMAP_VOTES` | `roadmap-votes` | Votes |
| `ELASTICSEARCH_INDEX_STATUS_SUBSCRIBERS` | `status-subscribers` | Subscribers |
| `ELASTICSEARCH_INDEX_STATUS_NOTIFICATION_SENT` | `status-notification-sent` | Incident email dedupe |
| `ELASTICSEARCH_INDEX_STATUS_MAINTENANCE_NOTIFICATION_SENT` | `status-maintenance-notification-sent` | Maintenance email dedupe |
| `ELASTICSEARCH_INDEX_PAGE_FEEDBACK` | `page-feedback` | Feedback |

Authoritative copy-paste list: `roadmap/.env.example`.

### 4.2 Status behavior

| Variable | Default | Role |
|----------|---------|------|
| `STATUS_ENVIRONMENT` | _(fallback `production` in code)_ | Label shown in the status summary (e.g. `production`, `staging`) |
| `STATUS_TIME_WINDOW_MINUTES` | `5` | Rolling window for the live **telemetry** queries (core services, workspaces, external systems). See [§5](#5-query-semantics-and-tuning). |
| `NOTIFICATION_INCIDENT_WINDOW_MINUTES` | `1440` (24h) | Lookback for the **notification** incident and maintenance queries (`getIncidentsForNotifications`, `getMaintenanceForNotifications`) |
| `STATUS_FETCH_TIMEOUT_MS` | `15000` | Per-request Elasticsearch timeout in ms; also sets `maxRetries: 1`. Set to `0` to disable the timeout. Read in `elastic-client.ts`. |
| `PUBLIC_USE_MOCK_STATUS` | _(unset)_ | When `true`, status data is read from in-memory mock data; **no Elasticsearch calls for status** (votes/subscribe/feedback still use ES if invoked) |

> **There are no error-rate / latency threshold variables.** `status_level`
> comes **directly from the Elasticsearch documents** your pipeline writes — the
> app does not compute a level from `error_rate` / `latency_p95_ms`. (Older drafts
> mentioned `STATUS_ERROR_RATE_*` / `STATUS_LATENCY_P95_*`; no code reads them and
> they are not in `.env.example`.)

---

## 5. Query semantics and tuning

Understanding these behaviors avoids “empty UI” surprises and misconfigured notification windows.

### 5.1 Telemetry: core services, workspaces, external systems

- **Time field:** `@timestamp`
- **Window:** last `STATUS_TIME_WINDOW_MINUTES` minutes
- **Logic:** Results sorted by `@timestamp` descending; the app keeps the **latest document per entity** (`service_id`, `workspace_id` / `feature_id`, `system_id`)

If nothing falls in the window, sections appear empty or “unknown” without necessarily throwing an error.

### 5.2 Incidents, recent incidents & maintenance — the ES read path is unused by the page

`elastic-status.ts` still contains ES read functions for incidents
(`getIncidents`), recent incidents (`getRecentIncidents`), scheduled maintenance
(`getScheduledMaintenance`), and incident-by-id (`getIncidentById`), plus their
`fetch*` wrappers. **None of these are called by any page.** The status page and
the incident detail page render these three sections from **Markdown content
collections** (`src/content/status/**`) instead — see
[CONTENT_GUIDE.md §6](./CONTENT_GUIDE.md#6-system-status-content). Treat these ES
functions as dead code for the UI (a future dev may delete them or re-wire the
page to ES). The **only** live ES incident/maintenance reads are the notification
functions in §5.3.

### 5.3 Notifications (`getIncidentsForNotifications`, `getMaintenanceForNotifications`)

- **Incident window:** `NOTIFICATION_INCIDENT_WINDOW_MINUTES` (default 24h);
  query = docs where **`started_at` OR `resolved_at`** falls in `[now - window, now]`.
- **Maintenance:** `scheduled_start` within the window, `scheduled_end >= now`,
  excludes `COMPLETED`; sorted by `scheduled_start` ascending. One email round per
  maintenance id (dedupe index).
- These are the ES reads that actually matter for `status-incidents` /
  `status-scheduled-maintenance`. Used by `/api/notify/run` for email delivery
  (see [EMAIL_NOTIFICATIONS_GUIDE.md](./EMAIL_NOTIFICATIONS_GUIDE.md)).

### 5.4 Uptime (90 days)

- The status page's 90-day uptime bar **is** live ES: `getUptime90Days` loads
  `status-core-services` docs and `status-incidents` docs over 90 days and derives
  per-day `operational | degraded | unavailable` from `@timestamp` / `started_at`
  / `resolved_at`. On error it returns an empty series (the UI shows "unavailable").

---

## 6. Indices and fields

### 6.1 Status levels

All `status_level` fields should use the same enum the UI expects:

`HEALTHY` | `DEGRADED` | `OUTAGE` | `UNKNOWN` | `MAINTENANCE`

Defined in `src/lib/status/status-models.ts`.

### 6.2 `status-core-services` (read)

| Field | Notes |
|-------|--------|
| `@timestamp` | Used for time range and “last updated” |
| `service_id` | Stable id; fallback to `_id` |
| `service_name` | Display name |
| `status_level` | |
| `error_rate` | Optional; stored/available but not used to compute `status_level` |
| `latency_p95_ms` | Optional; stored/available but not used to compute `status_level` |

### 6.3 `status-workspaces` (read)

**Workspace row (example):**

| Field | Notes |
|-------|--------|
| `@timestamp` | |
| `workspace_id` | |
| `workspace_name` | |
| `owner_team` | Optional |
| `environment` | Optional; falls back to `STATUS_ENVIRONMENT` |
| `status_level` | |

**Feature row (same index):**

| Field | Notes |
|-------|--------|
| `@timestamp` | |
| `workspace_id` | Must match route param |
| `feature_id` | |
| `feature_name` | |
| `status_level` | |
| `degradation_summary` | Optional |
| `impacting_external_system_ids` | Optional string array |

Queries for features use `term` on `workspace_id` (not `.keyword` in code). Ensure your mapping supports exact matching (keyword or unanalyzed).

### 6.4 `status-external-systems` (read)

| Field | Notes |
|-------|--------|
| `@timestamp` | |
| `system_id` | |
| `system_name` | |
| `system_type` | `SAAS` \| `INTERNAL` \| `THIRD_PARTY_API` |
| `status_level` | |
| `latency_p95_ms`, `error_rate` | Optional |
| `impacted_core_service_ids`, `impacted_feature_ids` | Optional string arrays |

### 6.5 `status-incidents` (read)

| Field | Notes |
|-------|--------|
| `@timestamp` | Fallback for timing |
| `incident_id` | Stable id |
| `title` | |
| `status_level` | |
| `started_at` | Used for sorting and time windows |
| `resolved_at` | Optional; drives “resolved” emails and recent incidents |
| `description` | |
| `updates` | Array of `{ timestamp, message, status? }` |
| `affected_workspace_ids`, `affected_core_service_ids`, `affected_external_system_ids` | Optional |

### 6.6 `status-scheduled-maintenance` (read)

| Field | Notes |
|-------|--------|
| `@timestamp` | |
| `maintenance_id` | |
| `title`, `description` | |
| `scheduled_start`, `scheduled_end` | ISO strings |
| `status` | e.g. `SCHEDULED` \| `IN_PROGRESS` \| `COMPLETED` |
| `affected_core_service_ids`, `affected_external_system_ids` | Optional |

### 6.7 `roadmap-votes` (write + read)

| Field | Notes |
|-------|--------|
| `feature_request_id` | Matched with `term` on `feature_request_id.keyword` |
| `voter_id` | Cookie-derived id; `term` on `voter_id.keyword` |
| `@timestamp` | Set on index |

**Aggregations:** `terms` on `feature_request_id.keyword` (size 500) for vote counts.

### 6.8 `status-subscribers` (write + read)

| Field | Notes |
|-------|--------|
| `email` | Lowercase; dedupe with `term` on `email.keyword` |
| `@timestamp` | |

**Reads:** Up to 1000 subscriber emails per `getSubscribers()` call.

### 6.9 `status-notification-sent` (write + read)

| Field | Notes |
|-------|--------|
| `incident_id` | `term` on `incident_id.keyword` for latest state |
| `type` | `new` \| `update` \| `resolved` |
| `last_updated_at` | |
| `updates_signature` | Optional; for update detection |
| `@timestamp` | Sort desc for “latest” state |

The app **appends** documents; latest notification state is the newest `@timestamp` for that `incident_id`.

### 6.10 `status-maintenance-notification-sent` (write + read)

| Field | Notes |
|-------|--------|
| `maintenance_id` | `term` on `maintenance_id.keyword` — any hit means “already notified” |
| `@timestamp` | |

### 6.11 `page-feedback` (write)

| Field | Notes |
|-------|--------|
| `page_path` | `term` on `page_path.keyword` |
| `visitor_id` | `term` on `visitor_id.keyword` |
| `helpful` | `yes` \| `no` |
| `message` | Optional, truncated to 500 chars |
| `@timestamp` | |

One submission per `(page_path, visitor_id)` pair.

---

## 7. Mappings and index creation

This repository **does not** ship Elasticsearch index templates or ILM policies. In production you should either:

1. **Create indices (or templates) explicitly** with `date`, `keyword`, `text`, and **`fields.keyword`** where the app uses `.keyword` in `term` queries, or  
2. Rely on **dynamic mapping** and verify in a non-production cluster that `term` queries and `terms` aggregations behave as expected (Elasticsearch’s default dynamic templates often add `.keyword` for strings).

Example Dev Tools pattern (illustrative only—adjust versions and settings):

```json
PUT status-subscribers
{
  "mappings": {
    "properties": {
      "email": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "@timestamp": { "type": "date" }
    }
  }
}
```

Repeat similarly for other indices using the field tables above.

---

## 8. Verification checklist

After deployment:

| Check | Action |
|-------|--------|
| Cluster reachable | From the same network as the app server, `curl` or Kibana against `ELASTICSEARCH_URL` |
| API key | Same key in env as used for manual `_search` |
| Telemetry | `_search` on each telemetry index with a `range` on `@timestamp` matching `STATUS_TIME_WINDOW_MINUTES` |
| Votes | Visit `/roadmap`, vote; confirm document in `roadmap-votes` |
| Subscribers | Submit subscribe form; confirm document in `status-subscribers` with `email.keyword` query |
| Status page | `GET /roadmap/status` returns `200`; server-rendered telemetry (Unknown state if ES is unreachable) |
| Mock mode | `PUBLIC_USE_MOCK_STATUS=true` shows mock status without ES reads for status fetch |

---

## 9. Related documentation

- [HANDOFF.md](./HANDOFF.md) — architecture, the full index list (§8), env reference, and integrations to wire up
- [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) — editing the Markdown-driven status sections (incidents, maintenance, recent)
- [EMAIL_NOTIFICATIONS_GUIDE.md](./EMAIL_NOTIFICATIONS_GUIDE.md) — subscribers, `/api/notify/run`, email HTTP API

Code references: `src/lib/status/elastic-client.ts`, `src/lib/status/status-config.ts`, `src/lib/status/elastic-status.ts`, `src/lib/status/fetch-status.ts`.
