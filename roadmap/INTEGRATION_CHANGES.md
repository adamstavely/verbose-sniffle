# Integration Changes: Backend Consolidation & Data Migration

If you previously integrated the roadmap and status page using the **backend + proxy** approach, or used **Astro DB** for feature requests and votes, this document summarizes what changed and what you need to update.

---

## Summary of Changes

**Status page:**
| Before | After |
|--------|-------|
| Separate Node/Express backend on port 4000 | No backend; Astro queries Elasticsearch directly |
| Vite proxy `/api/status` → `localhost:4000` | No proxy |
| `api.ts` fetches from backend HTTP endpoints | `elastic-status.ts` uses `@elastic/elasticsearch` client |
| `PUBLIC_STATUS_API_URL` env var | Removed; use `ELASTICSEARCH_URL` instead |

**Feature requests & votes:**
| Before | After |
|--------|-------|
| Astro DB (`FeatureRequest`, `Vote` tables) | Content collection (`featureRequests`) + Elasticsearch (`roadmap-votes` index) |
| `db/config.ts`, `astro db push` | Markdown in `src/content/feature-requests/`; votes in Elasticsearch |
| `@astrojs/db` dependency | Removed |

---

## 1. Remove the Backend

- **Stop running** the backend process (`cd backend && npm start`).
- **Delete** the `backend/` directory from your project (or keep it for reference but do not deploy it).

---

## 2. Update Astro Config

**Remove** the Vite proxy for `/api/status`:

```diff
  vite: {
    resolve: {
      alias: {
        shared: path.resolve(__dirname, 'src/lib/status'),
      },
    },
-   server: {
-     proxy: {
-       '/api/status': {
-         target: 'http://localhost:4000',
-         changeOrigin: true,
-       },
-     },
-   },
  },
```

---

## 3. Add Elasticsearch Dependency

```bash
npm install @elastic/elasticsearch
```

---

## 4. Replace Status Lib Files

| Remove | Add |
|--------|-----|
| `src/lib/status/api.ts` | `src/lib/status/elastic-client.ts` |
| — | `src/lib/status/status-config.ts` |
| — | `src/lib/status/elastic-status.ts` |

Keep: `fetch-status.ts`, `mock-data.ts`, `status-models.ts`, `status-utils.ts`, `capability-groups.ts`, `status-labels.ts`, `render-status-html.ts`.

Update `fetch-status.ts` to import from `elastic-status` instead of `api`, and wrap the elastic return values in the expected DTO shapes (e.g. `{ workspaces }`, `{ systems }`, `{ incidents }`). See the current `roadmap/src/lib/status/fetch-status.ts` for the pattern.

---

## 5. Update Environment Variables

**Remove:**
- `PUBLIC_STATUS_API_URL`

**Add** (in your roadmap/docs app env, e.g. `.env`):

```
ELASTICSEARCH_URL=https://your-cluster.example.com:9200
ELASTICSEARCH_API_KEY=your_api_key

STATUS_ENVIRONMENT=production
STATUS_TIME_WINDOW_MINUTES=5

ELASTICSEARCH_INDEX_CORE_SERVICES=status-core-services
ELASTICSEARCH_INDEX_WORKSPACES=status-workspaces
ELASTICSEARCH_INDEX_EXTERNAL_SYSTEMS=status-external-systems
ELASTICSEARCH_INDEX_INCIDENTS=status-incidents
ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE=status-scheduled-maintenance
```

**Unchanged:**
- `PUBLIC_USE_MOCK_STATUS=true` — still works; uses mock data without Elasticsearch
- `STATUS_FETCH_TIMEOUT_MS` — no longer used (was for HTTP fetch; elastic client has its own behavior)

---

## 6. Update DTO Types

If `render-status-html.ts` or `mock-data.ts` imported DTO types from `api.ts`, move those types to `status-models.ts`:

- `StatusSummaryDto`
- `WorkspacesDto`
- `WorkspaceFeaturesDto`
- `ExternalSystemsDto`
- `IncidentsDto`
- `ScheduledMaintenanceDto`

---

## 7. Deployment

- **Before:** Deploy backend + Astro app; backend connects to Elasticsearch.
- **After:** Deploy only the Astro app; set `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY` in the Astro app’s environment.

---

## Checklist for Existing Integrators

- [ ] Stop running and remove (or ignore) the backend
- [ ] Remove `/api/status` proxy from `astro.config.mjs`
- [ ] Add `@elastic/elasticsearch` dependency
- [ ] Replace `api.ts` with `elastic-client.ts`, `status-config.ts`, `elastic-status.ts`
- [ ] Update `fetch-status.ts` to call elastic-status and wrap responses
- [ ] Move DTO types to `status-models.ts`; update imports in `render-status-html.ts` and `mock-data.ts`
- [ ] Remove `PUBLIC_STATUS_API_URL`; add Elasticsearch env vars
- [ ] Verify status page works with `PUBLIC_USE_MOCK_STATUS=true` (no Elasticsearch)
- [ ] Verify status page works with Elasticsearch env vars set (remote cluster)

---

## Feature Requests & Votes Migration (Astro DB → Content + Elasticsearch)

If you were using Astro DB for feature requests and votes:

1. **Add `featureRequests` content collection** to `content.config.ts` (see INTEGRATION.md).
2. **Create Markdown files** in `src/content/feature-requests/` with frontmatter: `id`, `title`, `description`, `status`.
3. **Copy `src/lib/votes/elastic-votes.ts`** — provides `recordVote`, `getVoteCounts`, `getVotedByMe`.
4. **Update `src/actions/index.ts`** — call `recordVote()` instead of Astro DB insert.
5. **Update `src/pages/roadmap.astro`** — use `getCollection('featureRequests')`, `getVoteCounts()`, `getVotedByMe()`.
6. **Remove** `@astrojs/db`, `db/config.ts`, `db/seed.ts`, and the db integration from `astro.config.mjs`.
7. **Add** `ELASTICSEARCH_INDEX_ROADMAP_VOTES=roadmap-votes` to `.env`.

---

## Reference

For the full integration guide (including roadmap, DB, content collections, etc.), see [INTEGRATION.md](./INTEGRATION.md).
