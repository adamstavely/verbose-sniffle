import type { DailyStatus, StatusLevel } from './status-models';

// Status levels map to the design-system semantic roles (DS v2.1 §4.2):
//   HEALTHY → success · DEGRADED → warning · OUTAGE → danger ·
//   MAINTENANCE → info · unknown/other → neutral.

/** Reduce a service status to its 90-day-bar daily status. */
export function dailyStatusFromLevel(
  level: StatusLevel | null | undefined
): DailyStatus {
  switch (level) {
    case 'OUTAGE':
      return 'unavailable';
    case 'DEGRADED':
      return 'degraded';
    case 'MAINTENANCE':
      return 'maintenance';
    default:
      // HEALTHY, UNKNOWN, and missing samples count as up.
      return 'operational';
  }
}

// Severity order for collapsing a day's samples to its worst state.
const DAILY_RANK: Record<DailyStatus, number> = {
  operational: 0,
  maintenance: 1,
  degraded: 2,
  unavailable: 3,
};

/** The worse (higher-severity) of two daily statuses. */
export function worseDaily(a: DailyStatus, b: DailyStatus): DailyStatus {
  return DAILY_RANK[a] >= DAILY_RANK[b] ? a : b;
}

/**
 * DS-aligned dot colour for an incident/maintenance update's free-text status
 * label (e.g. "Investigating", "Monitoring", "Resolved", "Scheduled").
 */
export function getUpdateStatusDotClass(status?: string): string {
  const s = (status ?? '').toLowerCase();
  if (/complete|resolved|operational|done|fixed/.test(s)) return 'bg-success';
  if (/monitor|schedule/.test(s)) return 'bg-info';
  if (/investigat|identif|progress|degrad|outage|down|impact/.test(s)) return 'bg-warning';
  return 'bg-slate-400';
}

/** DS-aligned bar colour for a daily status (matches the status dots). */
export function getDailyStatusBarClass(day: DailyStatus): string {
  switch (day) {
    case 'unavailable':
      return 'bg-danger';
    case 'degraded':
      return 'bg-warning';
    case 'maintenance':
      return 'bg-info';
    default:
      return 'bg-success/70';
  }
}

/** Tailwind classes for status dots (small solid colored circles). */
export function getStatusDotClass(level: StatusLevel | null | undefined): string {
  switch (level) {
    case 'HEALTHY':
      return 'bg-success';
    case 'DEGRADED':
      return 'bg-warning';
    case 'OUTAGE':
      return 'bg-danger';
    case 'MAINTENANCE':
      return 'bg-info';
    default:
      return 'bg-slate-400';
  }
}

/** Tailwind classes for text-only severity (e.g. recent incidents list). */
export function getStatusTextClass(
  level: StatusLevel | null | undefined
): string {
  switch (level) {
    case 'HEALTHY':
      return 'text-success';
    case 'DEGRADED':
      return 'text-warning-strong';
    case 'OUTAGE':
      return 'text-danger';
    case 'MAINTENANCE':
      return 'text-info';
    default:
      return 'text-secondary-foreground';
  }
}
