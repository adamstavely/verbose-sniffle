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
        // Open external links in a new tab with safe rel attributes.
        rehypePlugins: [
          [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }],
        ],
      }),
    }),
    sitemap(),
  ],

  redirects: {
    '/requests': '/roadmap',
    '/style-guide': '/developer-guide/style-guide',
    '/user-guide/getting-started': '/user-guide/tutorials/getting-started',
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        shared: path.resolve(__dirname, 'src/lib/status'),
      },
    },
  },
});
