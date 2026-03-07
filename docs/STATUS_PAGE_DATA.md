# Status Page: Data Sources and Updates

This document explains what data appears on the status page, where it comes from, and how to update it.

---

## Automatically from Elasticsearch

The following data is **pulled automatically** from Elasticsearch via the Node/Express status API. No manual edits are required—it updates when the backend fetches fresh data (on each page load).

| Section | Source | Elasticsearch Index | Description |
|---------|--------|---------------------|-------------|
| **Global status header** | API `/summary` | `status-core-services` | Overall platform level and message derived from core service status |
| **Core services** | API `/summary` | `status-core-services` | Service name, status, error rate, latency, last updated |
| **Capabilities** | API `/summary` | `status-core-services` | Mapped from core services (Analyst Workspace, Operations, Shared Platform) |
| **Workspaces** | API `/workspaces` | `status-workspaces` | Workspace list with derived status |
| **Workspace feature status** | API `/workspaces/:id/features` | `status-workspaces` | Per-workspace feature health |
| **Connected services** | API `/external-systems` | `status-external-systems` | External systems and dependencies |
| **Active incidents** | API `/incidents` | `status-incidents` | Current incidents (title, description, workaround, updates) |
| **Incident detail** | API `/incidents/:id` | `status-incidents` | Single incident with full history |
| **Recent incidents** | API `/incidents/recent` | `status-incidents` | Resolved incidents from last 90 days |
| **Scheduled maintenance** | API `/scheduled-maintenance` | `status-scheduled-maintenance` | Upcoming maintenance windows |
| **90-day uptime** | API `/uptime` | `status-core-services`, `status-incidents` | Daily status derived from core services and incidents |

**Backend configuration:** Index names and time windows are set via environment variables (see `.env.example`). The backend queries Elasticsearch using `@timestamp` and other fields; ensure your observability pipeline writes to these indices.

---

## Manually Updated Content

The following can be **updated manually** without changing Elasticsearch or the API.

### 1. Incident workarounds and updates (Markdown)

**Purpose:** Add or override human-authored workarounds and status updates during an outage. Useful when you need to publish a quick message before the incident is fully logged in Elasticsearch.

**Location:** `roadmap/src/content/status/incidents/`

**How to update:**

1. Create or edit a `.md` file in `roadmap/src/content/status/incidents/`
2. Use this frontmatter and body:

```yaml
---
incidentId: "inc-001"        # Optional: links to API incident by ID
title: "Storage service and S3 gateway outage"
severity: "OUTAGE"           # HEALTHY | DEGRADED | OUTAGE | MAINTENANCE | UNKNOWN
workaround: "Existing files remain accessible. For urgent uploads, use the legacy endpoint or contact support."
---
## Updates
- 14:30 — Identified cause, deploying fix
- 15:00 — Fix deployed, monitoring
```

3. Commit and deploy. The Markdown body is rendered as the incident updates section.

**Note:** The Markdown collections are set up for quick edits. Merge logic (combining API incident data with Markdown overrides) may need to be implemented in the status page components if you want Markdown to augment or override API data.

### 2. Maintenance announcements (Markdown)

**Purpose:** Add or override maintenance announcements. Useful for ad-hoc or urgent maintenance notices.

**Location:** `roadmap/src/content/status/announcements/`

**How to update:**

1. Create or edit a `.md` file in `roadmap/src/content/status/announcements/`
2. Use this frontmatter:

```yaml
---
title: "Search index rebuild"
scheduledStart: "2025-03-10T02:00:00Z"
scheduledEnd: "2025-03-10T02:30:00Z"
status: "scheduled"          # scheduled | in_progress | completed
---
Search may be briefly unavailable during this window.
```

3. Commit and deploy.

**Note:** As with incidents, merge logic may be needed to combine these with API maintenance data on the status page.

### 3. Subscribe form

**Purpose:** Users can enter an email or webhook to receive incident notifications.

**Current state:** The form is displayed and shows a "Thanks!" message on submit. Backend integration (persisting subscribers, sending notifications) is **not yet implemented** and must be wired to your notification system.

---

## Summary

| Data | Source | How to update |
|------|--------|---------------|
| Core services, workspaces, external systems | Elasticsearch | Update your observability pipeline / telemetry to write to the status indices |
| Incidents (active, recent, detail) | Elasticsearch | Create/update incident records in `status-incidents` index |
| Scheduled maintenance | Elasticsearch | Create/update records in `status-scheduled-maintenance` index |
| 90-day uptime | Elasticsearch | Derived from core services and incidents; no direct edit |
| Incident workarounds/updates (override) | Markdown | Edit `.md` in `roadmap/src/content/status/incidents/` |
| Maintenance announcements (override) | Markdown | Edit `.md` in `roadmap/src/content/status/announcements/` |
| Subscribers | (Not yet wired) | Implement backend subscribe API and notification delivery |
