import { getElasticClient } from '../status/elastic-client';
import { statusConfig } from '../status/status-config';

const INDEX = () => statusConfig.indices.statusSubscribers;

export async function addSubscriber(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: 'Email is required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const client = getElasticClient();

  try {
    const existing = await client.search({
      index: INDEX(),
      size: 1,
      query: {
        term: { 'email.keyword': normalized },
      },
    });

    const total =
      typeof existing.hits.total === 'object' && 'value' in existing.hits.total
        ? (existing.hits.total as { value: number }).value
        : Number(existing.hits.total ?? 0);
    if (total > 0) {
      return { success: true };
    }

    await client.index({
      index: INDEX(),
      document: {
        email: normalized,
        '@timestamp': new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err) {
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
