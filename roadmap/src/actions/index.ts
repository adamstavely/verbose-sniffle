import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { randomUUID } from 'node:crypto';

const VOTER_COOKIE = 'roadmap_voter_id';

export const server = {
  vote: defineAction({
    accept: 'form',
    input: z.object({
      featureRequestId: z.string().min(1, 'Feature request ID is required'),
    }),
    handler: async ({ featureRequestId }, { cookies }) => {
      const voterId = cookies.get(VOTER_COOKIE)?.value;
      if (!voterId) {
        return { success: false, error: 'Identity required. Please refresh the page and try again.' };
      }

      const { db, Vote, eq, and } = await import('astro:db');

      const existing = await db
        .select()
        .from(Vote)
        .where(and(eq(Vote.featureRequestId, featureRequestId), eq(Vote.voterId, voterId)))
        .limit(1);

      if (existing.length > 0) {
        return { success: false, error: 'already_voted' };
      }

      const id = randomUUID();
      const now = new Date();
      await db.insert(Vote).values({
        id,
        featureRequestId,
        voterId,
        createdAt: now,
      });
      return { success: true };
    },
  }),
};
