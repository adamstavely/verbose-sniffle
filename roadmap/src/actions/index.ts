import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { recordVote } from '../lib/votes/elastic-votes';

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

      return recordVote(featureRequestId, voterId);
    },
  }),
};
