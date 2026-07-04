import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const entries = (await getCollection('releases')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    title: 'Help Center — Releases',
    description: 'Release notes and version history.',
    // Match the site's `trailingSlash: 'never'` so anchored links stay valid.
    trailingSlash: false,
    // `context.site` comes from `site` in astro.config.mjs (SITE_URL).
    site: context.site ?? 'https://example.com',
    items: entries.map((e) => ({
      title: `v${e.data.version} — ${e.data.title}`,
      description: e.data.summary,
      pubDate: e.data.date,
      link: `/releases#${e.id}`,
      categories: e.data.tags,
    })),
  });
}
