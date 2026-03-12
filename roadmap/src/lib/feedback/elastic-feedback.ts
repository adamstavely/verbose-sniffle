import { getElasticClient } from '../status/elastic-client';
import { statusConfig } from '../status/status-config';

const INDEX = () => statusConfig.indices.pageFeedback;

export async function recordFeedback(
  pagePath: string,
  helpful: 'yes' | 'no',
  visitorId: string,
  message?: string
): Promise<{ success: true } | { success: false; error: string }> {
  const client = getElasticClient();

  try {
    const existing = await client.search({
      index: INDEX(),
      size: 1,
      query: {
        bool: {
          must: [
            { term: { 'page_path.keyword': pagePath } },
            { term: { 'visitor_id.keyword': visitorId } },
          ],
        },
      },
    });

    const total =
      typeof existing.hits.total === 'object' && 'value' in existing.hits.total
        ? (existing.hits.total as { value: number }).value
        : Number(existing.hits.total ?? 0);
    if (total > 0) {
      return { success: false, error: "You've already submitted feedback for this page." };
    }

    await client.index({
      index: INDEX(),
      document: {
        page_path: pagePath,
        helpful,
        ...(message && { message: message.trim().slice(0, 500) }),
        visitor_id: visitorId,
        '@timestamp': new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Failed to record feedback in Elasticsearch', err);
    return { success: false, error: 'Failed to submit feedback. Please try again.' };
  }
}
