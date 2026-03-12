export interface StatusIndicesConfig {
  coreServices: string;
  workspaces: string;
  externalSystems: string;
  incidents: string;
  scheduledMaintenance: string;
  roadmapVotes: string;
  statusSubscribers: string;
  statusNotificationSent: string;
  pageFeedback: string;
}

export interface StatusThresholds {
  errorRate: {
    healthyMax: number;
    degradedMax: number;
  };
  latencyP95Ms: {
    healthyMax: number;
    degradedMax: number;
  };
}

export interface StatusServiceConfig {
  timeWindowMinutes: number;
  /** Minutes to look back for incidents when running notification delivery (default 1440 = 24h) */
  notificationIncidentWindowMinutes: number;
  indices: StatusIndicesConfig;
  thresholds: StatusThresholds;
}

function env(name: string, fallback: string): string {
  return (typeof process !== 'undefined' && process.env?.[name]) ?? fallback;
}

function envNum(name: string, fallback: number): number {
  const v = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  return v !== undefined ? Number(v) : fallback;
}

export const statusConfig: StatusServiceConfig = {
  timeWindowMinutes: envNum('STATUS_TIME_WINDOW_MINUTES', 5),
  notificationIncidentWindowMinutes: envNum(
    'NOTIFICATION_INCIDENT_WINDOW_MINUTES',
    1440
  ),
  indices: {
    coreServices: env('ELASTICSEARCH_INDEX_CORE_SERVICES', 'status-core-services'),
    workspaces: env('ELASTICSEARCH_INDEX_WORKSPACES', 'status-workspaces'),
    externalSystems:
      env('ELASTICSEARCH_INDEX_EXTERNAL_SYSTEMS', 'status-external-systems'),
    incidents: env('ELASTICSEARCH_INDEX_INCIDENTS', 'status-incidents'),
    scheduledMaintenance:
      env('ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE', 'status-scheduled-maintenance'),
    roadmapVotes: env('ELASTICSEARCH_INDEX_ROADMAP_VOTES', 'roadmap-votes'),
    statusSubscribers: env('ELASTICSEARCH_INDEX_STATUS_SUBSCRIBERS', 'status-subscribers'),
    statusNotificationSent: env(
      'ELASTICSEARCH_INDEX_STATUS_NOTIFICATION_SENT',
      'status-notification-sent'
    ),
    pageFeedback: env('ELASTICSEARCH_INDEX_PAGE_FEEDBACK', 'page-feedback'),
  },
  thresholds: {
    errorRate: {
      healthyMax: envNum('STATUS_ERROR_RATE_HEALTHY_MAX', 0.01),
      degradedMax: envNum('STATUS_ERROR_RATE_DEGRADED_MAX', 0.05),
    },
    latencyP95Ms: {
      healthyMax: envNum('STATUS_LATENCY_P95_HEALTHY_MAX', 500),
      degradedMax: envNum('STATUS_LATENCY_P95_DEGRADED_MAX', 1500),
    },
  },
};
