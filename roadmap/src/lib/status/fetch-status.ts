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
import {
  getStatusSummary,
  getWorkspaceStatuses,
  getWorkspaceFeatureStatuses,
  getExternalSystemStatuses,
  getIncidents,
  getRecentIncidents,
  getIncidentById,
  getScheduledMaintenance,
  getUptime90Days,
} from './elastic-status';
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
  return orMock(() => getStatusSummary(), MOCK_SUMMARY);
}

export async function fetchWorkspaces() {
  return orMock(
    async () => {
      const workspaces = await getWorkspaceStatuses();
      return { workspaces };
    },
    MOCK_WORKSPACES
  );
}

export async function fetchWorkspaceFeatures(workspaceId: string) {
  return orMock(
    async () => {
      const features = await getWorkspaceFeatureStatuses(workspaceId);
      return { workspaceId, features };
    },
    () => getMockWorkspaceFeatures(workspaceId)
  );
}

export async function fetchExternalSystems() {
  return orMock(
    async () => {
      const systems = await getExternalSystemStatuses();
      return { systems };
    },
    MOCK_EXTERNAL_SYSTEMS
  );
}

export async function fetchIncidents() {
  return orMock(
    async () => {
      const incidents = await getIncidents();
      return { incidents };
    },
    MOCK_INCIDENTS
  );
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
    async () => {
      const maintenance = await getScheduledMaintenance();
      return { maintenance };
    },
    MOCK_SCHEDULED_MAINTENANCE
  );
}

export async function fetchUptime() {
  return orMock(() => getUptime90Days(), () => getMockUptime());
}
