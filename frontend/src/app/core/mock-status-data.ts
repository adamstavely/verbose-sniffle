import type {
  AppStatusSummary,
  CoreServiceStatus,
  Workspace,
  WorkspaceFeatureStatus,
  ExternalSystemStatus,
  IncidentSummary,
  ScheduledMaintenance,
  ResolvedIncidentEntry,
} from 'shared/status-models';
import type {
  StatusSummaryDto,
  WorkspacesDto,
  WorkspaceFeaturesDto,
  ExternalSystemsDto,
  IncidentsDto,
  ScheduledMaintenanceDto,
} from './status-api.service';

const now = new Date().toISOString();
const earlier = new Date(Date.now() - 300_000).toISOString();

export const MOCK_SUMMARY: StatusSummaryDto = {
  summary: {
    level: 'DEGRADED',
    environment: 'staging',
    overallMessage:
      'Some features may be slow or temporarily unavailable. We\'re working on it.',
    incidentCount: 1,
    lastUpdated: now,
  },
  coreServices: [
    {
      id: 'auth-service',
      name: 'Authentication',
      description: 'Login, SSO, and session management',
      level: 'HEALTHY',
      errorRate: 0.001,
      latencyP95Ms: 45,
      lastUpdated: now,
    },
    {
      id: 'billing-service',
      name: 'Billing',
      description: 'Subscriptions and usage metering',
      level: 'DEGRADED',
      errorRate: 0.042,
      latencyP95Ms: 320,
      lastUpdated: earlier,
      impactingExternalSystemIds: ['stripe-api'],
    },
    {
      id: 'messaging-service',
      name: 'Messaging',
      description: 'Real-time notifications and chat',
      level: 'HEALTHY',
      errorRate: 0.002,
      latencyP95Ms: 28,
      lastUpdated: now,
    },
    {
      id: 'storage-service',
      name: 'Storage',
      description: 'File and blob storage',
      level: 'OUTAGE',
      errorRate: 0.89,
      latencyP95Ms: 5000,
      lastUpdated: earlier,
      impactingExternalSystemIds: ['s3-gateway'],
    },
    {
      id: 'search-service',
      name: 'Search',
      description: 'Full-text and faceted search',
      level: 'MAINTENANCE',
      errorRate: 0,
      latencyP95Ms: 120,
      lastUpdated: now,
    },
  ] as CoreServiceStatus[],
};

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
    {
      workspaceId: 'ws-prod-001',
      featureId: 'auth',
      level: 'HEALTHY',
      lastSeen: now,
    },
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
    {
      workspaceId: 'ws-prod-002',
      featureId: 'auth',
      level: 'HEALTHY',
      lastSeen: now,
    },
    {
      workspaceId: 'ws-prod-002',
      featureId: 'messaging',
      level: 'HEALTHY',
      lastSeen: now,
    },
  ],
  'ws-staging-001': [
    {
      workspaceId: 'ws-staging-001',
      featureId: 'auth',
      level: 'HEALTHY',
      lastSeen: now,
    },
    {
      workspaceId: 'ws-staging-001',
      featureId: 'search',
      level: 'MAINTENANCE',
      lastSeen: now,
      degradationSummary: 'Scheduled index rebuild.',
    },
  ],
};

export function getMockWorkspaceFeatures(workspaceId: string): WorkspaceFeaturesDto {
  const features = MOCK_FEATURES_BY_WORKSPACE[workspaceId] ?? [
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
      latencyP95Ms: undefined,
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

const MOCK_INCIDENT_FULL: IncidentSummary = {
  id: 'inc-001',
  title: 'Storage service and S3 gateway outage',
  level: 'OUTAGE',
  startedAt: new Date(Date.now() - 3600_000).toISOString(),
  resolvedAt: undefined,
  description:
    'File uploads and storage are currently unavailable due to connectivity issues with our S3 gateway. We are investigating and will provide updates as we learn more.',
  workaround:
    'Existing files remain accessible for download. For urgent uploads, use the legacy upload endpoint or contact support for manual processing.',
  aiNote:
    'Document analysis features that depend on new uploads will show reduced confidence until storage is restored. Historical analysis remains accurate.',
  updates: [
    {
      timestamp: new Date(Date.now() - 3500_000).toISOString(),
      message: 'Investigating the issue.',
      status: 'Investigating',
    },
    {
      timestamp: new Date(Date.now() - 2400_000).toISOString(),
      message: 'Identified cause: S3 gateway connectivity.',
      status: 'Identified',
    },
    {
      timestamp: new Date(Date.now() - 1200_000).toISOString(),
      message: 'Deploying fix.',
      status: 'Monitoring',
    },
  ],
  affectedWorkspaceIds: ['ws-prod-001'],
  affectedCoreServiceIds: ['storage-service'],
  affectedExternalSystemIds: ['s3-gateway'],
};

export const MOCK_INCIDENTS: IncidentsDto = {
  incidents: [MOCK_INCIDENT_FULL],
};

export function getMockIncidentById(id: string): IncidentSummary | null {
  if (id === 'inc-001') return MOCK_INCIDENT_FULL;
  return null;
}

export const MOCK_RECENT_INCIDENTS: ResolvedIncidentEntry[] = [
  { date: 'Mar 4', id: 'INC-2831', title: 'Elevated search latency', duration: '38 min', severity: 'DEGRADED', cause: 'Elastic index rebalancing during peak hours. Latency normalized after off-peak rebalance.' },
  { date: 'Feb 28', id: 'INC-2814', title: 'Entity resolution delays', duration: '1h 12m', severity: 'DEGRADED', cause: 'Neo4j memory pressure from large graph traversal query. Query killed; cache cleared.' },
  { date: 'Feb 19', id: 'INC-2798', title: 'Authentication intermittent failures', duration: '22 min', severity: 'DEGRADED', cause: 'Keycloak session store timeout. Auto-remediation resolved without user action required.' },
  { date: 'Feb 11', id: 'INC-2771', title: 'Data enrichment pipeline stalled', duration: '2h 04m', severity: 'DEGRADED', cause: 'Kafka consumer lag caused enrichment backlog. Records processed in order; no data loss.' },
  { date: 'Jan 30', id: 'INC-2740', title: 'Document Analysis unavailable', duration: '47 min', severity: 'OUTAGE', cause: 'Media processing service OOM. Restart resolved. Autoscaling policy updated.' },
];

const tomorrowStart = new Date(Date.now() + 86400_000);
tomorrowStart.setHours(2, 0, 0, 0);
const tomorrowEnd = new Date(Date.now() + 86400_000);
tomorrowEnd.setHours(2, 30, 0, 0);

export const MOCK_SCHEDULED_MAINTENANCE: ScheduledMaintenanceDto = {
  maintenance: [
    {
      id: 'maint-001',
      title: 'Search index rebuild',
      description:
        'We will rebuild the search index to improve performance. Search may be briefly unavailable.',
      scheduledStart: tomorrowStart.toISOString(),
      scheduledEnd: tomorrowEnd.toISOString(),
      status: 'SCHEDULED',
      affectedCoreServiceIds: ['search-service'],
    },
  ] as ScheduledMaintenance[],
};
