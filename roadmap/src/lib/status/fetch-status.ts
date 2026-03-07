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
import {
  getSummary,
  getWorkspaces,
  getWorkspaceFeatures,
  getExternalSystems,
  getIncidents,
  getRecentIncidents,
  getIncidentById,
  getScheduledMaintenance,
  getUptime,
} from './api';
import {
  MOCK_SUMMARY,
  MOCK_WORKSPACES,
  getMockWorkspaceFeatures,
  MOCK_EXTERNAL_SYSTEMS,
  MOCK_INCIDENTS,
  getMockIncidentById,
  MOCK_RECENT_INCIDENTS,
  MOCK_SCHEDULED_MAINTENANCE,
  getMockUptime,
} from './mock-data';

const USE_MOCK =
  typeof import.meta.env !== 'undefined' &&
  import.meta.env.PUBLIC_USE_MOCK_STATUS === 'true';

async function orMock<T>(
  fn: () => Promise<T>,
  mock: T | (() => T)
): Promise<T> {
  if (USE_MOCK) {
    return typeof mock === 'function' ? (mock as () => T)() : mock;
  }
  try {
    return await fn();
  } catch {
    return typeof mock === 'function' ? (mock as () => T)() : mock;
  }
}

export async function fetchSummary() {
  return orMock(() => getSummary(), MOCK_SUMMARY);
}

export async function fetchWorkspaces() {
  return orMock(() => getWorkspaces(), MOCK_WORKSPACES);
}

export async function fetchWorkspaceFeatures(workspaceId: string) {
  return orMock(
    () => getWorkspaceFeatures(workspaceId),
    () => getMockWorkspaceFeatures(workspaceId)
  );
}

export async function fetchExternalSystems() {
  return orMock(() => getExternalSystems(), MOCK_EXTERNAL_SYSTEMS);
}

export async function fetchIncidents() {
  return orMock(() => getIncidents(), MOCK_INCIDENTS);
}

export async function fetchRecentIncidents() {
  return orMock(() => getRecentIncidents(), MOCK_RECENT_INCIDENTS);
}

export async function fetchIncidentById(
  incidentId: string
): Promise<IncidentSummary | null> {
  if (USE_MOCK) return getMockIncidentById(incidentId);
  try {
    return await getIncidentById(incidentId);
  } catch {
    return getMockIncidentById(incidentId);
  }
}

export async function fetchScheduledMaintenance() {
  return orMock(
    () => getScheduledMaintenance(),
    MOCK_SCHEDULED_MAINTENANCE
  );
}

export async function fetchUptime() {
  return orMock(() => getUptime(), () => getMockUptime());
}
