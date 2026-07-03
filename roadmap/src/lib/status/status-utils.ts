import type { StatusLevel } from './status-models';

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

/** Tailwind classes for text-only severity (e.g. recent incidents list). */
export function getStatusTextClass(
  level: StatusLevel | null | undefined
): string {
  switch (level) {
    case 'HEALTHY':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'DEGRADED':
      return 'text-amber-700 dark:text-amber-400';
    case 'OUTAGE':
      return 'text-red-700 dark:text-red-400';
    case 'MAINTENANCE':
      return 'text-sky-700 dark:text-sky-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}
