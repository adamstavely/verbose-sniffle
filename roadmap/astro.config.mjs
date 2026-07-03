// @ts-check
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

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
  integrations: [mdx(), sitemap()],

  redirects: {
    '/requests': '/roadmap',
    '/style-guide': '/developer-guide/style-guide',
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
