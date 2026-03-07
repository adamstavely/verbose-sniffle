# Migrating Existing Site Data to Astro Content Collections

This guide explains how to migrate an existing Astro site that **does not use content collections** to use Astro's content collections. Use this when integrating the roadmap/status page into a docs site that stores content as static files, JSON, or manual imports.

## Overview

| Current approach | Migrate to |
|------------------|-------------|
| `import.meta.glob('./docs/**/*.md')` | Content collection with `glob` loader |
| Static JSON imports | Content collection with `glob` loader (convert to Markdown) or custom loader |
| Hardcoded arrays in pages | Content collection (Markdown files) |
| Markdown in `src/pages/` | Content collection in `src/content/` |
| Manual `import` of individual files | Content collection with `getCollection()` |

**Benefits of collections:** Type-safe frontmatter, unified schema, `getCollection()` / `getEntryById()`, and integration with the roadmap/status components.

---

## Step 1: Identify Your Current Data Structure

### Pattern A: `import.meta.glob` for Markdown

```ts
// Before: dynamic glob of markdown files
const modules = import.meta.glob<{ frontmatter: any; Content: any }>('./docs/**/*.md');
const entries = await Promise.all(
  Object.entries(modules).map(async ([path, mod]) => {
    const { frontmatter, Content } = await mod();
    return { path, frontmatter, Content };
  })
);
```

### Pattern B: Static JSON or Data Files

```ts
// Before: JSON or TS data
import guides from '../data/guides.json';
// or
const guides = [
  { title: 'Getting Started', slug: 'getting-started', ... },
];
```

### Pattern C: Markdown in `src/pages/` (File-Based Routing)

```
src/pages/
  docs/
    getting-started.md
    api-reference.md
```

### Pattern D: Manual Imports

```ts
// Before: individual imports
import gettingStarted from '../content/getting-started.md';
import apiRef from '../content/api-reference.md';
const docs = [gettingStarted, apiRef];
```

---

## Step 2: Create `content.config.ts`

Create or update `src/content.config.ts` at your project root. If you already have one (e.g. for Starlight), add the new collections alongside existing ones.

### Minimal Example (Docs/Guides)

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = {
  docs,
};
```

### Full Example (Docs + Roadmap + Status)

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Your existing docs
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    sidebarOrder: z.number().optional(),
  }),
});

// Roadmap "coming soon" items (for integration)
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

// Optional: incident workarounds and maintenance announcements
const statusIncidents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/incidents' }),
  schema: z.object({
    incidentId: z.string().optional(),
    title: z.string(),
    severity: z.enum(['HEALTHY', 'DEGRADED', 'OUTAGE', 'MAINTENANCE', 'UNKNOWN']).optional(),
    workaround: z.string().optional(),
  }),
});

const statusAnnouncements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/announcements' }),
  schema: z.object({
    title: z.string(),
    scheduledStart: z.string().optional(),
    scheduledEnd: z.string().optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed']).optional(),
  }),
});

export const collections = {
  docs,
  roadmap,
  statusIncidents,
  statusAnnouncements,
};
```

---

## Step 3: Move Files to Collection Directories

### From `import.meta.glob('./docs/**/*.md')`

1. Create `src/content/docs/`.
2. Move all Markdown files from the glob path into `src/content/docs/`, preserving subdirectories if desired.
3. Ensure each file has a YAML frontmatter block that matches your schema.

**Example file:** `src/content/docs/getting-started.md`

```md
---
title: "Getting Started"
description: "Set up your project in minutes"
sidebarOrder: 1
---

Your content here...
```

### From JSON/Data Files

Convert each JSON entry into a Markdown file with frontmatter.

**Before (JSON):**
```json
[
  { "title": "Getting Started", "slug": "getting-started", "summary": "..." },
  { "title": "API Reference", "slug": "api-reference", "summary": "..." }
]
```

**After (Markdown):**  
`src/content/docs/getting-started.md`:
```md
---
title: "Getting Started"
description: "Set up your project in minutes"
---

Your content here...
```

`src/content/docs/api-reference.md`:
```md
---
title: "API Reference"
description: "Complete API documentation"
---

Your content here...
```

### From `src/pages/docs/*.md`

1. Create `src/content/docs/`.
2. Move `.md` files from `src/pages/docs/` to `src/content/docs/`.
3. Add frontmatter if missing.
4. Create a dynamic route (e.g. `src/pages/docs/[...slug].astro`) that uses `getEntryById()` or `getCollection()` + routing logic.

---

## Step 4: Update Your Pages and Components

### Replace `import.meta.glob` Usage

**Before:**
```astro
---
const modules = import.meta.glob<{ frontmatter: any }>('./content/**/*.md');
const items = await Promise.all(
  Object.entries(modules).map(async ([path, mod]) => {
    const { frontmatter } = await mod();
    return { ...frontmatter, slug: path.replace('./content/', '').replace('.md', '') };
  })
);
---
<ul>
  {items.map(item => (
    <li><a href={`/docs/${item.slug}`}>{item.title}</a></li>
  ))}
</ul>
```

**After:**
```astro
---
import { getCollection } from 'astro:content';

const docs = await getCollection('docs');
const sorted = docs.sort((a, b) => 
  (a.data.sidebarOrder ?? 999) - (b.data.sidebarOrder ?? 999)
);
---
<ul>
  {sorted.map((entry) => (
    <li>
      <a href={`/docs/${entry.id}`}>{entry.data.title}</a>
    </li>
  ))}
</ul>
```

### Replace Static JSON/Array Usage

**Before:**
```astro
---
import guides from '../data/guides.json';
---
{guides.map(g => <a href={g.slug}>{g.title}</a>)}
```

**After:**
```astro
---
import { getCollection } from 'astro:content';
const guides = await getCollection('docs');
---
{guides.map(entry => (
  <a href={`/docs/${entry.id}`}>{entry.data.title}</a>
))}
```

### Dynamic Routes (e.g. `[...slug].astro`)

**Before:** File-based routing with `src/pages/docs/getting-started.md`.

**After:** Single dynamic route that fetches by ID:

```astro
---
import { getEntryById, getCollection } from 'astro:content';

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  return docs.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
---
<article>
  <h1>{entry.data.title}</h1>
  <Content />
</article>
```

**Note:** In Astro 5, entries use `id` (from the loader) rather than `slug`. The glob loader derives `id` from the file path; use `generateId` in the loader if you need custom IDs.

---

## Step 5: Custom IDs and URL Structure

If your URLs don't match the file structure, use `generateId` in the loader:

```ts
const docs = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/docs',
    generateId: (path) => {
      // e.g. "2025-01-15-release-notes.md" -> "2025/01/release-notes"
      const name = path.replace(/\.md$/, '');
      const match = name.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
      if (match) {
        const [, year, month, , slug] = match;
        return `${year}/${month}/${slug}`;
      }
      return name;
    },
  }),
  schema: z.object({ title: z.string(), /* ... */ }),
});
```

---

## Step 6: TypeScript Types

Astro generates types from your schema. Use `CollectionEntry` for type-safe access:

```ts
import type { CollectionEntry } from 'astro:content';

// In a component
interface Props {
  items: CollectionEntry<'docs'>[];
}

const { items } = Astro.props;
// items[0].data.title is typed
```

---

## Step 7: Checklist for Your Migration

- [ ] Create `src/content.config.ts` with collection definitions
- [ ] Create `src/content/<collection>/` directories
- [ ] Move/copy Markdown files into collection directories
- [ ] Add frontmatter to each file (matching schema)
- [ ] Replace `import.meta.glob` / JSON / manual imports with `getCollection()` or `getEntryById()`
- [ ] Update dynamic routes to use `getStaticPaths` + `getEntryById` or `getCollection`
- [ ] Update any `slug` references to `id` (Astro 5)
- [ ] Run `astro dev` and verify pages render correctly
- [ ] Add roadmap/status collections if integrating (see [INTEGRATION.md](./INTEGRATION.md))

---

## Reference: Roadmap Collection Schema

For the roadmap integration, use this schema and file structure:

**Schema (in `content.config.ts`):**
```ts
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
```

**Example file:** `src/content/roadmap/dark-mode.md`
```md
---
title: "Dark mode support"
description: "Full dark theme across the app for reduced eye strain."
status: "planned"
targetQuarter: "Q2 2025"
priority: "high"
---
```

**Usage in page:**
```astro
---
import { getCollection } from 'astro:content';
import RoadmapList from '../components/RoadmapList.astro';

const roadmapItems = await getCollection('roadmap');
---
<RoadmapList items={roadmapItems} />
```

---

## Further Reading

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Content Loader API (glob)](https://docs.astro.build/en/reference/content-loader-reference/)
- [INTEGRATION.md](./INTEGRATION.md) — Full roadmap/status integration guide
