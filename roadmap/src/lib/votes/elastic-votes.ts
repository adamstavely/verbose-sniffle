import { getElasticClient } from '../status/elastic-client';
import { statusConfig } from '../status/status-config';

const INDEX = () => statusConfig.indices.roadmapVotes;

export async function recordVote(
  featureRequestId: string,
  voterId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const client = getElasticClient();

  try {
      const existing = await client.search({
      index: INDEX(),
      size: 1,
      query: {
        bool: {
          must: [
            { term: { 'feature_request_id.keyword': featureRequestId } },
            { term: { 'voter_id.keyword': voterId } },
          ],
        },
      },
    });

    const total =
      typeof existing.hits.total === 'object' && 'value' in existing.hits.total
        ? (existing.hits.total as { value: number }).value
        : Number(existing.hits.total ?? 0);
    if (total > 0) {
      return { success: false, error: 'already_voted' };
    }

    await client.index({
      index: INDEX(),
      document: {
        feature_request_id: featureRequestId,
        voter_id: voterId,
        '@timestamp': new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Failed to record vote in Elasticsearch', err);
    return { success: false, error: 'Failed to record vote. Please try again.' };
  }
}

export async function getVoteCounts(): Promise<Record<string, number>> {
  const client = getElasticClient();

  try {
    const result = await client.search({
      index: INDEX(),
      size: 0,
      aggs: {
        by_feature: {
          terms: {
            field: 'feature_request_id.keyword',
            size: 500,
          },
        },
      },
    });

    const buckets =
      (result.aggregations?.by_feature as { buckets?: Array<{ key: string; doc_count: number }> })
        ?.buckets ?? [];
    const counts: Record<string, number> = {};
    for (const b of buckets) {
      counts[b.key] = b.doc_count;
    }
    return counts;
  } catch (err) {
    console.error('Failed to get vote counts from Elasticsearch', err);
    return {};
  }
}

export async function getVotedByMe(voterId: string): Promise<Set<string>> {
  if (!voterId) return new Set<string>();

  const client = getElasticClient();

  try {
    const result = await client.search({
      index: INDEX(),
      size: 500,
      _source: ['feature_request_id'],
      query: {
        term: { 'voter_id.keyword': voterId },
      },
    });

    const ids = new Set<string>();
    for (const hit of result.hits.hits ?? []) {
      const src = hit._source as { feature_request_id?: string };
      if (src?.feature_request_id) ids.add(src.feature_request_id);
    }
    return ids;
  } catch (err) {
    console.error('Failed to get voted-by-me from Elasticsearch', err);
    return new Set<string>();
  }
}
