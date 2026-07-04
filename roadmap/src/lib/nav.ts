import {
  getAllDocs,
  firstSegment,
  secondSegment,
  USER_GUIDE_CATEGORIES,
  type RawDoc,
} from './docs';
import { withBase } from './site-url';

// One-way import: nav.ts → docs.ts. `getAllDocs` is async + lazy, so building
// the tree from a layout (even on prerender=false pages) never triggers the
// docs → MDX pages → MdxDocLayout → docs init cycle.

export { USER_GUIDE_CATEGORIES } from './docs';

export interface NavPage {
  title: string;
  url: string;
}
export interface NavCategory {
  slug: string;
  name: string;
  description: string;
  pages: NavPage[];
}
/** A single link (Roadmap/Status/Releases) or a collapsible section. */
export type NavItem =
  | { kind: 'link'; label: string; href: string; match: string }
  | {
      kind: 'group';
      slug: string;
      name: string;
      href: string;
      pages?: NavPage[];
      categories?: NavCategory[];
    };
export interface NavTree {
  items: NavItem[];
}

/**
 * Ordered sidebar navigation. Fixed order:
 * About · User Guide · Releases · Roadmap · Status · Developer Guide.
 */
export async function getNavTree(): Promise<NavTree> {
  const docs = await getAllDocs();
  const byOrder = (a: RawDoc, b: RawDoc) =>
    a.order - b.order || a.title.localeCompare(b.title);
  const inSection = (slug: string) =>
    docs.filter((d) => firstSegment(d.url) === slug).sort(byOrder);
  const toPage = (d: RawDoc): NavPage => ({ title: d.title, url: d.url });

  const userGuide = inSection('user-guide');
  const categories: NavCategory[] = Object.entries(USER_GUIDE_CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slug, meta]) => ({
      slug,
      name: meta.name,
      description: meta.description,
      pages: userGuide.filter((d) => secondSegment(d.url) === slug).map(toPage),
    }));

  return {
    items: [
      { kind: 'group', slug: 'about', name: 'About', href: withBase('about'), pages: inSection('about').map(toPage) },
      { kind: 'group', slug: 'user-guide', name: 'User Guide', href: withBase('user-guide'), categories },
      { kind: 'link', label: 'Releases', href: withBase('releases'), match: '/releases' },
      { kind: 'link', label: 'Roadmap', href: withBase('roadmap'), match: '/roadmap' },
      { kind: 'link', label: 'Status', href: withBase('roadmap/status'), match: '/roadmap/status' },
      { kind: 'group', slug: 'developer-guide', name: 'Developer Guide', href: withBase('developer-guide'), pages: inSection('developer-guide').map(toPage) },
    ],
  };
}
