import type { Client } from '@elastic/elasticsearch';
import { getElasticClient } from './elastic-client';
import { statusConfig } from './status-config';
import type {
  StatusLevel,
  AppStatusSummary,
  CoreServiceStatus,
  Workspace,
  WorkspaceFeatureStatus,
  ExternalSystemStatus,
  IncidentSummary,
  IncidentUpdate,
  ResolvedIncidentEntry,
  UptimeData,
  DailyStatus,
  ScheduledMaintenance,
} from './status-models';

interface ElasticCoreServiceDoc {
  '@timestamp'?: string;
  service_id?: string;
  service_name?: string;
  status_level?: StatusLevel;
  error_rate?: number;
  latency_p95_ms?: number;
}

interface ElasticWorkspaceDoc {
  '@timestamp'?: string;
  workspace_id?: string;
  workspace_name?: string;
  owner_team?: string;
  environment?: string;
  status_level?: StatusLevel;
}

interface ElasticWorkspaceFeatureDoc {
  '@timestamp'?: string;
  workspace_id?: string;
  feature_id?: string;
  feature_name?: string;
  status_level?: StatusLevel;
  degradation_summary?: string;
  impacting_external_system_ids?: string[];
}

interface ElasticExternalSystemDoc {
  '@timestamp'?: string;
  system_id?: string;
  system_name?: string;
  system_type?: 'SAAS' | 'INTERNAL' | 'THIRD_PARTY_API';
  status_level?: StatusLevel;
  latency_p95_ms?: number;
  error_rate?: number;
  impacted_core_service_ids?: string[];
  impacted_feature_ids?: string[];
}

interface ElasticIncidentUpdateDoc {
  timestamp?: string;
  message?: string;
  status?: string;
}

interface ElasticIncidentDoc {
  '@timestamp'?: string;
  incident_id?: string;
  title?: string;
  status_level?: StatusLevel;
  started_at?: string;
  resolved_at?: string;
  description?: string;
  updates?: ElasticIncidentUpdateDoc[];
  affected_workspace_ids?: string[];
  affected_core_service_ids?: string[];
  affected_external_system_ids?: string[];
}

type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

interface ElasticScheduledMaintenanceDoc {
  '@timestamp'?: string;
  maintenance_id?: string;
  title?: string;
  description?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  status?: string;
  affected_core_service_ids?: string[];
  affected_external_system_ids?: string[];
}

export interface StatusSummaryResponse {
  summary: AppStatusSummary;
  coreServices: CoreServiceStatus[];
}

function nowIso(): string {
  return new Date().toISOString();
}

const STATUS_ORDER: StatusLevel[] = [
  'OUTAGE',
  'DEGRADED',
  'MAINTENANCE',
  'UNKNOWN',
  'HEALTHY',
];

function worseStatus(a: StatusLevel, b: StatusLevel): StatusLevel {
  const idxA = STATUS_ORDER.indexOf(a);
  const idxB = STATUS_ORDER.indexOf(b);
  return idxA <= idxB ? a : b;
}

function toCoreServiceStatus(
  doc: ElasticCoreServiceDoc,
  fallbackId: string
): CoreServiceStatus {
  const timestamp = doc['@timestamp'] ?? nowIso();
  const status: StatusLevel = doc.status_level ?? 'UNKNOWN';

  return {
    id: doc.service_id ?? fallbackId,
    name: doc.service_name ?? fallbackId,
    level: status,
    errorRate: doc.error_rate,
    latencyP95Ms: doc.latency_p95_ms,
    lastUpdated: timestamp,
  };
}

async function fetchCoreServices(client: Client): Promise<CoreServiceStatus[]> {
  const to = nowIso();
  const from = new Date(
    Date.now() - statusConfig.timeWindowMinutes * 60_000
  ).toISOString();

  const result = await client.search<ElasticCoreServiceDoc>({
    index: statusConfig.indices.coreServices,
    size: 500,
    sort: ['@timestamp:desc'],
    query: {
      range: {
        '@timestamp': {
          gte: from,
          lte: to,
        },
      },
    },
  });

  const latestByService = new Map<string, ElasticCoreServiceDoc>();

  for (const hit of result.hits.hits) {
    const doc = hit._source ?? {};
    const id = doc.service_id ?? hit._id ?? 'unknown-service';

    if (!latestByService.has(id)) {
      latestByService.set(id, doc);
    }
  }

  return Array.from(latestByService.entries()).map(([id, doc]) =>
    toCoreServiceStatus(doc, id)
  );
}

export async function getStatusSummary(): Promise<StatusSummaryResponse> {
  const client = getElasticClient();
  const environment =
    (typeof process !== 'undefined' && process.env?.STATUS_ENVIRONMENT) ??
    'production';

  try {
    const coreServices = await fetchCoreServices(client);

    let overall: StatusLevel = 'UNKNOWN';
    for (const svc of coreServices) {
      overall =
        overall === 'UNKNOWN' ? svc.level : worseStatus(overall, svc.level);
    }

    const summary: AppStatusSummary = {
      level: coreServices.length ? overall : 'UNKNOWN',
      environment,
      overallMessage: coreServices.length
        ? 'Status derived from core service telemetry.'
        : 'No recent core service telemetry available.',
      incidentCount: 0,
      lastUpdated: nowIso(),
    };

    return { summary, coreServices };
  } catch (error) {
    console.error('Failed to query ElasticSearch for status summary', error);

    const summary: AppStatusSummary = {
      level: 'UNKNOWN',
      environment,
      overallMessage:
        'Unable to contact observability backend. Status is currently unknown.',
      incidentCount: 0,
      lastUpdated: nowIso(),
    };

    return {
      summary,
      coreServices: [],
    };
  }
}

export async function getWorkspaceStatuses(): Promise<Workspace[]> {
  const client = getElasticClient();
  const to = nowIso();
  const from = new Date(
    Date.now() - statusConfig.timeWindowMinutes * 60_000
  ).toISOString();

  try {
    const result = await client.search<ElasticWorkspaceDoc>({
      index: statusConfig.indices.workspaces,
      size: 1000,
      sort: ['@timestamp:desc'],
      query: {
        range: {
          '@timestamp': {
            gte: from,
            lte: to,
          },
        },
      },
    });

    const latestByWorkspace = new Map<string, ElasticWorkspaceDoc>();

    for (const hit of result.hits.hits) {
      const doc = hit._source ?? {};
      const id = doc.workspace_id ?? hit._id ?? 'unknown-workspace';

      if (!latestByWorkspace.has(id)) {
        latestByWorkspace.set(id, doc);
      }
    }

    const environment =
      (typeof process !== 'undefined' && process.env?.STATUS_ENVIRONMENT) ??
      'production';

    const workspaces: Workspace[] = Array.from(latestByWorkspace.entries()).map(
      ([id, doc]) => {
        const safeId = id ?? 'unknown-workspace';
        return {
          id: safeId,
          name: doc.workspace_name ?? safeId,
          ownerTeam: doc.owner_team,
          environment: doc.environment ?? environment,
        };
      }
    );

    return workspaces;
  } catch (error) {
    console.error('Failed to query ElasticSearch for workspaces', error);
    return [];
  }
}

export async function getWorkspaceFeatureStatuses(
  workspaceId: string
): Promise<WorkspaceFeatureStatus[]> {
  const client = getElasticClient();
  const to = nowIso();
  const from = new Date(
    Date.now() - statusConfig.timeWindowMinutes * 60_000
  ).toISOString();

  try {
    const result = await client.search<ElasticWorkspaceFeatureDoc>({
      index: statusConfig.indices.workspaces,
      size: 1000,
      sort: ['@timestamp:desc'],
      query: {
        bool: {
          filter: [
            {
              term: {
                workspace_id: workspaceId,
              },
            },
            {
              range: {
                '@timestamp': {
                  gte: from,
                  lte: to,
                },
              },
            },
          ],
        },
      },
    });

    const latestByFeature = new Map<string, ElasticWorkspaceFeatureDoc>();

    for (const hit of result.hits.hits) {
      const doc = hit._source ?? {};
      const featureId = doc.feature_id ?? hit._id ?? 'unknown-feature';

      if (!latestByFeature.has(featureId)) {
        latestByFeature.set(featureId, doc);
      }
    }

    const features: WorkspaceFeatureStatus[] = Array.from(
      latestByFeature.entries()
    ).map(([featureId, doc]) => ({
      workspaceId,
      featureId,
      level: doc.status_level ?? 'UNKNOWN',
      lastSeen: doc['@timestamp'] ?? nowIso(),
      degradationSummary: doc.degradation_summary,
      impactingExternalSystemIds: doc.impacting_external_system_ids,
    }));

    return features;
  } catch (error) {
    console.error(
      'Failed to query ElasticSearch for workspace feature status',
      error
    );
    return [];
  }
}

export async function getExternalSystemStatuses(): Promise<
  ExternalSystemStatus[]
> {
  const client = getElasticClient();
  const to = nowIso();
  const from = new Date(
    Date.now() - statusConfig.timeWindowMinutes * 60_000
  ).toISOString();

  try {
    const result = await client.search<ElasticExternalSystemDoc>({
      index: statusConfig.indices.externalSystems,
      size: 500,
      sort: ['@timestamp:desc'],
      query: {
        range: {
          '@timestamp': {
            gte: from,
            lte: to,
          },
        },
      },
    });

    const latestBySystem = new Map<string, ElasticExternalSystemDoc>();

    for (const hit of result.hits.hits) {
      const doc = hit._source ?? {};
      const id = doc.system_id ?? hit._id ?? 'unknown-system';

      if (!latestBySystem.has(id)) {
        latestBySystem.set(id, doc);
      }
    }

    const systems: ExternalSystemStatus[] = Array.from(
      latestBySystem.entries()
    ).map(([id, doc]) => ({
      id,
      name: doc.system_name ?? id,
      type: doc.system_type ?? 'THIRD_PARTY_API',
      level: doc.status_level ?? 'UNKNOWN',
      latencyP95Ms: doc.latency_p95_ms,
      errorRate: doc.error_rate,
      lastUpdated: doc['@timestamp'] ?? nowIso(),
      impactedCoreServiceIds: doc.impacted_core_service_ids,
      impactedFeatureIds: doc.impacted_feature_ids,
    }));

    return systems;
  } catch (error) {
    console.error(
      'Failed to query ElasticSearch for external system status',
      error
    );
    return [];
  }
}

function toIncidentSummary(
  doc: ElasticIncidentDoc,
  fallbackId: string
): IncidentSummary {
  const id = doc.incident_id ?? fallbackId;
  const updates: IncidentUpdate[] | undefined = doc.updates?.map((u) => ({
    timestamp: u.timestamp ?? nowIso(),
    message: u.message ?? '',
    status: u.status,
  }));

  return {
    id,
    title: doc.title ?? 'Unknown incident',
    level: doc.status_level ?? 'UNKNOWN',
    startedAt: doc.started_at ?? doc['@timestamp'] ?? nowIso(),
    resolvedAt: doc.resolved_at,
    description: doc.description,
    updates: updates?.length ? updates : undefined,
    affectedWorkspaceIds: doc.affected_workspace_ids,
    affectedCoreServiceIds: doc.affected_core_service_ids,
    affectedExternalSystemIds: doc.affected_external_system_ids,
  };
}

export async function getIncidents(): Promise<IncidentSummary[]> {
  const client = getElasticClient();
  const to = nowIso();
  const from = new Date(
    Date.now() - statusConfig.timeWindowMinutes * 60_000
  ).toISOString();

  try {
    const result = await client.search<ElasticIncidentDoc>({
      index: statusConfig.indices.incidents,
      size: 200,
      sort: ['started_at:desc'],
      query: {
        range: {
          started_at: {
            gte: from,
            lte: to,
          },
        },
      },
    });

    const incidents: IncidentSummary[] = result.hits.hits.map(
      (hit: { _source?: ElasticIncidentDoc; _id?: string }) =>
        toIncidentSummary(hit._source ?? {}, hit._id ?? nowIso())
    );

    return incidents;
  } catch (error) {
    console.error('Failed to query ElasticSearch for incidents', error);
    return [];
  }
}

/** Incidents for notification delivery (broader time window: started or resolved in last N minutes). */
export async function getIncidentsForNotifications(): Promise<IncidentSummary[]> {
  const client = getElasticClient();
  const to = nowIso();
  const windowMs =
    statusConfig.notificationIncidentWindowMinutes * 60_000;
  const from = new Date(Date.now() - windowMs).toISOString();

  try {
    const result = await client.search<ElasticIncidentDoc>({
      index: statusConfig.indices.incidents,
      size: 200,
      sort: ['started_at:desc'],
      query: {
        bool: {
          should: [
            { range: { started_at: { gte: from, lte: to } } },
            { range: { resolved_at: { gte: from, lte: to } } },
          ],
          minimum_should_match: 1,
        },
      },
    });

    return result.hits.hits.map(
      (hit: { _source?: ElasticIncidentDoc; _id?: string }) =>
        toIncidentSummary(hit._source ?? {}, hit._id ?? nowIso())
    );
  } catch (error) {
    console.error('Failed to query ElasticSearch for notification incidents', error);
    return [];
  }
}

/** Maintenance with scheduled_start in the notification window (for email delivery). */
export async function getMaintenanceForNotifications(): Promise<ScheduledMaintenance[]> {
  const client = getElasticClient();
  const to = nowIso();
  const windowMs =
    statusConfig.notificationIncidentWindowMinutes * 60_000;
  const from = new Date(Date.now() - windowMs).toISOString();

  try {
    const result = await client.search<ElasticScheduledMaintenanceDoc>({
      index: statusConfig.indices.scheduledMaintenance,
      size: 50,
      sort: ['scheduled_start:asc'],
      query: {
        bool: {
          filter: [
            {
              range: {
                scheduled_start: { gte: from, lte: to },
              },
            },
            {
              range: {
                scheduled_end: { gte: to },
              },
            },
          ],
        },
      },
    });

    return result.hits.hits
      .map((hit) => {
        const doc = hit._source ?? {};
        const id = doc.maintenance_id ?? hit._id ?? 'unknown';
        const status = (doc.status ?? 'SCHEDULED') as MaintenanceStatus;
        return {
          id,
          title: doc.title ?? 'Scheduled maintenance',
          description: doc.description,
          scheduledStart: doc.scheduled_start ?? to,
          scheduledEnd: doc.scheduled_end ?? to,
          status,
          affectedCoreServiceIds: doc.affected_core_service_ids,
          affectedExternalSystemIds: doc.affected_external_system_ids,
        };
      })
      .filter((m) => m.status !== 'COMPLETED');
  } catch (error) {
    console.error(
      'Failed to query ElasticSearch for maintenance notifications',
      error
    );
    return [];
  }
}

export async function getScheduledMaintenance(): Promise<ScheduledMaintenance[]> {
  const client = getElasticClient();
  const now = nowIso();

  try {
    const result = await client.search<ElasticScheduledMaintenanceDoc>({
      index: statusConfig.indices.scheduledMaintenance,
      size: 50,
      sort: ['scheduled_start:asc'],
      query: {
        range: {
          scheduled_end: { gte: now },
        },
      },
    });

    return result.hits.hits
      .map((hit) => {
        const doc = hit._source ?? {};
        const id = doc.maintenance_id ?? hit._id ?? 'unknown';
        const status = (doc.status ?? 'SCHEDULED') as MaintenanceStatus;
        return {
          id,
          title: doc.title ?? 'Scheduled maintenance',
          description: doc.description,
          scheduledStart: doc.scheduled_start ?? now,
          scheduledEnd: doc.scheduled_end ?? now,
          status,
          affectedCoreServiceIds: doc.affected_core_service_ids,
          affectedExternalSystemIds: doc.affected_external_system_ids,
        };
      })
      .filter((m) => m.status !== 'COMPLETED');
  } catch (error) {
    console.error(
      'Failed to query ElasticSearch for scheduled maintenance',
      error
    );
    return [];
  }
}

export async function getRecentIncidents(): Promise<ResolvedIncidentEntry[]> {
  const client = getElasticClient();
  const to = nowIso();
  const from = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const result = await client.search<ElasticIncidentDoc>({
      index: statusConfig.indices.incidents,
      size: 100,
      sort: ['resolved_at:desc'],
      query: {
        bool: {
          filter: [
            { exists: { field: 'resolved_at' } },
            {
              range: {
                resolved_at: { gte: from, lte: to },
              },
            },
          ],
        },
      },
    });

    return result.hits.hits.map((hit) => {
      const doc = hit._source ?? {};
      const id = doc.incident_id ?? hit._id ?? 'unknown';
      const startedAt = new Date(
        doc.started_at ?? doc['@timestamp'] ?? nowIso()
      );
      const resolvedAt = doc.resolved_at
        ? new Date(doc.resolved_at)
        : startedAt;
      const durationMs = resolvedAt.getTime() - startedAt.getTime();
      const duration =
        durationMs < 60_000
          ? `${Math.round(durationMs / 1000)} sec`
          : durationMs < 3600_000
            ? `${Math.round(durationMs / 60_000)} min`
            : `${Math.floor(durationMs / 3600_000)}h ${Math.round((durationMs % 3600_000) / 60_000)}m`;

      return {
        id,
        date: resolvedAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        title: doc.title ?? 'Unknown incident',
        duration,
        severity: (doc.status_level ?? 'UNKNOWN') as StatusLevel,
        cause: doc.description ?? 'No details available.',
      };
    });
  } catch (error) {
    console.error('Failed to query ElasticSearch for recent incidents', error);
    return [];
  }
}

function toDailyStatus(level: StatusLevel): DailyStatus {
  switch (level) {
    case 'OUTAGE':
      return 'unavailable';
    case 'DEGRADED':
    case 'MAINTENANCE':
      return 'degraded';
    default:
      return 'operational';
  }
}

export async function getUptime90Days(): Promise<UptimeData> {
  const client = getElasticClient();
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

  const days: DailyStatus[] = new Array(90).fill('operational');
  const dayIndex = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const fromStart = new Date(from);
    fromStart.setHours(0, 0, 0, 0);
    const diff = Math.floor(
      (d.getTime() - fromStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.max(0, Math.min(89, diff));
  };

  try {
    const [coreResult, incidentResult] = await Promise.all([
      client.search<ElasticCoreServiceDoc>({
        index: statusConfig.indices.coreServices,
        size: 10000,
        query: {
          range: {
            '@timestamp': {
              gte: from.toISOString(),
              lte: to.toISOString(),
            },
          },
        },
      }),
      client.search<ElasticIncidentDoc>({
        index: statusConfig.indices.incidents,
        size: 500,
        query: {
          range: {
            started_at: {
              gte: from.toISOString(),
              lte: to.toISOString(),
            },
          },
        },
      }),
    ]);

    for (const hit of coreResult.hits.hits) {
      const doc = hit._source ?? {};
      const ts = doc['@timestamp'];
      if (!ts) continue;
      const date = new Date(ts);
      const idx = dayIndex(date);
      const level = doc.status_level ?? 'UNKNOWN';
      const current = days[idx];
      const candidate = toDailyStatus(level);
      if (
        candidate === 'unavailable' ||
        (candidate === 'degraded' && current === 'operational')
      ) {
        days[idx] = candidate;
      }
    }

    for (const hit of incidentResult.hits.hits) {
      const doc = hit._source ?? {};
      const level = (doc.status_level ?? 'UNKNOWN') as StatusLevel;
      const startedAt = doc.started_at
        ? new Date(doc.started_at)
        : new Date(doc['@timestamp'] ?? nowIso());
      const resolvedAt = doc.resolved_at
        ? new Date(doc.resolved_at)
        : to;

      const startDay = new Date(startedAt);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(resolvedAt);
      endDay.setHours(0, 0, 0, 0);

      for (
        let d = new Date(startDay);
        d <= endDay;
        d.setDate(d.getDate() + 1)
      ) {
        const idx = dayIndex(new Date(d));
        const candidate = toDailyStatus(level);
        if (
          candidate === 'unavailable' ||
          (candidate === 'degraded' && days[idx] === 'operational')
        ) {
          days[idx] = candidate;
        }
      }
    }

    const operational = days.filter((d) => d === 'operational').length;
    const percentage = Math.round((operational / 90) * 1000) / 10;

    return { days, percentage };
  } catch (error) {
    console.error('Failed to query ElasticSearch for uptime', error);
    const fallback: DailyStatus[] = new Array(90).fill('operational');
    return {
      days: fallback,
      percentage: 100,
    };
  }
}

export async function getIncidentById(
  incidentId: string
): Promise<IncidentSummary | null> {
  const client = getElasticClient();

  try {
    const result = await client.search<ElasticIncidentDoc>({
      index: statusConfig.indices.incidents,
      size: 1,
      sort: ['started_at:desc'],
      query: {
        term: { incident_id: incidentId },
      },
    });

    const hit = result.hits.hits[0];
    if (!hit || !hit._source) return null;

    return toIncidentSummary(hit._source, hit._id ?? incidentId);
  } catch (error) {
    console.error('Failed to query ElasticSearch for incident by id', error);
    return null;
  }
}
