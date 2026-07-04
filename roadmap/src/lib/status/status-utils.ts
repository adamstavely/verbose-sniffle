import type { StatusLevel } from './status-models';

// Status levels map to the design-system semantic roles (DS v2.1 §4.2):
//   HEALTHY → success · DEGRADED → warning · OUTAGE → danger ·
//   MAINTENANCE → info · unknown/other → neutral.

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
