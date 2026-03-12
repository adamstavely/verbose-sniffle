// @ts-check
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        shared: path.resolve(__dirname, 'src/lib/status'),
      },
    },
  },

  adapter: node({
    mode: 'standalone'
  })
});