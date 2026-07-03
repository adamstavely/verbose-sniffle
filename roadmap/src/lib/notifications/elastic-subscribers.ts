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
  const PAGE_SIZE = 1000;
  const emails = new Set<string>();

  try {
    // Paginate with search_after so every subscriber is notified — no silent
    // truncation at a single page. Emails are unique (doc id is keyed by email),
    // so `email.keyword` is a total sort order.
    let searchAfter: unknown[] | undefined;
    for (;;) {
      const result = await client.search<{ email?: string }>({
        index: INDEX(),
        size: PAGE_SIZE,
        _source: ['email'],
        sort: [{ 'email.keyword': 'asc' }],
        ...(searchAfter ? { search_after: searchAfter } : {}),
      });

      const hits = result.hits.hits ?? [];
      for (const hit of hits) {
        if (hit._source?.email) emails.add(hit._source.email);
      }

      if (hits.length < PAGE_SIZE) break;
      searchAfter = hits[hits.length - 1]?.sort;
      if (!searchAfter) break;
    }

    return Array.from(emails);
  } catch (err) {
    console.error('Failed to get subscribers from Elasticsearch', err);
    return [];
  }
}
