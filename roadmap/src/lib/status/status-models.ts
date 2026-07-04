export type StatusLevel =
  | "HEALTHY"
  | "DEGRADED"
  | "OUTAGE"
  | "UNKNOWN"
  | "MAINTENANCE";

export interface AppStatusSummary {
  level: StatusLevel;
  environment: string;
  overallMessage: string;
  incidentCount: number;
  lastUpdated: string;
}

export interface CoreServiceStatus {
  id: string;
  name: string;
  description?: string;
  level: StatusLevel;
  /** User-facing note shown on the status page when the service is not healthy. */
  impact?: string;
  errorRate?: number;
  latencyP95Ms?: number;
  lastUpdated: string;
  impactingExternalSystemIds?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  ownerTeam?: string;
  environment: string;
  /** Derived status for display (e.g. worst feature status) */
  level?: StatusLevel;
}

export interface Feature {
  id: string;
  name: string;
  category?: string;
  description?: string;
  isCore: boolean;
}

export interface WorkspaceFeatureStatus {
  workspaceId: string;
  featureId: string;
  level: StatusLevel;
  lastSeen: string;
  degradationSummary?: string;
  impactingExternalSystemIds?: string[];
}

export interface IncidentUpdate {
  timestamp: string;
  message: string;
  status?: string;
}

/** Resolved incident for history list (date, id, title, duration, severity, cause) */
export interface ResolvedIncidentEntry {
  id: string;
  date: string;
  title: string;
  duration: string;
  severity: StatusLevel;
  cause: string;
}

export interface IncidentSummary {
  id: string;
  title: string;
  level: StatusLevel;
  startedAt: string;
  resolvedAt?: string;
  description?: string;
  /** What users can do while the incident is ongoing */
  workaround?: string;
  /** AI-specific note (e.g. confidence scores during degradation) */
  aiNote?: string;
  /** User-facing areas affected (e.g. "Website", "App"). */
  affects?: string[];
  updates?: IncidentUpdate[];
  affectedWorkspaceIds?: string[];
  affectedCoreServiceIds?: string[];
  affectedExternalSystemIds?: string[];
}

/** Daily status for 90-day uptime bar */
export type DailyStatus = "operational" | "maintenance" | "degraded" | "unavailable";

export interface UptimeData {
  days: DailyStatus[];
  percentage: number;
}

export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export interface ScheduledMaintenance {
  id: string;
  title: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: MaintenanceStatus;
  affectedCoreServiceIds?: string[];
  affectedExternalSystemIds?: string[];
}

/** DTO shapes for status API responses */
export interface StatusSummaryDto {
  summary: AppStatusSummary;
  coreServices: CoreServiceStatus[];
}

export interface WorkspacesDto {
  workspaces: Workspace[];
}

export interface WorkspaceFeaturesDto {
  workspaceId: string;
  features: WorkspaceFeatureStatus[];
}

export interface IncidentsDto {
  incidents: IncidentSummary[];
}

export interface ScheduledMaintenanceDto {
  maintenance: ScheduledMaintenance[];
}
