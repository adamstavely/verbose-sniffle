import { withBase } from './site-url';

// Pure tag helpers with no content glob, so components that only need slug/href
// (e.g. TagList) can import these without pulling in the doc collection in
// `docs.ts` — which globs the MDX pages and would otherwise create an import
// cycle (docs → MDX pages → MdxDocLayout → TagList → docs).

/** Turn a display tag into a URL-safe slug. */
export function slugifyTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Link to a single tag's page. */
export function tagHref(slug: string): string {
  return withBase(`tags/${slug}`);
}

/** Link to the tags index. */
export function tagsIndexHref(): string {
  return withBase('tags');
}
