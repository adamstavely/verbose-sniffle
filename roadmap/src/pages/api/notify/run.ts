import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { runNotificationDelivery } from '../../../lib/notifications/send-notifications';

export const prerender = false;

function getWebhookSecret(): string | undefined {
  return typeof process !== 'undefined' ? process.env?.NOTIFY_WEBHOOK_SECRET : undefined;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Constant-time comparison to avoid leaking the secret via timing. */
function tokensMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Trigger notification delivery. POST only, and always authenticated:
 * requires `Authorization: Bearer <NOTIFY_WEBHOOK_SECRET>`. If the secret is
 * not configured the endpoint fails closed (503) rather than running openly.
 * The response never includes subscriber emails or incident IDs.
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = getWebhookSecret();
  if (!secret) {
    return json({ ok: false, error: 'Notification webhook is not configured' }, 503);
  }

  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !tokensMatch(token, secret)) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  const result = await runNotificationDelivery();
  if (result.errors.length > 0) {
    // Log delivery failures server-side only; never return emails/incident IDs.
    console.error(`[notify] ${result.errors.length} delivery failure(s)`, result.errors);
  }
  return json({ ok: result.errors.length === 0, sent: result.sent, failed: result.errors.length }, 200);
};
