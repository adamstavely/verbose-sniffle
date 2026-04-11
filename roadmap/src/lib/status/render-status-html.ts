/**
 * Renders status hub main content to an HTML string (build time, MD-driven).
 */
import type {
  IncidentSummary,
  ResolvedIncidentEntry,
  ScheduledMaintenance,
  StatusLevel,
} from './status-models';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function badgeClass(level: StatusLevel | null | undefined): string {
  switch (level) {
    case 'HEALTHY':
      return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    case 'DEGRADED':
      return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
    case 'OUTAGE':
      return 'bg-red-500/15 text-red-600 border-red-500/30';
    case 'MAINTENANCE':
      return 'bg-sky-500/15 text-sky-600 border-sky-500/30';
    default:
      return 'bg-slate-500/15 text-slate-600 border-slate-500/30';
  }
}

function dotClass(level: StatusLevel | null | undefined): string {
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

function levelLabel(level: StatusLevel | null | undefined): string {
  switch (level) {
    case 'HEALTHY':
      return 'Operational';
    case 'DEGRADED':
      return 'Degraded';
    case 'OUTAGE':
      return 'Outage';
    case 'MAINTENANCE':
      return 'Maintenance';
    default:
      return 'Unknown';
  }
}

export interface StatusPageMdData {
  incidents: IncidentSummary[];
  maintenance: ScheduledMaintenance[];
  recentIncidents: ResolvedIncidentEntry[];
  /** Full URL path for each incident detail link (respects Astro base). */
  incidentDetailPath: (id: string) => string;
}

export function renderStatusContent(data: StatusPageMdData): string {
  const { incidents, maintenance, recentIncidents, incidentDetailPath } = data;

  const sections: string[] = [];

  sections.push(`
    <section class="rounded-xl border border-slate-200 bg-white p-6" aria-labelledby="status-heading">
      <h1 id="status-heading" class="text-2xl font-semibold text-slate-900">Platform status</h1>
      <p class="mt-2 text-sm text-slate-600">Active issues, scheduled maintenance, and recent incident history. Content is maintained in Markdown under <code class="text-xs bg-slate-100 px-1 rounded">src/content/status/</code>.</p>
    </section>
  `);

  if (incidents.length > 0) {
    sections.push(`
      <section aria-labelledby="incidents-heading">
        <h2 id="incidents-heading" class="text-lg font-semibold text-slate-900 mb-3">Active issues</h2>
        <p class="text-sm text-slate-600 mb-4">Active incidents we're investigating. Workarounds and updates appear below.</p>
        <ul class="space-y-4">
          ${incidents
            .map(
              (inc) => `
            <li class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex items-center justify-between gap-4">
                <a href="${esc(incidentDetailPath(inc.id))}" class="font-medium text-slate-900 hover:text-indigo-600">${esc(inc.title)}</a>
                <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${badgeClass(inc.level)}">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotClass(inc.level)}"></span>
                  ${esc(levelLabel(inc.level))}
                </span>
              </div>
              ${inc.description ? `<p class="mt-2 text-sm text-slate-600">${esc(inc.description)}</p>` : ''}
              ${inc.workaround ? `<p class="mt-2 text-sm text-amber-700 bg-amber-50 rounded p-2"><strong>Workaround:</strong> ${esc(inc.workaround)}</p>` : ''}
            </li>
          `
            )
            .join('')}
        </ul>
      </section>
    `);
  } else {
    sections.push(`
      <section aria-labelledby="incidents-heading">
        <h2 id="incidents-heading" class="text-lg font-semibold text-slate-900 mb-3">Active issues</h2>
        <p class="text-sm text-slate-600">No active incidents.</p>
      </section>
    `);
  }

  const activeMaintenance = maintenance.filter((m) => m.status !== 'COMPLETED');
  if (activeMaintenance.length > 0) {
    sections.push(`
      <section aria-labelledby="maintenance-heading">
        <h2 id="maintenance-heading" class="text-lg font-semibold text-slate-900 mb-3">Scheduled maintenance</h2>
        <ul class="space-y-3">
          ${activeMaintenance
            .map(
              (m) => `
            <li class="rounded-lg border border-slate-200 bg-sky-50/50 p-4">
              <div class="font-medium text-slate-900">${esc(m.title)}</div>
              ${m.description ? `<p class="mt-1 text-sm text-slate-600">${esc(m.description)}</p>` : ''}
              <p class="mt-2 text-xs text-slate-500">
                ${esc(new Date(m.scheduledStart).toLocaleString())} – ${esc(new Date(m.scheduledEnd).toLocaleString())}
              </p>
            </li>
          `
            )
            .join('')}
        </ul>
      </section>
    `);
  }

  sections.push(`
    <section aria-labelledby="recent-heading">
      <h2 id="recent-heading" class="text-lg font-semibold text-slate-900 mb-3">Recent incidents</h2>
      <p class="text-sm text-slate-600 mb-4">Resolved incidents from the last 90 days.</p>
      <ul class="space-y-2">
        ${recentIncidents
          .slice(0, 10)
          .map(
            (inc) => `
          <li class="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2 text-sm">
            <div>
              <span class="text-slate-500">${esc(inc.date)}</span>
              <span class="ml-2 font-medium text-slate-900">${esc(inc.title)}</span>
            </div>
            <span class="${inc.severity === 'HEALTHY' ? 'text-emerald-500' : inc.severity === 'DEGRADED' ? 'text-amber-500' : inc.severity === 'OUTAGE' ? 'text-red-500' : inc.severity === 'MAINTENANCE' ? 'text-sky-500' : 'text-slate-500'}">${esc(levelLabel(inc.severity))}</span>
          </li>
        `
          )
          .join('')}
      </ul>
    </section>
  `);

  return `<div class="max-w-4xl mx-auto space-y-12">${sections.join('')}</div>`;
}
