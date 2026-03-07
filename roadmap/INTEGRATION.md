# Integration Guide: Product Roadmap into Existing Astro Docs Site

This guide explains how to integrate the product roadmap pages and features into an existing Astro site that hosts user guides and developer guides.

## Overview

**Two integration approaches:**

| Approach | Use when | Pros | Cons |
|----------|----------|------|------|
| **Merge** | Single unified docs + roadmap site | One codebase, shared nav, consistent UX | Requires config changes, DB setup |
| **Subpath / Sub-app** | Roadmap is a separate deploy under a path | Isolated, independent deploys | Two codebases, navigation handoff |

This guide focuses on the **merge** approach for a unified experience.

---

## Prerequisites

Your existing Astro site should have:

- Astro 4.15+ (for Actions) or Astro 5.x
- Node.js 18+
- An adapter for server output (e.g. `@astrojs/node`, `@astrojs/vercel`) — required for Actions and Astro DB

If your site is currently **static-only**, you must add an adapter and enable server rendering for the roadmap routes.

---

## Step 1: Add Dependencies

From your existing Astro project root:

```bash
npm install @astrojs/db @astrojs/node
npx astro add tailwind   # if not already using Tailwind
```

---

## Step 2: Update Astro Config

In `astro.config.mjs` (or `astro.config.ts`):

```js
import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';  // if using Tailwind

export default defineConfig({
  integrations: [db()],
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],  // if using Tailwind
  },
});
```

Ensure you have an adapter — without it, Actions and Astro DB will not work.

---

## Step 3: Add Database Schema

Create or merge into `db/config.ts`:

```ts
import { defineDb, defineTable, column } from 'astro:db';

const FeatureRequest = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    title: column.text(),
    description: column.text(),
    createdAt: column.date(),
    status: column.text({ enum: ['pending', 'approved', 'rejected'] }),
  },
});

const Vote = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    featureRequestId: column.text({ references: () => FeatureRequest.columns.id }),
    createdAt: column.date(),
  },
});

export default defineDb({
  tables: {
    FeatureRequest,
    Vote,
  },
});
```

Run:

```bash
npx astro db push
```

For production, set `ASTRO_DATABASE_FILE` (local) or `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN` (remote).

---

## Step 4: Merge Content Collections

If you already have `src/content.config.ts`, add the `roadmap` collection:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Your existing collections (e.g. user-guides, developer-guides)
const userGuides = defineCollection({ /* ... */ });
const developerGuides = defineCollection({ /* ... */ });

const roadmap = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/roadmap' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['planned', 'in-progress', 'shipped']),
    targetQuarter: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
  }),
});

export const collections = {
  userGuides,
  developerGuides,
  roadmap,
};
```

Create `src/content/roadmap/` and add Markdown files for roadmap items (see `roadmap/src/content/roadmap/` for examples).

---

## Step 5: Add Actions

Create `src/actions/index.ts` (or merge into an existing actions file):

```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { db, FeatureRequest, Vote } from 'astro:db';
import { randomUUID } from 'node:crypto';

export const server = {
  submitFeatureRequest: defineAction({
    accept: 'form',
    input: z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
    }),
    handler: async ({ title, description }) => {
      const id = randomUUID();
      await db.insert(FeatureRequest).values({
        id,
        title,
        description,
        createdAt: new Date(),
        status: 'pending',
      });
      return { success: true, id };
    },
  }),

  vote: defineAction({
    accept: 'form',
    input: z.object({
      featureRequestId: z.string().min(1),
    }),
    handler: async ({ featureRequestId }) => {
      await db.insert(Vote).values({
        id: randomUUID(),
        featureRequestId,
        createdAt: new Date(),
      });
      return { success: true };
    },
  }),
};
```

---

## Step 6: Route Structure

Choose a route prefix for the roadmap to avoid clashes with existing docs:

| Existing routes | Suggested roadmap routes |
|-----------------|--------------------------|
| `/docs/`, `/guides/` | `/roadmap`, `/roadmap/requests`, `/roadmap/requests/new` |
| `/user-guides/`, `/developer-guides/` | `/roadmap`, `/roadmap/requests`, `/roadmap/requests/new` |

Copy these pages from `roadmap/src/pages/` into your site:

- `roadmap.astro` → e.g. `src/pages/roadmap/index.astro`
- `requests/index.astro` → `src/pages/roadmap/requests/index.astro`
- `requests/new.astro` → `src/pages/roadmap/requests/new.astro`

Set `export const prerender = false` on any page that uses the database or Actions (requests index and new).

---

## Step 7: Layout and Navigation

**Option A: Use your existing layout**

Update roadmap pages to use your docs layout instead of `BaseLayout.astro`:

```astro
---
import DocsLayout from '../layouts/DocsLayout.astro';  // your existing layout
import RoadmapList from '../components/RoadmapList.astro';
import { getCollection } from 'astro:content';

const roadmapItems = await getCollection('roadmap');
---

<DocsLayout title="Roadmap" description="What's coming soon">
  <h1>What's Coming Soon</h1>
  <RoadmapList items={roadmapItems} />
</DocsLayout>
```

**Option B: Add roadmap to your nav**

In your shared header/nav component, add links:

```html
<nav>
  <a href="/user-guides">User Guides</a>
  <a href="/developer-guides">Developer Guides</a>
  <a href="/roadmap">Roadmap</a>
  <a href="/roadmap/requests">Feature Requests</a>
  <a href="/roadmap/requests/new">Submit Request</a>
</nav>
```

**Option C: Add roadmap to sidebar**

If you use a sidebar (e.g. Starlight-style), add a "Product" or "Roadmap" section:

```ts
// Example sidebar config
{
  label: 'Product',
  items: [
    { label: 'Roadmap', link: '/roadmap' },
    { label: 'Feature Requests', link: '/roadmap/requests' },
    { label: 'Submit Request', link: '/roadmap/requests/new' },
  ],
}
```

---

## Step 8: Copy Components

Copy these components from `roadmap/src/components/` into your site:

- `RoadmapList.astro` — renders roadmap items from content collection
- `FeatureRequestCard.astro` — single feature request with vote button
- `SubmitRequestForm.astro` — form for new feature requests

Update any internal paths (e.g. `actions.vote` stays the same; layout imports may change).

---

## Step 9: Styling

If your docs site uses **Tailwind**, the roadmap components should work with minimal changes. They use utility classes like `rounded-lg`, `border-slate-200`, `bg-indigo-600`.

If you use **different CSS** (e.g. custom, Starlight theme):

1. Map Tailwind classes to your design system, or
2. Add a small roadmap-specific stylesheet that defines equivalent classes.

Ensure your layout includes the roadmap pages in the same CSS scope.

---

## Step 10: Landing Page (Optional)

If you want a dedicated roadmap landing page, copy `roadmap/src/pages/index.astro` and adjust links to match your route structure (e.g. `/roadmap` instead of `/` for the roadmap hero).

If your site already has a home page, add a prominent link to `/roadmap` instead.

---

## Checklist

- [ ] `@astrojs/db` and `@astrojs/node` installed
- [ ] `db/config.ts` with `FeatureRequest` and `Vote` tables
- [ ] `astro db push` run (and `--remote` for production)
- [ ] `roadmap` content collection in `content.config.ts`
- [ ] `src/content/roadmap/*.md` files for coming-soon items
- [ ] `src/actions/index.ts` with `submitFeatureRequest` and `vote`
- [ ] Pages: `/roadmap`, `/roadmap/requests`, `/roadmap/requests/new`
- [ ] `prerender: false` on requests pages
- [ ] Nav/sidebar updated with roadmap links
- [ ] Components copied and paths updated
- [ ] `ASTRO_DATABASE_FILE` or `ASTRO_DB_REMOTE_URL` set for build

---

## Deployment

- **Build**: Ensure `ASTRO_DATABASE_FILE` (or remote DB env vars) is set in your CI/deploy environment.
- **Node adapter**: Your host must support Node.js serverless or standalone (Vercel, Netlify, etc.).
- **Remote DB**: For production, use Turso or another libSQL host; run `astro db push --remote` in CI before build.

---

## File Reference

| Source (roadmap app) | Destination (your site) |
|----------------------|--------------------------|
| `db/config.ts` | `db/config.ts` (merge tables) |
| `src/content.config.ts` | Merge `roadmap` collection |
| `src/content/roadmap/*.md` | `src/content/roadmap/*.md` |
| `src/actions/index.ts` | `src/actions/index.ts` (merge or create) |
| `src/pages/roadmap.astro` | `src/pages/roadmap/index.astro` |
| `src/pages/requests/index.astro` | `src/pages/roadmap/requests/index.astro` |
| `src/pages/requests/new.astro` | `src/pages/roadmap/requests/new.astro` |
| `src/components/RoadmapList.astro` | `src/components/RoadmapList.astro` |
| `src/components/FeatureRequestCard.astro` | `src/components/FeatureRequestCard.astro` |
| `src/components/SubmitRequestForm.astro` | `src/components/SubmitRequestForm.astro` |
