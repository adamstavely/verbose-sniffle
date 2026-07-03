import { getElasticClient } from '../status/elastic-client';
import { statusConfig } from '../status/status-config';
import { esDocId, isConflict } from '../es-utils';

const INDEX = () => statusConfig.indices.statusSubscribers;

export async function addSubscriber(
  email: string
): Promise<
  | { success: true; alreadySubscribed: boolean }
  | { success: false; error: string }
> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: 'Email is required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const client = getElasticClient();

  try {
    // Key the document by the email so subscribing is idempotent and atomic;
    // a conflict means they were already subscribed (so we skip the
    // confirmation email rather than re-sending it).
    await client.create({
      index: INDEX(),
      id: esDocId('subscriber', normalized),
      document: {
        email: normalized,
        '@timestamp': new Date().toISOString(),
      },
    });

    return { success: true, alreadySubscribed: false };
  } catch (err) {
    if (isConflict(err)) {
      return { success: true, alreadySubscribed: true };
    }
    console.error('Failed to add subscriber in Elasticsearch', err);
    return { success: false, error: 'Failed to subscribe. Please try again.' };
  }
}

export async function getSubscribers(): Promise<string[]> {
  const client = getElasticClient();

  try {
    const result = await client.search({
      index: INDEX(),
      size: 1000,
      _source: ['email'],
    });

    const emails = new Set<string>();
    for (const hit of result.hits.hits ?? []) {
      const src = hit._source as { email?: string };
      if (src?.email) emails.add(src.email);
    }
    return Array.from(emails);
  } catch (err) {
    console.error('Failed to get subscribers from Elasticsearch', err);
    return [];
  }
}
