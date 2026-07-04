// @ts-check
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

import rehypeExternalLinks from 'rehype-external-links';

import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { remarkLastUpdated } from './src/lib/remark-last-updated.mjs';
import { rehypeExternalLinkOptions } from './src/lib/rehype-external-link-options.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  // Static by default; interactive routes opt into on-demand rendering with
  // `export const prerender = false` and are served by the Node adapter.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  /** Explicit default: single-segment URLs; nested static `index.html` hosts resolve consistently. */
  trailingSlash: 'never',
  // Astro 7's default markdown processor (satteri) doesn't run remark/rehype
  // plugins. Give MDX a unified processor so our plugins run on the .mdx doc
  // pages; .md content collections keep the default processor.
  integrations: [
    mdx({
      processor: unified({
        remarkPlugins: [remarkReadingTime, remarkLastUpdated],
        // Open external links in a new tab with safe rel attributes + icon suffix.
        rehypePlugins: [[rehypeExternalLinks, rehypeExternalLinkOptions]],
      }),
    }),
    sitemap(),
  ],

  redirects: {
    '/requests': '/roadmap',
    '/style-guide': '/developer-guide/style-guide',
    '/user-guide/getting-started': '/user-guide/tutorials/getting-started',
    // The Diátaxis "Explanation" category was retired — that understanding-oriented
    // material lives in the About section now.
    '/user-guide/explanation/architecture-overview': '/about/overview',
    '/user-guide/explanation/permissions-model': '/about/overview',
  },

  vite: {
    plugins: [tailwindcss()],
    // Build timestamp baked in at build time — used as "Last Updated" on the
    // dynamic (prerender=false) Roadmap page, which has no per-item date and
    // can't run git at request time.
    define: {
      __BUILD_ISO__: JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      alias: {
        shared: path.resolve(__dirname, 'src/lib/status'),
      },
    },
    build: {
      // Never inline font files as data: URIs — keep them as same-origin
      // /_astro assets so they load under the CSP's `default-src 'self'`
      // (a data: font would be blocked on the on-demand status page).
      assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf|eot)$/i.test(file) ? false : undefined),
    },
  },
});
