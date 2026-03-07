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

export interface ExternalSystemStatus {
  id: string;
  name: string;
  type: "SAAS" | "INTERNAL" | "THIRD_PARTY_API";
  level: StatusLevel;
  latencyP95Ms?: number;
  errorRate?: number;
  lastUpdated: string;
  impactedCoreServiceIds?: string[];
  impactedFeatureIds?: string[];
}

export interface IncidentUpdate {
  timestamp: string;
  message: string;
  status?: string;
}

export interface IncidentSummary {
  id: string;
  title: string;
  level: StatusLevel;
  startedAt: string;
  resolvedAt?: string;
  description?: string;
  updates?: IncidentUpdate[];
  affectedWorkspaceIds?: string[];
  affectedCoreServiceIds?: string[];
  affectedExternalSystemIds?: string[];
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

