import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const roadmap = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/roadmap' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['planned', 'in-progress', 'shipped']),
    targetQuarter: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
  }),
});

export const collections = {
  roadmap,
};
