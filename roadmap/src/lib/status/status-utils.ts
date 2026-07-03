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

/** Tailwind classes for status pills (compact variant, e.g. external systems panel). */
export function getStatusPillCompactClass(
  level: StatusLevel | null | undefined
): string {
  // Stronger bg/text pairings (>=4.5:1 contrast) so labels stay legible —
  // amber especially needs a dark text on a tinted background.
  switch (level) {
    case 'HEALTHY':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case 'DEGRADED':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100';
    case 'OUTAGE':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
    case 'MAINTENANCE':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
    default:
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
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
