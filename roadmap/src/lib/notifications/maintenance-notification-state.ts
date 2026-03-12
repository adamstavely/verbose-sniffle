import { getElasticClient } from '../status/elastic-client';
import { statusConfig } from '../status/status-config';

const INDEX = () => statusConfig.indices.statusMaintenanceNotificationSent;

export async function getMaintenanceSentState(
  maintenanceId: string
): Promise<boolean> {
  const client = getElasticClient();

  try {
    const result = await client.search({
      index: INDEX(),
      size: 1,
      query: {
        term: { 'maintenance_id.keyword': maintenanceId },
      },
    });

    const total =
      typeof result.hits.total === 'object' && 'value' in result.hits.total
        ? (result.hits.total as { value: number }).value
        : Number(result.hits.total ?? 0);
    return total > 0;
  } catch (err) {
    console.error('Failed to get maintenance notification state from Elasticsearch', err);
    return false;
  }
}

export async function recordMaintenanceSent(maintenanceId: string): Promise<void> {
  const client = getElasticClient();

  try {
    await client.index({
      index: INDEX(),
      document: {
        maintenance_id: maintenanceId,
        '@timestamp': new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Failed to record maintenance notification sent in Elasticsearch', err);
    throw err;
  }
}
