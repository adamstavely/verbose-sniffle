import { getElasticClient } from '../status/elastic-client';
import { statusConfig } from '../status/status-config';

const INDEX = () => statusConfig.indices.statusNotificationSent;

export type NotificationType = 'new' | 'update' | 'resolved';

export interface LastSentState {
  type: NotificationType;
  lastUpdatedAt: string;
  /** Updates signature when type is new/update; used to detect new updates */
  updatesSignature?: string;
}

export async function getLastSentState(
  incidentId: string
): Promise<LastSentState | null> {
  const client = getElasticClient();

  try {
    const result = await client.search({
      index: INDEX(),
      size: 1,
      sort: [{ '@timestamp': 'desc' }],
      query: {
        term: { 'incident_id.keyword': incidentId },
      },
    });

    const hit = result.hits.hits[0];
    if (!hit || !hit._source) return null;

    const src = hit._source as {
      type?: NotificationType;
      last_updated_at?: string;
      updates_signature?: string;
    };
    if (!src.type || !src.last_updated_at) return null;

    return {
      type: src.type,
      lastUpdatedAt: src.last_updated_at,
      updatesSignature: src.updates_signature,
    };
  } catch (err) {
    console.error('Failed to get notification state from Elasticsearch', err);
    return null;
  }
}

export async function recordSent(
  incidentId: string,
  type: NotificationType,
  lastUpdatedAt: string,
  updatesSignature?: string
): Promise<void> {
  const client = getElasticClient();

  try {
    const doc: Record<string, unknown> = {
      incident_id: incidentId,
      type,
      last_updated_at: lastUpdatedAt,
      '@timestamp': new Date().toISOString(),
    };
    if (updatesSignature !== undefined) {
      doc.updates_signature = updatesSignature;
    }
    await client.index({
      index: INDEX(),
      document: doc,
    });
  } catch (err) {
    console.error('Failed to record notification sent in Elasticsearch', err);
    throw err;
  }
}
