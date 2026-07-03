import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { getCollection } from 'astro:content';
import { recordVote } from '../lib/votes/elastic-votes';
import { addSubscriber } from '../lib/notifications/elastic-subscribers';
import { recordFeedback } from '../lib/feedback/elastic-feedback';
import { sendEmail, isEmailServiceConfigured } from '../lib/notifications/email-client';
import {
  buildSubscribeConfirmation,
  buildSubscribeConfirmationSubject,
} from '../lib/notifications/email-templates';
import { rateLimit } from '../lib/rate-limit';

const VOTER_COOKIE = 'roadmap_voter_id';
const TOO_MANY = 'Too many requests. Please try again in a minute.';

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
    handler: async ({ featureRequestId }, { cookies }) => {
      const voterId = cookies.get(VOTER_COOKIE)?.value;
      if (!voterId) {
        return { success: false, error: 'Identity required. Please refresh the page and try again.' };
      }
      if (!rateLimit(`vote:${voterId}`, 20, 60_000)) {
        return { success: false, error: TOO_MANY };
      }
      // Reject votes for ids that don't exist in the content collection.
      if (!(await isKnownFeatureRequest(featureRequestId))) {
        return { success: false, error: 'Unknown feature request.' };
      }

      return recordVote(featureRequestId, voterId);
    },
  }),

  subscribe: defineAction({
    accept: 'form',
    input: z.object({
      email: z.email('Please enter a valid email address'),
    }),
    handler: async ({ email }, { cookies }) => {
      const voterId = cookies.get(VOTER_COOKIE)?.value ?? 'anon';
      if (!rateLimit(`subscribe:${voterId}`, 5, 60_000)) {
        return { success: false, error: TOO_MANY };
      }

      const normalized = email.trim().toLowerCase();
      const result = await addSubscriber(normalized);
      // Only send the confirmation email for a brand-new subscription, so a
      // repeat submit for an existing address doesn't re-send it.
      if (result.success && !result.alreadySubscribed && isEmailServiceConfigured()) {
        await sendEmail(
          normalized,
          buildSubscribeConfirmationSubject(),
          buildSubscribeConfirmation(normalized)
        );
      }
      return result;
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
      if (!rateLimit(`feedback:${visitorId}`, 10, 60_000)) {
        return { success: false, error: TOO_MANY };
      }
      return recordFeedback(pagePath, helpful, visitorId, message);
    },
  }),
};
