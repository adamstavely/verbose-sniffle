import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const statusLevel = z.enum([
  'HEALTHY',
  'DEGRADED',
  'OUTAGE',
  'UNKNOWN',
  'MAINTENANCE',
]);

const incidentUpdate = z.object({
  timestamp: z.string(),
  message: z.string(),
  status: z.string().optional(),
});

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

const statusActiveIncidents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/active-incidents' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    level: statusLevel,
    startedAt: z.string(),
    description: z.string().optional(),
    workaround: z.string().optional(),
    resolvedAt: z.string().optional(),
    aiNote: z.string().optional(),
    updates: z.array(incidentUpdate).optional(),
  }),
});

const statusMaintenance = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/maintenance' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    scheduledStart: z.string(),
    scheduledEnd: z.string(),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']),
    description: z.string().optional(),
  }),
});

const statusRecentIncidents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/status/recent-incidents' }),
  schema: z.object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    duration: z.string(),
    severity: statusLevel,
    cause: z.string(),
    sortOrder: z.number().optional(),
  }),
});

const featureRequests = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/feature-requests' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
  }),
});

export const collections = {
  roadmap,
  statusActiveIncidents,
  statusMaintenance,
  statusRecentIncidents,
  featureRequests,
};
