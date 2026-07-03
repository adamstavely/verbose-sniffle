import { getElasticClient } from '../status/elastic-client';
import { statusConfig } from '../status/status-config';
import { esDocId, isConflict } from '../es-utils';

const INDEX = () => statusConfig.indices.pageFeedback;

export async function recordFeedback(
  pagePath: string,
  helpful: 'yes' | 'no',
  visitorId: string,
  message?: string
): Promise<{ success: true } | { success: false; error: string }> {
  const client = getElasticClient();

  try {
    // One feedback per (page, visitor): deterministic id + create is atomic,
    // so a conflict means they've already submitted feedback for this page.
    await client.create({
      index: INDEX(),
      id: esDocId('feedback', pagePath, visitorId),
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
    if (isConflict(err)) {
      return { success: false, error: "You've already submitted feedback for this page." };
    }
    console.error('Failed to record feedback in Elasticsearch', err);
    return { success: false, error: 'Failed to submit feedback. Please try again.' };
  }
}
