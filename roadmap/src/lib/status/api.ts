import type {
  AppStatusSummary,
  CoreServiceStatus,
  Workspace,
  WorkspaceFeatureStatus,
  ExternalSystemStatus,
  IncidentSummary,
  ScheduledMaintenance,
  ResolvedIncidentEntry,
  UptimeData,
} from 'shared/status-models';

// Server-side fetch needs absolute URL; client uses /api/status (proxied in dev)
const API_BASE =
  (typeof import.meta.env !== 'undefined' &&
    (import.meta.env as Record<string, string>).PUBLIC_STATUS_API_URL) ||
  (typeof window === 'undefined' ? 'http://localhost:4000/api/status' : '/api/status');

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

export interface ExternalSystemsDto {
  systems: ExternalSystemStatus[];
}

export interface IncidentsDto {
  incidents: IncidentSummary[];
}

export interface ScheduledMaintenanceDto {
  maintenance: ScheduledMaintenance[];
}

const FETCH_TIMEOUT_MS = Number(
  (typeof import.meta.env !== 'undefined' &&
    (import.meta.env as Record<string, string>).STATUS_FETCH_TIMEOUT_MS) ||
  15000
);

async function fetchWithTimeout(url: string): Promise<Response> {
  if (FETCH_TIMEOUT_MS <= 0) {
    return fetch(url);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Status ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

export async function getSummary(): Promise<StatusSummaryDto> {
  return fetchJson<StatusSummaryDto>(`${API_BASE}/summary`);
}

export async function getWorkspaces(): Promise<WorkspacesDto> {
  return fetchJson<WorkspacesDto>(`${API_BASE}/workspaces`);
}

export async function getWorkspaceFeatures(
  workspaceId: string
): Promise<WorkspaceFeaturesDto> {
  return fetchJson<WorkspaceFeaturesDto>(
    `${API_BASE}/workspaces/${encodeURIComponent(workspaceId)}/features`
  );
}

export async function getExternalSystems(): Promise<ExternalSystemsDto> {
  return fetchJson<ExternalSystemsDto>(`${API_BASE}/external-systems`);
}

export async function getIncidents(): Promise<IncidentsDto> {
  return fetchJson<IncidentsDto>(`${API_BASE}/incidents`);
}

export async function getRecentIncidents(): Promise<ResolvedIncidentEntry[]> {
  return fetchJson<ResolvedIncidentEntry[]>(`${API_BASE}/incidents/recent`);
}

export async function getIncidentById(
  incidentId: string
): Promise<IncidentSummary | null> {
  try {
    return await fetchJson<IncidentSummary>(
      `${API_BASE}/incidents/${encodeURIComponent(incidentId)}`
    );
  } catch {
    return null;
  }
}

export async function getScheduledMaintenance(): Promise<ScheduledMaintenanceDto> {
  return fetchJson<ScheduledMaintenanceDto>(
    `${API_BASE}/scheduled-maintenance`
  );
}

export async function getUptime(): Promise<UptimeData> {
  return fetchJson<UptimeData>(`${API_BASE}/uptime`);
}
