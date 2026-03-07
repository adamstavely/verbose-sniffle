import type { StatusLevel } from './status-models';

/** Single source of truth for severity/status ordering (worst first). */
export const STATUS_SEVERITY_ORDER: Record<StatusLevel, number> = {
  OUTAGE: 0,
  DEGRADED: 1,
  MAINTENANCE: 2,
  HEALTHY: 3,
  UNKNOWN: 4,
};

/** Sort comparator for status levels (worst first). */
export function compareByStatus(
  levelA: StatusLevel,
  levelB: StatusLevel
): number {
  return STATUS_SEVERITY_ORDER[levelA] - STATUS_SEVERITY_ORDER[levelB];
}

/** Tailwind classes for status dots (small colored circles). */
export function getStatusDotClass(level: StatusLevel | null | undefined): string {
  switch (level) {
    case 'HEALTHY':
      return 'bg-emerald-500';
    case 'DEGRADED':
      return 'bg-amber-500';
    case 'OUTAGE':
      return 'bg-red-500';
    case 'MAINTENANCE':
      return 'bg-sky-500';
    default:
      return 'bg-slate-400';
  }
}

/** Tailwind classes for status pills (badge with bg + text + border). */
export function getStatusPillClass(
  level: StatusLevel | null | undefined
): string {
  switch (level) {
    case 'HEALTHY':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'DEGRADED':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'OUTAGE':
      return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
    case 'MAINTENANCE':
      return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}

/** Tailwind classes for status pills (compact variant, e.g. external systems panel). */
export function getStatusPillCompactClass(
  level: StatusLevel | null | undefined
): string {
  switch (level) {
    case 'HEALTHY':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'DEGRADED':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'OUTAGE':
      return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'MAINTENANCE':
      return 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

/** Tailwind classes for text-only severity (e.g. recent incidents list). */
export function getStatusTextClass(
  level: StatusLevel | null | undefined
): string {
  switch (level) {
    case 'HEALTHY':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'DEGRADED':
      return 'text-amber-500 dark:text-amber-400';
    case 'OUTAGE':
      return 'text-red-500 dark:text-red-400';
    case 'MAINTENANCE':
      return 'text-sky-500 dark:text-sky-400';
    default:
      return 'text-slate-500 dark:text-slate-400';
  }
}

/** Icon character for group status display. */
export function getStatusIcon(level: StatusLevel | null | undefined): string {
  switch (level) {
    case 'HEALTHY':
      return '●';
    case 'DEGRADED':
      return '◑';
    case 'OUTAGE':
      return '○';
    case 'MAINTENANCE':
      return '◈';
    default:
      return '○';
  }
}
