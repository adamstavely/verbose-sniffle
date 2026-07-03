import type { IncidentSummary } from 'shared/status-models';
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
import { cached } from './cache';

const USE_MOCK =
  typeof import.meta.env !== 'undefined' &&
  import.meta.env.PUBLIC_USE_MOCK_STATUS === 'true';

async function orMock<T>(
  fn: () => Promise<T>,
  mock: T | (() => T)
): Promise<T> {
  // Mock data is ONLY for the explicit demo/dev mode (PUBLIC_USE_MOCK_STATUS=true).
  // In production we never silently substitute mock data: on an Elasticsearch
  // failure the underlying query functions return an honest "unknown"/empty state
  // (UNKNOWN summary, empty lists), which the status page renders as such rather
  // than showing fake healthy telemetry.
  if (USE_MOCK) {
    return typeof mock === 'function' ? (mock as () => T)() : mock;
  }
  return await fn();
}

// Reads are cached briefly (see cache.ts) so a burst of status-page loads does
// not hit Elasticsearch on every request.

export async function fetchSummary() {
  return cached('summary', () => orMock(() => getStatusSummary(), MOCK_SUMMARY));
}

export async function fetchWorkspaces() {
  return cached('workspaces', () =>
    orMock(async () => {
      const workspaces = await getWorkspaceStatuses();
      return { workspaces };
    }, MOCK_WORKSPACES)
  );
}

export async function fetchWorkspaceFeatures(workspaceId: string) {
  return cached(`workspace-features:${workspaceId}`, () =>
    orMock(
      async () => {
        const features = await getWorkspaceFeatureStatuses(workspaceId);
        return { workspaceId, features };
      },
      () => getMockWorkspaceFeatures(workspaceId)
    )
  );
}

export async function fetchExternalSystems() {
  return cached('external-systems', () =>
    orMock(async () => {
      const systems = await getExternalSystemStatuses();
      return { systems };
    }, MOCK_EXTERNAL_SYSTEMS)
  );
}

export async function fetchIncidents() {
  return cached('incidents', () =>
    orMock(async () => {
      const incidents = await getIncidents();
      return { incidents };
    }, MOCK_INCIDENTS)
  );
}

export async function fetchRecentIncidents() {
  return cached('recent-incidents', () =>
    orMock(() => getRecentIncidents(), MOCK_RECENT_INCIDENTS)
  );
}

export async function fetchIncidentById(
  incidentId: string
): Promise<IncidentSummary | null> {
  return cached(`incident:${incidentId}`, async () => {
    if (USE_MOCK) return getMockIncidentById(incidentId);
    // getIncidentById handles its own errors and returns null when unavailable.
    return await getIncidentById(incidentId);
  });
}

export async function fetchScheduledMaintenance() {
  return cached('scheduled-maintenance', () =>
    orMock(async () => {
      const maintenance = await getScheduledMaintenance();
      return { maintenance };
    }, MOCK_SCHEDULED_MAINTENANCE)
  );
}

export async function fetchUptime() {
  return cached('uptime', () => orMock(() => getUptime90Days(), () => getMockUptime()));
}
