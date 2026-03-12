// @ts-check
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import db from '@astrojs/db';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [db()],

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