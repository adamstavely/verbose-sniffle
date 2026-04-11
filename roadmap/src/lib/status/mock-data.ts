import type {
  Workspace,
  WorkspaceFeatureStatus,
  ExternalSystemStatus,
  UptimeData,
} from 'shared/status-models';
import type {
  WorkspacesDto,
  WorkspaceFeaturesDto,
  ExternalSystemsDto,
} from './status-models';

const now = new Date().toISOString();
const earlier = new Date(Date.now() - 300_000).toISOString();

export const MOCK_WORKSPACES: WorkspacesDto = {
  workspaces: [
    {
      id: 'ws-prod-001',
      name: 'Acme Corp',
      ownerTeam: 'team-acme',
      environment: 'production',
      level: 'OUTAGE',
    },
    {
      id: 'ws-prod-002',
      name: 'Beta Customers',
      ownerTeam: 'team-growth',
      environment: 'production',
      level: 'HEALTHY',
    },
    {
      id: 'ws-staging-001',
      name: 'Integration',
      ownerTeam: 'team-platform',
      environment: 'staging',
      level: 'MAINTENANCE',
    },
  ] as Workspace[],
};

const MOCK_FEATURES_BY_WORKSPACE: Record<string, WorkspaceFeatureStatus[]> = {
  'ws-prod-001': [
    { workspaceId: 'ws-prod-001', featureId: 'auth', level: 'HEALTHY', lastSeen: now },
    {
      workspaceId: 'ws-prod-001',
      featureId: 'billing',
      level: 'DEGRADED',
      lastSeen: earlier,
      degradationSummary: 'Elevated Stripe API latency.',
      impactingExternalSystemIds: ['stripe-api'],
    },
    {
      workspaceId: 'ws-prod-001',
      featureId: 'storage',
      level: 'OUTAGE',
      lastSeen: earlier,
      degradationSummary: 'S3 gateway unreachable.',
      impactingExternalSystemIds: ['s3-gateway'],
    },
  ],
  'ws-prod-002': [
    { workspaceId: 'ws-prod-002', featureId: 'auth', level: 'HEALTHY', lastSeen: now },
    { workspaceId: 'ws-prod-002', featureId: 'messaging', level: 'HEALTHY', lastSeen: now },
  ],
  'ws-staging-001': [
    { workspaceId: 'ws-staging-001', featureId: 'auth', level: 'HEALTHY', lastSeen: now },
    {
      workspaceId: 'ws-staging-001',
      featureId: 'search',
      level: 'MAINTENANCE',
      lastSeen: now,
      degradationSummary: 'Scheduled index rebuild.',
    },
  ],
};

export function getMockWorkspaceFeatures(
  workspaceId: string
): WorkspaceFeaturesDto {
  const features =
    MOCK_FEATURES_BY_WORKSPACE[workspaceId] ?? [
      {
        workspaceId,
        featureId: 'default-feature',
        level: 'UNKNOWN',
        lastSeen: now,
      },
    ];
  return { workspaceId, features };
}

export const MOCK_EXTERNAL_SYSTEMS: ExternalSystemsDto = {
  systems: [
    {
      id: 'stripe-api',
      name: 'Stripe API',
      type: 'THIRD_PARTY_API',
      level: 'DEGRADED',
      latencyP95Ms: 410,
      errorRate: 0.031,
      lastUpdated: earlier,
      impactedCoreServiceIds: ['billing-service'],
      impactedFeatureIds: ['billing'],
    },
    {
      id: 's3-gateway',
      name: 'S3 Gateway',
      type: 'INTERNAL',
      level: 'OUTAGE',
      errorRate: 0.95,
      lastUpdated: earlier,
      impactedCoreServiceIds: ['storage-service'],
      impactedFeatureIds: ['storage'],
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      type: 'SAAS',
      level: 'HEALTHY',
      latencyP95Ms: 85,
      errorRate: 0.001,
      lastUpdated: now,
    },
  ] as ExternalSystemStatus[],
};

/** Deterministic mock uptime for when API is unavailable */
export function getMockUptime(): UptimeData {
  const days: UptimeData['days'] = [];
  let operational = 0;
  for (let i = 0; i < 90; i++) {
    const r = ((i * 7 + 13) % 100) / 100;
    const status: UptimeData['days'][number] =
      r > 0.97 ? 'unavailable' : r > 0.94 ? 'degraded' : 'operational';
    days.push(status);
    if (status === 'operational') operational++;
  }
  return {
    days,
    percentage: Math.round((operational / 90) * 1000) / 10,
  };
}
