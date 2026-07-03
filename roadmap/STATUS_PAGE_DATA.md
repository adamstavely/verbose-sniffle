# Status Page: Data Sources and Updates

This document explains what data appears on the status page, where it comes from, and how to update it.

The status hub is a **hybrid**: live service telemetry is pulled from Elasticsearch (with a mock-data fallback when the cluster is unreachable), while incident and maintenance **content** is authored in Markdown. Data fetching goes through [`src/lib/status/fetch-status.ts`](src/lib/status/fetch-status.ts) (Elasticsearch, `fetch-status`/`elastic-status`) and [`src/lib/status/status-content.ts`](src/lib/status/status-content.ts) (Markdown collections).

---

## Automatically from Elasticsearch

The following data is **pulled automatically** from Elasticsearch on each request by the on-demand (`prerender = false`) status routes. No manual edits are required. If Elasticsearch is unreachable (or `PUBLIC_USE_MOCK_STATUS=true`), these fall back to `src/lib/status/mock-data.ts`.

| Section | Source | Elasticsearch Index | Description |
|---------|--------|---------------------|-------------|
| **Global status header** | `getStatusSummary()` | `status-core-services` | Overall platform level and message derived from core service status |
| **Service health / capabilities** | `getStatusSummary()` → `buildCapabilityGroups()` | `status-core-services` | Core services mapped into capability groups (Analyst Workspace, Operations, Shared Platform) |
| **90-day uptime** | `getUptime90Days()` | `status-core-services`, `status-incidents` | Daily status derived from core services and incidents |
| **Connected services** | `getExternalSystemStatuses()` | `status-external-systems` | External systems and dependencies (`/roadmap/status/external-systems`) |
| **Workspaces** | `getWorkspaceStatuses()` | `status-workspaces` | Workspace list with derived status |
| **Workspace feature status** | `getWorkspaceFeatureStatuses()` | `status-workspaces` | Per-workspace feature health (`/roadmap/status/workspaces/:id`) |

**Configuration:** Index names and time windows are set via environment variables (see [`.env.example`](.env.example)). The Astro server queries Elasticsearch using `@timestamp` and other fields; ensure your observability pipeline writes to these indices.

---

## From Markdown content collections

Incident and maintenance **content** is authored as Markdown under `src/content/status/` and read via [`status-content.ts`](src/lib/status/status-content.ts). Schemas live in [`src/content.config.ts`](src/content.config.ts). Field reference is also in the root [`README.md`](../README.md) (section **Status page (Markdown)**).

### 1. Active incidents

**Purpose:** The active-issues list on the hub and the detail page at `/roadmap/status/incidents/:id`.

**Location:** `src/content/status/active-incidents/`

**How to update:** create or edit a `.md` file (body is optional extra copy):

```yaml
---
id: "inc-001"
title: "Storage service and S3 gateway outage"
level: "OUTAGE"              # HEALTHY | DEGRADED | OUTAGE | MAINTENANCE | UNKNOWN
startedAt: "2026-04-10T14:30:00Z"
workaround: "Existing files remain accessible for download. For urgent uploads, use the legacy endpoint or contact support."
aiNote: "Document analysis features that depend on new uploads show reduced confidence until storage is restored."
updates:
  - timestamp: "2026-04-10T14:30:00Z"
    message: "Identified cause: S3 gateway connectivity."
    status: "Identified"
  - timestamp: "2026-04-10T15:00:00Z"
    message: "Fix deployed, monitoring."
    status: "Monitoring"
---
Optional Markdown body rendered on the incident detail page.
```

### 2. Scheduled maintenance

**Purpose:** Upcoming/active maintenance windows on the hub.

**Location:** `src/content/status/maintenance/`

```yaml
---
id: "maint-001"
title: "Search index rebuild"
scheduledStart: "2026-04-11T02:00:00Z"
scheduledEnd: "2026-04-11T02:30:00Z"
status: "SCHEDULED"          # SCHEDULED | IN_PROGRESS | COMPLETED
description: "Search may be briefly unavailable during this window."
---
```

Completed windows (`status: COMPLETED`) are filtered out of the hub automatically.

### 3. Recent incidents

**Purpose:** The resolved-incident history table (last 90 days).

**Location:** `src/content/status/recent-incidents/`

```yaml
---
id: "INC-2831"
date: "Mar 4"
title: "Elevated search latency"
duration: "38 min"
severity: "DEGRADED"         # HEALTHY | DEGRADED | OUTAGE | MAINTENANCE | UNKNOWN
cause: "Elastic index rebalancing during peak hours."
sortOrder: 3                 # optional; higher sorts first
---
```

---

## Forms (Astro Actions → Elasticsearch)

### Subscribe

Users enter an email to receive incident and scheduled-maintenance notifications. Subscribers are stored in Elasticsearch (`status-subscribers` index) via the `subscribe` Action. On subscribe, a confirmation email is sent when the email service is configured. When incidents occur or new scheduled maintenance appears, the notification job sends emails via your internal email service. Configure `EMAIL_SERVICE_URL` and `EMAIL_SERVICE_API_KEY` in `.env`, and trigger delivery with an authenticated `POST /api/notify/run` (`Authorization: Bearer NOTIFY_WEBHOOK_SECRET`) from cron/CI; the endpoint fails closed if the secret is unset. See [`.env.example`](.env.example) and [`EMAIL_NOTIFICATIONS_GUIDE.md`](EMAIL_NOTIFICATIONS_GUIDE.md).

### Voting & page feedback

Feature-request votes (`roadmap-votes`) and page feedback (`page-feedback`) are also stored in Elasticsearch via the `vote` and `feedback` Actions.

---

## Summary

| Data | Source | How to update |
|------|--------|---------------|
| Status header, service health, 90-day uptime | Elasticsearch | Update your observability pipeline to write to `status-core-services` / `status-incidents` |
| Workspaces, workspace features, connected services | Elasticsearch | Write to `status-workspaces` / `status-external-systems` |
| Active incidents (list + detail) | Markdown | Edit `.md` in `src/content/status/active-incidents/` |
| Scheduled maintenance | Markdown | Edit `.md` in `src/content/status/maintenance/` |
| Recent incidents | Markdown | Edit `.md` in `src/content/status/recent-incidents/` |
| Subscribers, votes, feedback | Elasticsearch | Forms on the site (Astro Actions) |
