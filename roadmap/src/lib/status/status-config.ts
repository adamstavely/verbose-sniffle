export interface StatusIndicesConfig {
  coreServices: string;
  workspaces: string;
  incidents: string;
  scheduledMaintenance: string;
  roadmapVotes: string;
  pageFeedback: string;
}

export interface StatusServiceConfig {
  timeWindowMinutes: number;
  indices: StatusIndicesConfig;
}

function env(name: string, fallback: string): string {
  return (typeof process !== 'undefined' ? process.env?.[name] : undefined) ?? fallback;
}

function envNum(name: string, fallback: number): number {
  const v = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const statusConfig: StatusServiceConfig = {
  timeWindowMinutes: envNum('STATUS_TIME_WINDOW_MINUTES', 5),
  indices: {
    coreServices: env('ELASTICSEARCH_INDEX_CORE_SERVICES', 'status-core-services'),
    workspaces: env('ELASTICSEARCH_INDEX_WORKSPACES', 'status-workspaces'),
    incidents: env('ELASTICSEARCH_INDEX_INCIDENTS', 'status-incidents'),
    scheduledMaintenance:
      env('ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE', 'status-scheduled-maintenance'),
    roadmapVotes: env('ELASTICSEARCH_INDEX_ROADMAP_VOTES', 'roadmap-votes'),
    pageFeedback: env('ELASTICSEARCH_INDEX_PAGE_FEEDBACK', 'page-feedback'),
  },
};
