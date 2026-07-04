import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { getCollection } from 'astro:content';
import { recordVote } from '../lib/votes/elastic-votes';
import { recordFeedback } from '../lib/feedback/elastic-feedback';
import { rateLimit } from '../lib/rate-limit';

const VOTER_COOKIE = 'roadmap_voter_id';
const TOO_MANY = 'Too many requests. Please try again in a minute.';

/** Best-effort client IP for rate-limit keying (may be a proxy address). */
function clientIp(context: { clientAddress?: string }): string {
  try {
    return context.clientAddress || 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Cache the set of valid feature-request ids from the content collection. */
let featureRequestIds: Set<string> | null = null;
async function isKnownFeatureRequest(id: string): Promise<boolean> {
  if (!featureRequestIds) {
    const requests = await getCollection('featureRequests');
    featureRequestIds = new Set(requests.map((r) => r.data.id));
  }
  return featureRequestIds.has(id);
}

export const server = {
  vote: defineAction({
    accept: 'form',
    input: z.object({
      featureRequestId: z.string().min(1, 'Feature request ID is required'),
    }),
    handler: async ({ featureRequestId }, context) => {
      const voterId = context.cookies.get(VOTER_COOKIE)?.value;
      if (!voterId) {
        return { success: false, error: 'Identity required. Please refresh the page and try again.' };
      }
      // Limit per identity and per client IP, so clearing the cookie doesn't
      // lift the ceiling.
      if (
        !rateLimit(`vote:${voterId}`, 20, 60_000) ||
        !rateLimit(`vote-ip:${clientIp(context)}`, 60, 60_000)
      ) {
        return { success: false, error: TOO_MANY };
      }
      // Reject votes for ids that don't exist in the content collection.
      if (!(await isKnownFeatureRequest(featureRequestId))) {
        return { success: false, error: 'Unknown feature request.' };
      }

      return recordVote(featureRequestId, voterId);
    },
  }),

  feedback: defineAction({
    accept: 'form',
    input: z.object({
      pagePath: z.string().min(1, 'Page path is required'),
      helpful: z.enum(['yes', 'no']),
      message: z.string().max(500).optional(),
    }),
    handler: async ({ pagePath, helpful, message }, context) => {
      const visitorId = context.cookies.get(VOTER_COOKIE)?.value;
      if (!visitorId) {
        return { success: false, error: 'Please refresh and try again.' };
      }
      if (
        !rateLimit(`feedback:${visitorId}`, 10, 60_000) ||
        !rateLimit(`feedback-ip:${clientIp(context)}`, 30, 60_000)
      ) {
        return { success: false, error: TOO_MANY };
      }
      return recordFeedback(pagePath, helpful, visitorId, message);
    },
  }),
};
