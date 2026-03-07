import type { StatusLevel } from './status-models';

/** User-friendly labels for status levels */
export const STATUS_LABELS: Record<StatusLevel, string> = {
  HEALTHY: 'All systems operational',
  DEGRADED: 'Some issues',
  OUTAGE: 'Service unavailable',
  MAINTENANCE: 'Scheduled maintenance',
  UNKNOWN: 'Checking status…',
};

/** User-friendly display names for feature IDs */
export const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  auth: 'Log in',
  billing: 'Billing & payments',
  messaging: 'Messaging',
  storage: 'File storage',
  search: 'Search',
  'default-feature': 'General',
};

/** User-friendly labels for external system types */
export const EXTERNAL_SYSTEM_TYPE_LABELS: Record<string, string> = {
  SAAS: 'Cloud service',
  INTERNAL: 'Internal system',
  THIRD_PARTY_API: 'External API',
};

export function getStatusLabel(level: StatusLevel | null | undefined): string {
  if (!level) return STATUS_LABELS.UNKNOWN;
  return STATUS_LABELS[level] ?? level;
}

export function getFeatureDisplayName(featureId: string): string {
  return FEATURE_DISPLAY_NAMES[featureId] ?? featureId;
}

export function getExternalSystemTypeLabel(type: string): string {
  return EXTERNAL_SYSTEM_TYPE_LABELS[type] ?? type;
}
