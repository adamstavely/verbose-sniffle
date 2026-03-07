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

const statusIncidents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/incidents' }),
  schema: z.object({
    incidentId: z.string().optional(),
    title: z.string(),
    severity: z.enum(['HEALTHY', 'DEGRADED', 'OUTAGE', 'MAINTENANCE', 'UNKNOWN']).optional(),
    workaround: z.string().optional(),
  }),
});

const statusAnnouncements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/announcements' }),
  schema: z.object({
    title: z.string(),
    scheduledStart: z.string().optional(),
    scheduledEnd: z.string().optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed']).optional(),
  }),
});

export const collections = {
  roadmap,
  statusIncidents,
  statusAnnouncements,
};
