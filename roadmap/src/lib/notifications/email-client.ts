/**
 * HTTP client for internal email service.
 *
 * Expected API: POST /send (or path from EMAIL_SERVICE_PATH) with body:
 *   { to: string, subject: string, body: string }
 * or
 *   { to: string, subject: string, text: string }
 *
 * If your API differs, override this module or add env vars for custom path/body shape.
 */

function env(name: string, fallback: string): string {
  return (typeof process !== 'undefined' && process.env?.[name]) ?? fallback;
}

function getConfig() {
  const url = env('EMAIL_SERVICE_URL', '');
  const path = env('EMAIL_SERVICE_PATH', '/send').replace(/^\//, '');
  const apiKey = typeof process !== 'undefined' ? process.env?.EMAIL_SERVICE_API_KEY : undefined;
  return { url, path, apiKey };
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  const { url, path, apiKey } = getConfig();

  if (!url) {
    console.warn('EMAIL_SERVICE_URL not set; skipping email send.');
    return false;
  }

  const endpoint = `${url.replace(/\/$/, '')}/${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to, subject, body }),
    });

    if (!res.ok) {
      console.error(`Email service returned ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send email', err);
    return false;
  }
}

export function isEmailServiceConfigured(): boolean {
  return !!getConfig().url;
}
