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

/** Capability item within a group (Analyst Workspace, Operations, Shared Platform) */
export interface CapabilityItem {
  id: string;
  label: string;
  level: StatusLevel;
  /** Impact/degradation description, shown when expanded */
  impact?: string;
  /** Show AI NOTE badge when degraded */
  aiNote?: boolean;
}

/** Capability group with colored bar and items */
export interface CapabilityGroup {
  id: string;
  group: string;
  /** Tailwind color for bar (e.g. violet-500, amber-500, sky-500) */
  barColor: string;
  items: CapabilityItem[];
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
  updates?: IncidentUpdate[];
  affectedWorkspaceIds?: string[];
  affectedCoreServiceIds?: string[];
  affectedExternalSystemIds?: string[];
}

/** Daily status for 90-day uptime bar */
export type DailyStatus = "operational" | "degraded" | "unavailable";

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

