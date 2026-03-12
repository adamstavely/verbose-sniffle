import type { APIRoute } from 'astro';
import { runNotificationDelivery } from '../../../lib/notifications/send-notifications';

export const prerender = false;

function getWebhookSecret(): string | undefined {
  return typeof process !== 'undefined' ? process.env?.NOTIFY_WEBHOOK_SECRET : undefined;
}

export const GET: APIRoute = async () => {
  const result = await runNotificationDelivery();
  return new Response(
    JSON.stringify({
      ok: result.errors.length === 0,
      sent: result.sent,
      errors: result.errors,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const secret = getWebhookSecret();
  if (secret) {
    const auth = request.headers.get('Authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token !== secret) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const result = await runNotificationDelivery();
  return new Response(
    JSON.stringify({
      ok: result.errors.length === 0,
      sent: result.sent,
      errors: result.errors,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
