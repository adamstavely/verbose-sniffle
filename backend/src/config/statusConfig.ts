export type StatusLevel =
  | "HEALTHY"
  | "DEGRADED"
  | "OUTAGE"
  | "UNKNOWN"
  | "MAINTENANCE";

export interface StatusIndicesConfig {
  coreServices: string;
  workspaces: string;
  externalSystems: string;
  incidents: string;
  scheduledMaintenance: string;
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
  indices: StatusIndicesConfig;
  thresholds: StatusThresholds;
}

export const statusConfig: StatusServiceConfig = {
  timeWindowMinutes: Number(process.env.STATUS_TIME_WINDOW_MINUTES ?? 5),
  indices: {
    coreServices:
      process.env.ELASTICSEARCH_INDEX_CORE_SERVICES ?? "status-core-services",
    workspaces:
      process.env.ELASTICSEARCH_INDEX_WORKSPACES ?? "status-workspaces",
    externalSystems:
      process.env.ELASTICSEARCH_INDEX_EXTERNAL_SYSTEMS ??
      "status-external-systems",
    incidents:
      process.env.ELASTICSEARCH_INDEX_INCIDENTS ?? "status-incidents",
    scheduledMaintenance:
      process.env.ELASTICSEARCH_INDEX_SCHEDULED_MAINTENANCE ??
      "status-scheduled-maintenance",
  },
  thresholds: {
    errorRate: {
      healthyMax: Number(
        process.env.STATUS_ERROR_RATE_HEALTHY_MAX ?? (0.01).toString()
      ),
      degradedMax: Number(
        process.env.STATUS_ERROR_RATE_DEGRADED_MAX ?? (0.05).toString()
      ),
    },
    latencyP95Ms: {
      healthyMax: Number(
        process.env.STATUS_LATENCY_P95_HEALTHY_MAX ?? (500).toString()
      ),
      degradedMax: Number(
        process.env.STATUS_LATENCY_P95_DEGRADED_MAX ?? (1500).toString()
      ),
    },
  },
};

