# Content Update Guide

How to add and edit every piece of content in the Help Center — guides, release
notes, the roadmap, feature requests, the status page, role "journeys," the
homepage, and tags. No framework knowledge is required for most of this; you
edit Markdown/MDX files and the site rebuilds.

> **Where things live:** everything is under `roadmap/`. Content is either an
> **Astro content collection** (Markdown files under `src/content/…`, validated
> by a schema) or an **MDX doc page** (a `.mdx` file that *is* a page under
> `src/pages/…`). This guide covers both.

> **After editing:** run `npm run build` (or `npm run dev` for a live preview).
> Enums are **case-sensitive** — `OUTAGE`, `SCHEDULED`, `in-progress` must match
> exactly. Run `npm run check` to catch schema/type errors.

**Contents**
1. [User Guide & Developer Guide & About pages (MDX docs)](#1-doc-pages-user-guide--developer-guide--about)
2. [Role "journeys" (choose-your-path)](#2-role-journeys)
3. [Release Notes](#3-release-notes)
4. [Product Roadmap items](#4-product-roadmap-items)
5. [Feature requests (voting)](#5-feature-requests)
6. [System Status content](#6-system-status-content)
7. [Homepage cards](#7-homepage-cards)
8. [Tags](#8-tags)
9. [Support modal, illustrations, and other config](#9-support-modal-illustrations--misc)
10. [Quick reference table](#quick-reference)

---

## 1. Doc pages (User Guide / Developer Guide / About)

These are **MDX files that are themselves pages**. Sidebar nav, breadcrumbs,
"On this page" table of contents, reading time, "last updated," prev/next, and
"related" are all generated automatically — you just write the file.

### Where they live
| Section | Folder | URL |
|---------|--------|-----|
| About | `src/pages/about/*.mdx` | `/about/<slug>` |
| Developer Guide | `src/pages/developer-guide/*.mdx` | `/developer-guide/<slug>` |
| User Guide (Diátaxis) | `src/pages/user-guide/<category>/*.mdx` | `/user-guide/<category>/<slug>` |

The **User Guide** is organized with the [Diátaxis](https://diataxis.fr/)
framework into three categories: `tutorials`, `how-to`, and `reference`. Put
each page in the right subfolder. (Diátaxis's fourth mode, *Explanation*, is
covered by the **About** section rather than a User Guide category.)

### Frontmatter
```mdx
---
layout: ../../../layouts/MdxDocLayout.astro
title: Build your first project
description: Create a project and run your first analysis end to end.
order: 2
tags: ["Getting Started", "How-to"]
---

Your Markdown/MDX content here. Use `##` for section headings.
```

| Field | Required | Notes |
|-------|:--------:|-------|
| `layout` | ✔ | Path to `MdxDocLayout.astro`, **relative to the file** — see below |
| `title` | ✔ | Used for the `<h1>`, breadcrumb, nav label, and related cards |
| `description` | | Meta description + subtitle on nav/related cards |
| `order` | | Number; controls position in the sidebar, section index, and prev/next (default `99`) |
| `tags` | | Array of topic chips → each links to `/tags/<slug>` and powers "Related" |
| `prose` | | `true` by default (nice doc typography). Set `false` only for fully hand-styled MDX (the style guide does this) |

**The `layout` path depends on folder depth** (it is relative to the `.mdx` file):
- `about/` and `developer-guide/` pages (2 levels deep): `../../layouts/MdxDocLayout.astro`
- `user-guide/<category>/` pages (3 levels deep): `../../../layouts/MdxDocLayout.astro`

> **Do not set `minutesRead` or `lastUpdated`** — they are injected automatically
> (reading time from the content; "last updated" from the file's last git commit
> date, falling back to file modified time).

### Add a new doc page — steps
1. Create the `.mdx` file in the right folder (for User Guide, the right Diátaxis subfolder).
2. Add the frontmatter above (mind the relative `layout` path).
3. Write content. Every `##` heading becomes an entry in the "On this page" rail.
4. Save/build. It **automatically** appears in: the sidebar (positioned by `order`),
   the section's index page, prev/next within its section/category, and — for each
   tag — the `/tags/<slug>` and `/tags` pages. No registration needed.

### Add a new User Guide category
The three Diátaxis categories are defined in `src/lib/docs.ts`
(`USER_GUIDE_CATEGORIES`). To add another, add an entry there (slug → name,
order, description) and create the matching subfolder under
`src/pages/user-guide/`.

---

## 2. Role "journeys"

The **Tutorials** landing (`/user-guide/tutorials`) shows a **role picker**
(Analyst / Operations). Each role has **workflows**, and each workflow is a
short, ordered "journey" of links into existing doc pages. Journey pages
(`/user-guide/journeys/<id>`) are generated automatically.

### Edit roles/workflows
All data is in **`src/lib/role-guides.ts`**:
```ts
export const ROLE_GUIDES = [
  {
    slug: 'analyst',
    name: 'Analyst',
    tagline: 'Search, analyze, and annotate in the Analyst Workspace.',
    workflows: [
      {
        slug: 'get-set-up',
        title: 'Get set up',
        summary: 'Sign in, find your workspace, and learn the essentials.',
        links: [
          { label: 'Getting started', to: 'user-guide/tutorials/getting-started' },
          { label: 'Build your first project', to: 'user-guide/tutorials/first-project' },
        ],
      },
      // ...more workflows
    ],
  },
  // ...more roles
];
```
- To **add a workflow**: add a `{ slug, title, summary, links[] }` object. The
  journey page regenerates from `` `${role.slug}-${workflow.slug}` `` automatically.
- `links[].to` is a base-relative path to an existing page (no leading slash).

### ⚠️ Adding a new ROLE requires one component edit
The role tab picker is zero-JavaScript (pure CSS), and the CSS that shows each
role's panel is **hardcoded per slug** in `src/components/RoleGuides.astro`
(inside the `<style is:global>` block, e.g. `#rg-analyst:checked ~ #rg-panel-analyst`).
When you add a new role, copy the existing analyst/operations CSS rules and add
matching ones for your new slug — otherwise the new role's panel stays hidden.
(Editing/adding *workflows* to an existing role needs no CSS change.)

---

## 3. Release Notes

The `/releases` changelog and `/rss.xml` feed.

- **Files:** `src/content/releases/*.md` (e.g. `v2-3-0.md`).
- **The Markdown body IS rendered** on the page (unlike roadmap/feature items).
- **Sorted newest-first by `date`.**

```md
---
version: "2.3.0"          # rendered as "v2.3.0"
date: 2026-07-01          # YAML date or ISO string
title: Dark mode, search, and documentation tags
summary: A one-line summary shown under the version.
tags: ["feature", "ui"]  # display-only chips (NOT clickable, not part of /tags)
---

## Highlights
- **Dark mode** across the entire Help Center.
- Full-text search.

## Fixes
- ...
```

| Field | Required | Notes |
|-------|:--------:|-------|
| `version` | ✔ | String, e.g. `"2.3.0"` |
| `date` | ✔ | Date (YAML date or ISO string) — sorts the list |
| `title` | ✔ | Release headline |
| `summary` | ✔ | One-line summary |
| `tags` | | Display-only chips; **release tags are NOT part of the `/tags` browser** |

Add a release: create a new `.md` file, fill in the frontmatter, write the notes
in the body. It appears at the top of `/releases` and in the RSS feed.

---

## 4. Product Roadmap items

The "Planned & In Progress" cards on `/roadmap`.

- **Files:** `src/content/roadmap/*.md`.
- **Frontmatter only** — the body is ignored.

```md
---
title: "Dark mode support"
description: "Full dark theme across the app."
status: "planned"          # planned | in-progress | shipped
targetQuarter: "Q2 2025"   # optional, shown as a muted chip
priority: "high"           # optional: high | medium | low
---
```

| Field | Required | Values |
|-------|:--------:|--------|
| `title` | ✔ | |
| `description` | ✔ | |
| `status` | ✔ | `planned` · `in-progress` · `shipped` |
| `targetQuarter` | | free text, e.g. `"Q2 2025"` |
| `priority` | | `high` · `medium` · `low` |

Items are grouped by `status` (In Progress → Planned → Shipped) and sorted by
priority within each group.

---

## 5. Feature requests

Community-votable requests on `/roadmap`. Voting is live (Elasticsearch-backed);
cards are **sorted by vote count, highest first**.

- **Files:** `src/content/feature-requests/*.md`.
- **Frontmatter only.**

```md
---
id: "csv-import"                 # UNIQUE and STABLE — it is the vote key
title: "CSV import"
description: "Bulk-import records from a CSV file."
status: "pending"                # pending | approved | rejected
---
```

| Field | Required | Values |
|-------|:--------:|--------|
| `id` | ✔ | **Must be unique and never change** — votes are keyed to it |
| `title` | ✔ | |
| `description` | ✔ | |
| `status` | ✔ | `pending` · `approved` · `rejected` |

> Changing an item's `id` orphans its existing votes. Pick a stable id.

---

## 6. System Status content

The `/roadmap/status` page is built from:

- **Live telemetry** (Service health + the 90-day uptime bars) — live
  **Elasticsearch** via the observability pipeline, *not editable here*. Service
  health is a flat list of whatever "core services" exist in the
  `status-core-services` index; there is no hardcoded catalog. A developer adds a
  service by indexing a doc — see `HANDOFF.md` §8 and `ELASTICSEARCH_GUIDE.md`.
- **The status hero** — the big banner at the top. You don't edit it directly; it
  reflects the current state (see 6a).
- **Markdown you edit:** active incidents (6b), scheduled maintenance (6c), and
  resolved-incident history (6d).
- **One data file you edit:** Connected services (6e).

### 6a. The status hero (banner)

The banner at the top shows **one** state at a time — never a mix. You don't edit
it directly; it's derived from the content below, and the state is chosen by
**priority** (highest wins):

| Hero | Colour | Shows when | Body |
|------|--------|-----------|------|
| **Outage** | red | an active incident is `level: OUTAGE` (or a core service reports OUTAGE) | the active incident(s) |
| **Degraded** | amber | an active incident is `level: DEGRADED` (or a service is DEGRADED), and nothing is an outage | the active incident(s) |
| **Scheduled maintenance** | blue | a non-`COMPLETED` maintenance entry exists, and there's no incident/degradation | the maintenance item(s) |
| **Fully operational** | green | no active incidents, no active maintenance, services healthy | a reassurance line |

(If telemetry can't be reached at all, the hero shows a neutral "checking system
status" state rather than claiming everything is fine.)

**To drive the hero:**
- **Outage / Degraded** → add an active incident (6b) with that `level`.
- **Maintenance** → add a maintenance entry (6c) with no active incident present.
- **Operational** → remove the active incident (move it to history, 6d) and mark
  maintenance `COMPLETED` (or delete it).

Because only the top state shows, an active incident **hides** the maintenance
hero until the incident is cleared.

### 6b. Active incidents (Known Issues)
- **Files:** `src/content/status/active-incidents/*.md` (filename is arbitrary;
  the **route** uses the frontmatter `id`).
- **Where they show:** they drive the **outage/degraded hero** (6a) and each gets
  a detail page at `/roadmap/status/incidents/<id>`.
- **The body renders** on the detail page; if `description` is omitted it's
  auto-excerpted from the body. Sorted by `startedAt` (newest first).

```md
---
id: "inc-001"                       # unique — becomes the detail-page URL
title: "Storage service degraded"
level: "OUTAGE"                     # HEALTHY | DEGRADED | OUTAGE | MAINTENANCE | UNKNOWN
startedAt: "2026-07-04T14:30:00Z"   # ISO datetime
description: "Uploads are failing."  # optional
workaround: "Retry in 10 minutes."   # optional
resolvedAt: "2026-07-04T16:00:00Z"   # optional
aiNote: "Root cause: gateway timeout." # optional
affects:                             # optional — pills shown in the banner
  - Website
  - App
updates:                             # optional timeline
  - timestamp: "2026-07-04T15:00:00Z"
    message: "Investigating."
    status: "investigating"          # optional
---

Longer incident write-up (Markdown) renders on the detail page.
```

**Posting updates as the incident unfolds.** Add entries to the `updates` list —
each is `{ timestamp, message, status }`. They render as a **timeline** on the
detail page (newest first): the `status` label drives the dot colour
(*Investigating* / *Identified* → amber, *Monitoring* → blue,
*Resolved* / *Complete* → green) and each older entry shows how long before the
latest it landed (e.g. "3 hours earlier"). The **most recent** update's `status`
is also what the hero shows next to "Ongoing for …". To post an update, add a new
entry with the current time and rebuild.

**Resolving → moving to history.** An incident stays on the hero for as long as
its file is in `active-incidents/`. When it's over:
1. **Delete the file from `active-incidents/`** — this clears it from the hero.
2. **Add a matching entry to `recent-incidents/`** (6d) so it shows in the
   Incident history.

> Setting `resolvedAt` alone does **not** take an incident off the hero — the
> banner lists every file in `active-incidents/`. You must move the file.

### 6c. Scheduled maintenance
- **Files:** `src/content/status/maintenance/*.md`.
- **Where it shows:** it heads the **maintenance hero** (6a) when it's the most
  significant active state. Only items with `status` other than `COMPLETED` are
  shown. Sorted by `scheduledStart`. Body is not rendered. Mark it `COMPLETED`
  (or delete the file) when the window is over.

```md
---
id: "maint-001"
title: "Search index rebuild"
scheduledStart: "2026-07-10T02:00:00Z"
scheduledEnd: "2026-07-10T04:00:00Z"
status: "SCHEDULED"                  # SCHEDULED | IN_PROGRESS | COMPLETED
description: "Search may be slower." # optional
---
```

### 6d. Incident history (resolved)
- **Files:** `src/content/status/recent-incidents/*.md`.
- **Where they show:** the **Incident history** page at `/roadmap/status/history`
  (reached via the "View incident history" button on the status page), **ordered
  by `sortOrder` descending** (the `date` field is a display string only, so use
  `sortOrder` to control order).
- This is where you add an entry when you **resolve** an active incident (6b).

```md
---
id: "INC-2831"
date: "Mar 4"          # display string only
title: "Login latency"
duration: "38 min"
severity: "DEGRADED"   # HEALTHY | DEGRADED | OUTAGE | MAINTENANCE | UNKNOWN
cause: "Cache eviction storm."
sortOrder: 30          # higher shows first
---
```

### 6e. Connected services
Unlike the Markdown sections above, connected services live in a **TypeScript
data file**, not a content collection:

- **File:** `src/lib/status/connected-services.ts`, which exports the
  `CONNECTED_SYSTEMS` array.
- To **add, edit, or remove** a connected service, edit that array by hand. There
  is **no Elasticsearch and no build step** — the change shows on the next render.

Each entry looks like:

```ts
export const CONNECTED_SYSTEMS = [
  {
    id: 'billing-api',
    name: 'Billing API',
    type: 'THIRD_PARTY_API',      // SAAS | INTERNAL | THIRD_PARTY_API
    level: 'HEALTHY',             // HEALTHY | DEGRADED | OUTAGE | MAINTENANCE | UNKNOWN
    note: 'Read-only mirror.',    // optional
  },
  // ...more services
];
```

| Field | Required | Values |
|-------|:--------:|--------|
| `id` | ✔ | Unique, stable identifier |
| `name` | ✔ | Display name |
| `type` | ✔ | `SAAS` · `INTERNAL` · `THIRD_PARTY_API` |
| `level` | ✔ | `HEALTHY` · `DEGRADED` · `OUTAGE` · `MAINTENANCE` · `UNKNOWN` |
| `note` | | Optional short note |

> The status page shows each connected service with a 90-day uptime bar to match
> the Service health card. Because this list is curated (not telemetry), that bar
> is an **illustrative, deterministic stand-in** — `getConnectedSystemUptime()` in
> the same file generates it. Swap it for a real feed if these systems gain one.

> This is a **code file** (TypeScript), so mind the quotes, commas, and enum
> spelling. Run `npm run check` to catch type errors.

---

## 7. Homepage cards

The six cards on `/` (User Guide, Release Notes, Product Roadmap, About, System
Status, Developer Guide) are defined in a `cards` array at the top of
**`src/pages/index.astro`**. Edit the `title`, `description`, `cta`, or `href` of
any entry directly. The hero heading, search box, and "Contact support" button
are inline in the same file.

The **illustrations** are inline-SVG components in
`src/components/illustrations/` (one per card). They're also reused as the icon
next to each section page's title. To restyle an illustration, edit the SVG in
its component; the colors use theme tokens (`--ill-*`) so they adapt to dark mode.

---

## 8. Tags

Tags are driven entirely by the `tags: [...]` frontmatter on **MDX doc pages**
(section 1). Adding a tag to a doc:
- shows a chip on that page,
- adds the page to `/tags/<slug>` and the `/tags` index (counts update automatically),
- feeds the "Related" section on other pages sharing the tag.

Tag slugs are generated automatically (lowercased, spaces → dashes), so
`"Getting Started"` → `/tags/getting-started`. There's nothing to register.

> Release-note `tags` are **display-only** and are not part of this tag browser.

---

## 9. Support modal, illustrations & misc

- **Support modal targets** ("Still need help?") are environment variables, not
  content: `PUBLIC_SUPPORT_EMAIL` and `PUBLIC_SERVICENOW_URL` (see `.env.example`
  / `HANDOFF.md`). The "Live chat" option needs a real chat widget wired up by a
  developer.
- **Footer links, nav labels, and section titles** live in `src/layouts/BaseLayout.astro`
  and `src/lib/nav.ts` (editing these is a developer task — they're code, not content).
- **Product name:** note the app currently mixes "IMAX", "Super App," and "Help
  Center." If you're doing a content pass, align on one name (see `HANDOFF.md` §10
  for every place it appears).

---

## Quick reference

| Content type | Edit here | Body used? | Ordering |
|--------------|-----------|:----------:|----------|
| Doc pages (guides/about) | `src/pages/{about,developer-guide,user-guide/<cat>}/*.mdx` | ✔ | frontmatter `order` |
| Role journeys | `src/lib/role-guides.ts` | — | array order |
| Release notes | `src/content/releases/*.md` | ✔ | `date` desc |
| Roadmap items | `src/content/roadmap/*.md` | ✘ | status → priority |
| Feature requests | `src/content/feature-requests/*.md` | ✘ | live vote count |
| Known issues (incidents) | `src/content/status/active-incidents/*.md` | ✔ | `startedAt` desc |
| Scheduled maintenance | `src/content/status/maintenance/*.md` | ✘ | `scheduledStart` |
| Incident history | `src/content/status/recent-incidents/*.md` | ✘ | `sortOrder` desc |
| Connected services | `src/lib/status/connected-services.ts` (`CONNECTED_SYSTEMS[]`) | — | array order |
| Homepage cards | `src/pages/index.astro` (`cards[]`) | — | array order |
| Tags | MDX `tags:` frontmatter | — | count desc |

Every collection schema is defined and enforced in `src/content.config.ts` — if a
build fails on your content, check your frontmatter against that file (or run
`npm run check`).
