import { slugifyTag } from './tag-utils';

// Re-export the pure helpers so callers can import everything tag-related from
// `docs.ts` if they prefer. `TagList` imports them from `tag-utils` directly to
// avoid an import cycle through this module's page glob (see tag-utils.ts).
export { slugifyTag, tagHref, tagsIndexHref } from './tag-utils';

/** A documentation page (About / User Guide / Developer Guide MDX) with its tags. */
export interface RawDoc {
  title: string;
  description?: string;
  url: string;
  order: number;
  /** Display labels, trimmed but original casing preserved. */
  tags: string[];
}

/** A tag aggregated across all docs. */
export interface TagInfo {
  /** URL-safe: lowercase, non-alphanumeric collapsed to hyphens. */
  slug: string;
  /** Label shown in the UI (first-seen casing wins). */
  display: string;
  count: number;
}

// Astro injects `frontmatter` and `url` onto page modules. Glob the three doc
// sections (relative to this file) so every doc's frontmatter is available at
// build time. `import.meta.glob` is a Vite macro — the pattern must be a static
// literal and `eager: true` is required to read frontmatter synchronously.
const modules = import.meta.glob<{
  frontmatter: {
    title: string;
    description?: string;
    order?: number;
    tags?: string[];
  };
  url?: string;
}>(
  [
    '../pages/about/*.mdx',
    '../pages/user-guide/*.mdx',
    '../pages/developer-guide/*.mdx',
  ],
  { eager: true }
);

const allDocs: RawDoc[] = Object.values(modules)
  .filter((m) => m.url)
  .map((m) => ({
    title: m.frontmatter.title,
    description: m.frontmatter.description,
    url: m.url as string,
    order: m.frontmatter.order ?? 99,
    tags: (m.frontmatter.tags ?? []).map((t) => t.trim()).filter(Boolean),
  }));

/** Every doc, unsorted. */
export function getAllDocs(): RawDoc[] {
  return allDocs;
}

/** All tags with counts, deduped by slug, sorted by count desc then display. */
export function getAllTags(docs: RawDoc[] = allDocs): TagInfo[] {
  const bySlug = new Map<string, TagInfo>();
  for (const doc of docs) {
    for (const tag of doc.tags) {
      const slug = slugifyTag(tag);
      if (!slug) continue;
      const existing = bySlug.get(slug);
      if (existing) existing.count += 1;
      else bySlug.set(slug, { slug, display: tag, count: 1 });
    }
  }
  return [...bySlug.values()].sort(
    (a, b) => b.count - a.count || a.display.localeCompare(b.display)
  );
}

/** Docs carrying a given tag slug, sorted like the section index pages. */
export function getDocsByTag(slug: string, docs: RawDoc[] = allDocs): RawDoc[] {
  return docs
    .filter((d) => d.tags.some((t) => slugifyTag(t) === slug))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}
