import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { recordVote } from '../lib/votes/elastic-votes';
import { addSubscriber } from '../lib/notifications/elastic-subscribers';
import { recordFeedback } from '../lib/feedback/elastic-feedback';

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

  subscribe: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email('Please enter a valid email address'),
    }),
    handler: async ({ email }) => {
      return addSubscriber(email);
    },
  }),

  feedback: defineAction({
    accept: 'form',
    input: z.object({
      pagePath: z.string().min(1, 'Page path is required'),
      helpful: z.enum(['yes', 'no']),
      message: z.string().max(500).optional(),
    }),
    handler: async ({ pagePath, helpful, message }, { cookies }) => {
      const visitorId = cookies.get(VOTER_COOKIE)?.value;
      if (!visitorId) {
        return { success: false, error: 'Please refresh and try again.' };
      }
      return recordFeedback(pagePath, helpful, visitorId, message);
    },
  }),
};
