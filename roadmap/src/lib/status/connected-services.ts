import type { StatusLevel, UptimeData } from './status-models';

/**
 * A third-party or internal system the platform depends on, shown in the
 * "Connected services" section of the status page.
 *
 * Unlike Service health (which is live Elasticsearch telemetry), this list is
 * curated by hand: edit the `CONNECTED_SYSTEMS` array below to add, remove, or
 * change a system. There is no Elasticsearch index and no build step involved —
 * a change here is reflected the next time the status page is rendered.
 *
 * See CONTENT_GUIDE.md ("Connected services") for the editing guide.
 */
export interface ConnectedSystem {
  /** Stable identifier (kebab-case). */
  id: string;
  /** Display name. */
  name: string;
  /** Category, used only for the human-readable type label. */
  type: 'SAAS' | 'INTERNAL' | 'THIRD_PARTY_API';
  /** Current status. Set by hand here; not derived from telemetry. */
  level: StatusLevel;
  /** Optional short note about the integration (shown on the detail table). */
  note?: string;
}

/**
 * The connected systems shown on the status page. Edit this list to reflect the
 * dependencies the platform actually relies on.
 */
export const CONNECTED_SYSTEMS: ConnectedSystem[] = [
  {
    id: 'identity-provider',
    name: 'Identity Provider',
    type: 'SAAS',
    level: 'HEALTHY',
    note: 'Single sign-on and session management.',
  },
  {
    id: 'object-storage',
    name: 'Object Storage',
    type: 'INTERNAL',
    level: 'HEALTHY',
    note: 'Document and file storage backend.',
  },
  {
    id: 'email-delivery',
    name: 'Email Delivery',
    type: 'SAAS',
    level: 'HEALTHY',
    note: 'Transactional email provider.',
  },
  {
    id: 'geocoding-api',
    name: 'Geocoding API',
    type: 'THIRD_PARTY_API',
    level: 'HEALTHY',
    note: 'Address and coordinate lookups.',
  },
];

/** Returns the curated connected systems, sorted by display name. */
export function getConnectedSystems(): ConnectedSystem[] {
  return [...CONNECTED_SYSTEMS].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Illustrative 90-day uptime series per connected system, keyed by id.
 *
 * Connected services are a hand-curated list, not telemetry, so there is no real
 * per-day history to draw. This produces a deterministic, mostly-operational
 * stand-in (seeded by index) purely so the status page can show a 90-day bar
 * consistent with the live Service health section. If these systems ever gain a
 * real health feed, replace this with that data.
 */
export function getConnectedSystemUptime(): Record<string, UptimeData> {
  const systems = getConnectedSystems();
  const out: Record<string, UptimeData> = {};
  systems.forEach((sys, i) => {
    const days: UptimeData['days'] = [];
    let operational = 0;
    for (let d = 0; d < 90; d++) {
      const r = ((d * (i + 5) * 11 + i * 17 + 7) % 100) / 100;
      const day: UptimeData['days'][number] =
        r > 0.985 ? 'unavailable' : r > 0.955 ? 'degraded' : 'operational';
      days.push(day);
      if (day === 'operational') operational++;
    }
    out[sys.id] = { days, percentage: Math.round((operational / 90) * 1000) / 10 };
  });
  return out;
}
