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

export interface NavLink {
  label: string;
  href: string;
  /** Normalized pathname this link represents, for exact active-matching. */
  match: string;
}
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
export interface NavGroup {
  slug: string;
  name: string;
  href: string;
  pages?: NavPage[];
  categories?: NavCategory[];
}
export interface NavTree {
  flat: NavLink[];
  groups: NavGroup[];
}

/** Structured navigation for the sidebar (flat links + collapsible groups). */
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
    flat: [
      { label: 'Home', href: withBase(''), match: '/' },
      { label: 'Roadmap', href: withBase('roadmap'), match: '/roadmap' },
      { label: 'Status', href: withBase('roadmap/status'), match: '/roadmap/status' },
      { label: 'Releases', href: withBase('releases'), match: '/releases' },
      { label: 'Tags', href: withBase('tags'), match: '/tags' },
    ],
    groups: [
      {
        slug: 'about',
        name: 'About',
        href: withBase('about'),
        pages: inSection('about').map(toPage),
      },
      {
        slug: 'user-guide',
        name: 'User Guide',
        href: withBase('user-guide'),
        categories,
      },
      {
        slug: 'developer-guide',
        name: 'Developer Guide',
        href: withBase('developer-guide'),
        pages: inSection('developer-guide').map(toPage),
      },
    ],
  };
}
