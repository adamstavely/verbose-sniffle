import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { db, FeatureRequest, Vote } from 'astro:db';
import { randomUUID } from 'node:crypto';

export const server = {
  submitFeatureRequest: defineAction({
    accept: 'form',
    input: z.object({
      title: z.string().min(1, 'Title is required').max(200),
      description: z.string().min(1, 'Description is required').max(2000),
    }),
    handler: async ({ title, description }) => {
      const id = randomUUID();
      const now = new Date();
      await db.insert(FeatureRequest).values({
        id,
        title,
        description,
        createdAt: now,
        status: 'pending',
      });
      return { success: true, id };
    },
  }),

  vote: defineAction({
    accept: 'form',
    input: z.object({
      featureRequestId: z.string().min(1, 'Feature request ID is required'),
    }),
    handler: async ({ featureRequestId }) => {
      const id = randomUUID();
      const now = new Date();
      await db.insert(Vote).values({
        id,
        featureRequestId,
        createdAt: now,
      });
      return { success: true };
    },
  }),
};
