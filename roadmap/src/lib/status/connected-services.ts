import type { StatusLevel } from './status-models';

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
