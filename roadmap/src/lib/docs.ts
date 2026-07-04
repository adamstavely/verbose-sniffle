import { slugifyTag } from './tag-utils';
import { withBase } from './site-url';

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
  slug: string;
  display: string;
  count: number;
}

// LAZY glob (`eager: false`): building this map does NOT import the MDX page
// modules, so `MdxDocLayout` (which the pages use) can import this module
// without triggering the init-order import cycle that an eager glob causes
// (docs → MDX pages → MdxDocLayout → docs). The pages are imported on demand
// inside `getAllDocs()`, by which point every module is fully initialized.
const loaders = import.meta.glob<{
  frontmatter: {
    title: string;
    description?: string;
    order?: number;
    tags?: string[];
  };
  url?: string;
}>(
  [
    '../pages/about/**/*.mdx',
    '../pages/user-guide/**/*.mdx',
    '../pages/developer-guide/**/*.mdx',
  ],
  { eager: false }
);

let cache: RawDoc[] | null = null;

/** Every doc, resolved once and memoized. */
export async function getAllDocs(): Promise<RawDoc[]> {
  if (cache) return cache;
  const mods = await Promise.all(Object.values(loaders).map((load) => load()));
  cache = mods
    .filter((m) => m.url)
    .map((m) => ({
      title: m.frontmatter.title,
      description: m.frontmatter.description,
      url: m.url as string,
      order: m.frontmatter.order ?? 99,
      tags: (m.frontmatter.tags ?? []).map((t) => t.trim()).filter(Boolean),
    }));
  return cache;
}

/** All tags with counts, deduped by slug, sorted by count desc then display. */
export async function getAllTags(): Promise<TagInfo[]> {
  const docs = await getAllDocs();
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
export async function getDocsByTag(slug: string): Promise<RawDoc[]> {
  const docs = await getAllDocs();
  return docs
    .filter((d) => d.tags.some((t) => slugifyTag(t) === slug))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

// ── Section / prev-next / related helpers ────────────────────────────────────

const SECTIONS: Record<string, string> = {
  about: 'About',
  'user-guide': 'User Guide',
  'developer-guide': 'Developer Guide',
};

/** The User Guide is organized with the Diátaxis framework. Slug = subfolder. */
export const USER_GUIDE_CATEGORIES: Record<
  string,
  { name: string; description: string; order: number }
> = {
  tutorials: {
    name: 'Tutorials',
    order: 1,
    description: 'Learning-oriented lessons that walk you through your first steps.',
  },
  'how-to': {
    name: 'How-to guides',
    order: 2,
    description: 'Goal-oriented recipes for getting a specific task done.',
  },
  reference: {
    name: 'Reference',
    order: 3,
    description: 'Information-oriented technical descriptions to look things up in.',
  },
};

export const stripSlash = (p: string) => p.replace(/\/+$/, '') || '/';
export const firstSegment = (url: string) =>
  stripSlash(url).replace(/^\//, '').split('/')[0] ?? '';
export const secondSegment = (url: string) =>
  stripSlash(url).replace(/^\//, '').split('/')[1] ?? '';

/** Resolve the guide section a doc URL belongs to (for breadcrumbs). */
export function getSection(pathname: string): { slug: string; name: string; url: string } | null {
  const seg = firstSegment(pathname);
  if (seg && SECTIONS[seg]) return { slug: seg, name: SECTIONS[seg], url: withBase(seg) };
  return null;
}

/** Resolve the Diátaxis category of a /user-guide/<category>/… URL, if any. */
export function getCategory(
  pathname: string
): { slug: string; name: string; url: string } | null {
  if (firstSegment(pathname) !== 'user-guide') return null;
  const slug = secondSegment(pathname);
  const meta = USER_GUIDE_CATEGORIES[slug];
  if (!meta) return null;
  // Tutorials has a dedicated landing page; the others are anchors on the
  // User Guide overview.
  const url =
    slug === 'tutorials'
      ? withBase('user-guide/tutorials')
      : withBase(`user-guide#${slug}`);
  return { slug, name: meta.name, url };
}

/**
 * Previous/next doc within the same group, ordered by `order` then title.
 * Within the User Guide the group is the Diátaxis category, so prev/next stays
 * inside e.g. Tutorials rather than spilling into Reference.
 */
export async function getSectionSiblings(
  pathname: string
): Promise<{ prev: RawDoc | null; next: RawDoc | null }> {
  const section = getSection(pathname);
  if (!section) return { prev: null, next: null };
  const here = stripSlash(pathname);
  const inGroup =
    section.slug === 'user-guide'
      ? (d: RawDoc) =>
          firstSegment(d.url) === 'user-guide' &&
          secondSegment(d.url) === secondSegment(pathname)
      : (d: RawDoc) => firstSegment(d.url) === section.slug;
  const siblings = (await getAllDocs())
    .filter(inGroup)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const idx = siblings.findIndex((d) => stripSlash(d.url) === here);
  return {
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
  };
}

/** Other docs sharing at least one tag with the current doc. */
export async function getRelatedByTags(
  pathname: string,
  tags: string[],
  limit = 4
): Promise<RawDoc[]> {
  const slugs = new Set(tags.map(slugifyTag).filter(Boolean));
  if (slugs.size === 0) return [];
  const here = stripSlash(pathname);
  return (await getAllDocs())
    .filter((d) => stripSlash(d.url) !== here && d.tags.some((t) => slugs.has(slugifyTag(t))))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .slice(0, limit);
}
