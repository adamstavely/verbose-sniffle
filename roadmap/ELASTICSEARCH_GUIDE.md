# Elasticsearch setup and operations

> **Companion to [HANDOFF.md](./HANDOFF.md).** HANDOFF §8 is the quick index +
> env reference; this guide adds the operational depth — cluster privileges,
> query semantics, per-index field tables, and example mappings.

This guide is the **operational reference** for connecting Elasticsearch to the
app. **Normative field shapes** are defined in TypeScript in
`src/lib/status/elastic-status.ts` (read paths) and in the
vote/feedback modules (write paths). This document
describes behavior and tuning so platform engineers can provision indices,
credentials, and pipelines correctly.

> **Two things people get wrong — read this first:**
> - The status **page** renders its Known Issues (active incidents), Scheduled
>   Maintenance, and Recent Incidents from **Markdown** (`src/content/status/**`),
>   **not** from the `status-incidents` / `status-scheduled-maintenance` ES
>   indices. Editing Markdown updates the page. See
>   [CONTENT_GUIDE.md §6](./CONTENT_GUIDE.md#6-system-status-content).
> - `status-core-services` and `status-workspaces` **are** read live by the
>   status page (Service health, workspace detail). `status-incidents` is read
>   live only by the 90-day uptime computation. **Connected services is no longer
>   an ES index** — it is a static TypeScript data file
>   (`src/lib/status/connected-services.ts`); see
>   [HANDOFF.md](./HANDOFF.md) / [CONTENT_GUIDE.md](./CONTENT_GUIDE.md).

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
| Incidents | `status-incidents` | `ELASTICSEARCH_INDEX_INCIDENTS` |
| Scheduled maintenance | `status-scheduled-maintenance` | `ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE` |

**Workspaces index:** Both **workspace-level** rows (aggregate workspace status) and **feature-level** rows (per feature inside a workspace) use the **same** index. Documents are distinguished by populated fields (`workspace_id` + optional `feature_id`).

> **Connected services is not an Elasticsearch index.** It is a hand-curated
> TypeScript data file (`CONNECTED_SYSTEMS` in
> `src/lib/status/connected-services.ts`). There is no `status-external-systems`
> index. See [HANDOFF.md](./HANDOFF.md) / [CONTENT_GUIDE.md](./CONTENT_GUIDE.md).

### 1.2 Application-owned indices

The Astro server **writes** these via Actions.

| Concern | Default index name | Env override | Source module |
|---------|-------------------|--------------|---------------|
| Roadmap votes | `roadmap-votes` | `ELASTICSEARCH_INDEX_ROADMAP_VOTES` | `src/lib/votes/elastic-votes.ts` |
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
- `status-incidents`
- `status-scheduled-maintenance`

**Read + write** (index + `write` for bulk/index APIs):

- `roadmap-votes`
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
| `ELASTICSEARCH_INDEX_INCIDENTS` | `status-incidents` | Incidents |
| `ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE` | `status-scheduled-maintenance` | Maintenance windows |
| `ELASTICSEARCH_INDEX_ROADMAP_VOTES` | `roadmap-votes` | Votes |
| `ELASTICSEARCH_INDEX_PAGE_FEEDBACK` | `page-feedback` | Feedback |

Authoritative copy-paste list: `roadmap/.env.example`.

### 4.2 Status behavior

| Variable | Default | Role |
|----------|---------|------|
| `STATUS_ENVIRONMENT` | _(fallback `production` in code)_ | Label shown in the status summary (e.g. `production`, `staging`) |
| `STATUS_TIME_WINDOW_MINUTES` | `5` | Rolling window for the live **telemetry** queries (core services, workspaces). See [§5](#5-query-semantics-and-tuning). |
| `STATUS_FETCH_TIMEOUT_MS` | `15000` | Per-request Elasticsearch timeout in ms; also sets `maxRetries: 1`. Set to `0` to disable the timeout. Read in `elastic-client.ts`. |
| `PUBLIC_USE_MOCK_STATUS` | _(unset)_ | When `true`, status data is read from in-memory mock data; **no Elasticsearch calls for status** (votes/feedback still use ES if invoked) |

> **There are no error-rate / latency threshold variables.** `status_level`
> comes **directly from the Elasticsearch documents** your pipeline writes — the
> app does not compute a level from `error_rate` / `latency_p95_ms`. (Older drafts
> mentioned `STATUS_ERROR_RATE_*` / `STATUS_LATENCY_P95_*`; no code reads them and
> they are not in `.env.example`.)

---

## 5. Query semantics and tuning

Understanding these behaviors avoids “empty UI” surprises.

### 5.1 Telemetry: core services, workspaces

- **Time field:** `@timestamp`
- **Window:** last `STATUS_TIME_WINDOW_MINUTES` minutes
- **Logic:** Results sorted by `@timestamp` descending; the app keeps the **latest document per entity** (`service_id`, `workspace_id` / `feature_id`)

If nothing falls in the window, sections appear empty or “unknown” without necessarily throwing an error. For Service health specifically the app never fabricates a `HEALTHY` state when no docs exist — see [§6.2](#62-status-core-services-read).

### 5.2 Incidents, recent incidents & maintenance — the ES read path is unused by the page

`elastic-status.ts` still contains ES read functions for incidents
(`getIncidents`), recent incidents (`getRecentIncidents`), scheduled maintenance
(`getScheduledMaintenance`), and incident-by-id (`getIncidentById`), plus their
`fetch*` wrappers. **None of these are called by any page.** The status page and
the incident detail page render these three sections from **Markdown content
collections** (`src/content/status/**`) instead — see
[CONTENT_GUIDE.md §6](./CONTENT_GUIDE.md#6-system-status-content). Treat these ES
functions as dead code for the UI (a future dev may delete them or re-wire the
page to ES). The **only** live ES read of `status-incidents` is the 90-day uptime
computation in §5.3.

### 5.3 Uptime (90 days)

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

This index backs the status page's **Service health** section. The section is
**not** hardcoded: the app renders a **flat list of whatever documents exist** in
`status-core-services`, read via `getStatusSummary()` in
`src/lib/status/elastic-status.ts`. There is no fixed catalog of service or
capability IDs (the old `capability-groups.ts` catalog was deleted).

| Field | Notes |
|-------|--------|
| `@timestamp` | ISO 8601 date. The page reads the **latest doc per `service_id`** within the last `STATUS_TIME_WINDOW_MINUTES` (default 5). |
| `service_id` | keyword. Unique/stable id for the service; the **dedup key** (latest doc in the window wins). Fallback to `_id` if absent. |
| `service_name` | text/keyword. Display label shown on the page. |
| `status_level` | keyword, one of `HEALTHY` \| `DEGRADED` \| `OUTAGE` \| `MAINTENANCE` \| `UNKNOWN`. Taken **directly** from the doc — the app computes no thresholds. |
| `impact_description` | Optional text. If present, the service row is **expandable** and shows this as a user-facing impact note (use it when the service is not healthy). |
| `error_rate` | Optional float. Stored/available but **not** used to compute `status_level` and not shown as a headline number. |
| `latency_p95_ms` | Optional float. Same: available but not used to compute `status_level`. |

**Rendering behavior:**

- The page shows **one row per `service_id`** (latest doc in the time window),
  each with a status dot + name + status pill. Rows that carry an
  `impact_description` are **expandable** to reveal it.
- The overall page status badge is the **worst** `status_level` across all
  services, using the order `OUTAGE > DEGRADED > MAINTENANCE > UNKNOWN > HEALTHY`.
  (`incidentCount` is hardcoded to `0` and unused.)
- If **no** core-service docs exist in the window, Service health shows an
  empty/unknown state — the app **never fabricates** a `HEALTHY` service.

### 6.3 Adding a service to the status page

Because Service health is a flat projection of `status-core-services`, adding or
removing a service is a **data operation, not a code change** — **no code edit and
no redeploy** are required.

**To add a service:** index a document into `status-core-services` with a **new
`service_id`**, plus `service_name`, `status_level`, and a current `@timestamp`
(and optionally `impact_description` when the service is not healthy). It appears
automatically on the next render, as long as a doc for that `service_id` falls
within the last `STATUS_TIME_WINDOW_MINUTES`.

**To remove a service:** stop writing documents for that `service_id`. Once its
latest doc ages out of the time window, the row drops off the page.

Example document:

```json
POST status-core-services/_doc
{
  "@timestamp": "2026-07-04T12:00:00Z",
  "service_id": "search-api",
  "service_name": "Search API",
  "status_level": "DEGRADED",
  "impact_description": "Elevated latency on search; results may load slowly.",
  "error_rate": 0.021,
  "latency_p95_ms": 840
}
```

Example mapping for these fields:

```json
PUT status-core-services
{
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "service_id": { "type": "keyword" },
      "service_name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "status_level": { "type": "keyword" },
      "impact_description": { "type": "text" },
      "error_rate": { "type": "float" },
      "latency_p95_ms": { "type": "float" }
    }
  }
}
```

### 6.4 `status-workspaces` (read)

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

### 6.5 `status-incidents` (read)

Read live only by the 90-day uptime computation ([§5.3](#53-uptime-90-days)); the
uptime bar merges core-service telemetry with incident spans. The other read
functions over this index are pre-existing and **not used by the UI**.

| Field | Notes |
|-------|--------|
| `@timestamp` | Fallback for timing |
| `incident_id` | Stable id |
| `title` | |
| `status_level` | |
| `started_at` | Used for sorting and time windows |
| `resolved_at` | Optional; marks the end of the incident span for uptime |
| `description` | |
| `updates` | Array of `{ timestamp, message, status? }` |
| `affected_workspace_ids`, `affected_core_service_ids`, `affected_external_system_ids` | Optional ID arrays (the last is a plain ID reference; there is no external-systems index) |

### 6.6 `status-scheduled-maintenance` (read)

A pre-existing read function exists over this index, but it is **not used by the
UI** — the page's Scheduled Maintenance section is Markdown-driven
([CONTENT_GUIDE.md §6](./CONTENT_GUIDE.md#6-system-status-content)).

| Field | Notes |
|-------|--------|
| `@timestamp` | |
| `maintenance_id` | |
| `title`, `description` | |
| `scheduled_start`, `scheduled_end` | ISO strings |
| `status` | e.g. `SCHEDULED` \| `IN_PROGRESS` \| `COMPLETED` |
| `affected_core_service_ids`, `affected_external_system_ids` | Optional ID arrays (the last is a plain ID reference; there is no external-systems index) |

### 6.7 `roadmap-votes` (write + read)

| Field | Notes |
|-------|--------|
| `feature_request_id` | Matched with `term` on `feature_request_id.keyword` |
| `voter_id` | Cookie-derived id; `term` on `voter_id.keyword` |
| `@timestamp` | Set on index |

**Aggregations:** `terms` on `feature_request_id.keyword` (size 500) for vote counts.

### 6.8 `page-feedback` (write)

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
PUT page-feedback
{
  "mappings": {
    "properties": {
      "page_path": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "visitor_id": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "helpful": { "type": "keyword" },
      "message": { "type": "text" },
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
| Service health | `_search` `status-core-services` with a `range` on `@timestamp` for `STATUS_TIME_WINDOW_MINUTES`; each `service_id` renders as a row on `/roadmap/status` |
| Status page | `GET /roadmap/status` returns `200`; server-rendered telemetry (Unknown state if ES is unreachable) |
| Mock mode | `PUBLIC_USE_MOCK_STATUS=true` shows mock status without ES reads for status fetch |

---

## 9. Related documentation

- [HANDOFF.md](./HANDOFF.md) — architecture, the full index list (§8), env reference, and integrations to wire up
- [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) — editing the Markdown-driven status sections (incidents, maintenance, recent), and the static Connected services data file

Code references: `src/lib/status/elastic-client.ts`, `src/lib/status/status-config.ts`, `src/lib/status/elastic-status.ts`, `src/lib/status/fetch-status.ts`.
