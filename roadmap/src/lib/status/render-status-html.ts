/**
 * Renders status page content to HTML for client-side hydration.
 * Used when loading status data asynchronously to show skeleton first.
 */
import type {
  StatusSummaryDto,
  WorkspacesDto,
  ExternalSystemsDto,
  IncidentsDto,
  ScheduledMaintenanceDto,
  UptimeData,
} from './status-models';
import type { CapabilityGroup, ResolvedIncidentEntry, StatusLevel } from './status-models';
import { buildCapabilityGroups } from './capability-groups';
import { getStatusLabel } from './status-labels';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function badgeClass(level: StatusLevel | null | undefined): string {
  switch (level) {
    case 'HEALTHY': return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    case 'DEGRADED': return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
    case 'OUTAGE': return 'bg-red-500/15 text-red-600 border-red-500/30';
    case 'MAINTENANCE': return 'bg-sky-500/15 text-sky-600 border-sky-500/30';
    default: return 'bg-slate-500/15 text-slate-600 border-slate-500/30';
  }
}

function bannerClass(level: StatusLevel | null | undefined): string {
  switch (level) {
    case 'HEALTHY': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'DEGRADED': return 'bg-amber-500/10 border-amber-500/30';
    case 'OUTAGE': return 'bg-red-500/10 border-red-500/30';
    case 'MAINTENANCE': return 'bg-sky-500/10 border-sky-500/30';
    default: return 'bg-slate-500/10 border-slate-500/30';
  }
}

function barColorClass(color: string): string {
  switch (color) {
    case 'violet-500': return 'bg-violet-500';
    case 'amber-500': return 'bg-amber-500';
    case 'sky-500': return 'bg-sky-500';
    default: return 'bg-slate-500';
  }
}

function dotClass(level: StatusLevel | null | undefined): string {
  switch (level) {
    case 'HEALTHY': return 'bg-emerald-500';
    case 'DEGRADED': return 'bg-amber-500';
    case 'OUTAGE': return 'bg-red-500';
    case 'MAINTENANCE': return 'bg-sky-500';
    default: return 'bg-slate-400';
  }
}

function uptimeBarClass(day: 'operational' | 'degraded' | 'unavailable'): string {
  const h = day === 'unavailable' ? 'h-7' : day === 'degraded' ? 'h-5' : 'h-3.5';
  const c = day === 'unavailable' ? 'bg-red-500' : day === 'degraded' ? 'bg-amber-500' : 'bg-emerald-500/80';
  return `flex-1 rounded-sm min-w-[2px] ${h} ${c}`;
}

export interface StatusPageData {
  summary: StatusSummaryDto;
  workspaces: WorkspacesDto;
  externalSystems: ExternalSystemsDto;
  incidents: IncidentsDto;
  recentIncidents: ResolvedIncidentEntry[];
  maintenance: ScheduledMaintenanceDto;
  uptime: UptimeData;
}

export function renderStatusContent(data: StatusPageData): string {
  const { summary, workspaces, externalSystems, incidents, recentIncidents, maintenance, uptime } = data;
  const capabilityGroups = buildCapabilityGroups(summary.coreServices);
  const level = summary.summary?.level;

  const sections: string[] = [];

  // Header
  sections.push(`
    <section class="rounded-xl border p-6 ${bannerClass(level)}" aria-labelledby="status-heading">
      <h1 id="status-heading" class="text-2xl font-semibold text-slate-900">Super App Status</h1>
      ${summary.summary ? `<p class="mt-2 text-slate-600">${esc(summary.summary.overallMessage)}</p>` : ''}
      ${summary.summary?.incidentCount ? `<p class="mt-1 text-sm text-slate-500">${summary.summary.incidentCount} active incident${summary.summary.incidentCount === 1 ? '' : 's'}</p>` : ''}
    </section>
  `);

  // Incidents
  if (incidents.incidents.length > 0) {
    sections.push(`
      <section aria-labelledby="incidents-heading">
        <h2 id="incidents-heading" class="text-lg font-semibold text-slate-900 mb-3">Active issues</h2>
        <p class="text-sm text-slate-600 mb-4">Active incidents we're investigating. Workarounds and updates appear below.</p>
        <ul class="space-y-4">
          ${incidents.incidents.map((inc) => `
            <li class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex items-center justify-between gap-4">
                <a href="/roadmap/status/incidents/${esc(inc.id)}" class="font-medium text-slate-900 hover:text-indigo-600">${esc(inc.title)}</a>
                <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${badgeClass(inc.level)}">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotClass(inc.level)}"></span>
                  ${esc(inc.level === 'HEALTHY' ? 'Operational' : inc.level === 'DEGRADED' ? 'Degraded' : inc.level === 'OUTAGE' ? 'Outage' : inc.level === 'MAINTENANCE' ? 'Maintenance' : 'Unknown')}
                </span>
              </div>
              ${inc.description ? `<p class="mt-2 text-sm text-slate-600">${esc(inc.description)}</p>` : ''}
              ${inc.workaround ? `<p class="mt-2 text-sm text-amber-700 bg-amber-50 rounded p-2"><strong>Workaround:</strong> ${esc(inc.workaround)}</p>` : ''}
            </li>
          `).join('')}
        </ul>
      </section>
    `);
  }

  // Capabilities
  sections.push(`
    <section aria-labelledby="capabilities-heading">
      <h2 id="capabilities-heading" class="text-lg font-semibold text-slate-900 mb-3">Capabilities</h2>
      <p class="text-sm text-slate-600 mb-4">Status by workspace type. Click a row to expand impact details when available.</p>
      <div class="space-y-6">
        ${capabilityGroups.map((group) => {
          const worst = group.items.some((i) => i.level === 'OUTAGE') ? 'OUTAGE'
            : group.items.some((i) => i.level === 'DEGRADED') ? 'DEGRADED'
            : group.items.some((i) => i.level === 'MAINTENANCE') ? 'MAINTENANCE' : 'HEALTHY';
          return `
            <div class="capability-group">
              <div class="flex items-center gap-2.5 mb-2">
                <span class="w-1 h-4 rounded shrink-0 ${barColorClass(group.barColor)}"></span>
                <span class="text-[10px] font-mono font-semibold uppercase tracking-widest">${esc(group.group)}</span>
                <span class="flex-1"></span>
                <span class="text-[10px] font-mono flex items-center gap-1">
                  <span class="inline-block w-2 h-2 rounded-full shrink-0 ${dotClass(worst)}"></span>
                  ${esc(getStatusLabel(worst))}
                </span>
              </div>
              <div class="rounded-lg overflow-hidden border border-slate-200 bg-white">
                ${group.items.map((item) => `
                  <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0">
                    <span class="inline-block w-2 h-2 rounded-full shrink-0 ${dotClass(item.level)}"></span>
                    <span class="flex-1 text-[13px] text-slate-900">${esc(item.label)}</span>
                    <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${badgeClass(item.level)}">
                      <span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotClass(item.level)}"></span>
                      ${esc(item.level === 'HEALTHY' ? 'Operational' : item.level === 'DEGRADED' ? 'Degraded' : item.level === 'OUTAGE' ? 'Outage' : item.level === 'MAINTENANCE' ? 'Maintenance' : 'Unknown')}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `);

  // Core services
  sections.push(`
    <section aria-labelledby="core-services-heading">
      <h2 id="core-services-heading" class="text-lg font-semibold text-slate-900 mb-3">Core services</h2>
      <p class="text-sm text-slate-600 mb-4">Underlying platform services.</p>
      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-600">Service</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-600">Last updated</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            ${summary.coreServices.map((svc) => `
              <tr>
                <td class="px-4 py-3 text-sm text-slate-900">${esc(svc.name)}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${badgeClass(svc.level)}">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotClass(svc.level)}"></span>
                    ${esc(svc.level === 'HEALTHY' ? 'Operational' : svc.level === 'DEGRADED' ? 'Degraded' : svc.level === 'OUTAGE' ? 'Outage' : svc.level === 'MAINTENANCE' ? 'Maintenance' : 'Unknown')}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-500">${esc(new Date(svc.lastUpdated).toLocaleString())}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `);

  // Workspaces
  sections.push(`
    <section aria-labelledby="workspaces-heading">
      <h2 id="workspaces-heading" class="text-lg font-semibold text-slate-900 mb-3">Workspaces</h2>
      <p class="text-sm text-slate-600 mb-4">Status by workspace.</p>
      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        ${workspaces.workspaces.map((ws) => `
          <li>
            <a href="/roadmap/status/workspaces/${esc(ws.id)}" class="block rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-900">${esc(ws.name)}</span>
                <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${badgeClass(ws.level)}">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotClass(ws.level)}"></span>
                  ${esc(ws.level === 'HEALTHY' ? 'Operational' : ws.level === 'DEGRADED' ? 'Degraded' : ws.level === 'OUTAGE' ? 'Outage' : ws.level === 'MAINTENANCE' ? 'Maintenance' : 'Unknown')}
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-500">${esc(ws.environment)}</p>
            </a>
          </li>
        `).join('')}
      </ul>
    </section>
  `);

  // External systems
  sections.push(`
    <section aria-labelledby="external-heading">
      <div class="flex items-center justify-between">
        <h2 id="external-heading" class="text-lg font-semibold text-slate-900">Connected services</h2>
        <a href="/roadmap/status/external-systems" class="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</a>
      </div>
      <ul class="mt-4 space-y-2">
        ${externalSystems.systems.slice(0, 5).map((sys) => `
          <li class="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2">
            <span class="text-sm text-slate-900">${esc(sys.name)}</span>
            <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${badgeClass(sys.level)}">
              <span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotClass(sys.level)}"></span>
              ${esc(sys.level === 'HEALTHY' ? 'Operational' : sys.level === 'DEGRADED' ? 'Degraded' : sys.level === 'OUTAGE' ? 'Outage' : sys.level === 'MAINTENANCE' ? 'Maintenance' : 'Unknown')}
            </span>
          </li>
        `).join('')}
      </ul>
    </section>
  `);

  // Uptime
  sections.push(`
    <section aria-labelledby="uptime-heading">
      <h2 id="uptime-heading" class="text-lg font-semibold text-slate-900 mb-3">90-day uptime</h2>
      <p class="text-sm text-slate-600 mb-4">Daily status over the last 90 days. Green = operational, amber = degraded, red = unavailable.</p>
      <div class="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
        <div class="flex items-center mb-3">
          <span class="flex-1"></span>
          <span class="font-mono text-sm font-semibold text-emerald-600">${uptime.percentage}%</span>
        </div>
        <div class="flex gap-0.5 items-end h-7" role="img" aria-label="${uptime.percentage}% uptime over the last 90 days">
          ${uptime.days.map((day) => `<div class="${uptimeBarClass(day)}" title="${day}"></div>`).join('')}
        </div>
        <div class="flex justify-between mt-1.5">
          <span class="font-mono text-[10px] text-slate-400">90 days ago</span>
          <span class="font-mono text-[10px] text-slate-400">Today</span>
        </div>
      </div>
    </section>
  `);

  // Maintenance
  const activeMaintenance = maintenance.maintenance.filter((m) => m.status !== 'COMPLETED');
  if (activeMaintenance.length > 0) {
    sections.push(`
      <section aria-labelledby="maintenance-heading">
        <h2 id="maintenance-heading" class="text-lg font-semibold text-slate-900 mb-3">Scheduled maintenance</h2>
        <ul class="space-y-3">
          ${activeMaintenance.map((m) => `
            <li class="rounded-lg border border-slate-200 bg-sky-50/50 p-4">
              <div class="font-medium text-slate-900">${esc(m.title)}</div>
              ${m.description ? `<p class="mt-1 text-sm text-slate-600">${esc(m.description)}</p>` : ''}
              <p class="mt-2 text-xs text-slate-500">
                ${esc(new Date(m.scheduledStart).toLocaleString())} – ${esc(new Date(m.scheduledEnd).toLocaleString())}
              </p>
            </li>
          `).join('')}
        </ul>
      </section>
    `);
  }

  // Recent incidents
  sections.push(`
    <section aria-labelledby="recent-heading">
      <h2 id="recent-heading" class="text-lg font-semibold text-slate-900 mb-3">Recent incidents</h2>
      <p class="text-sm text-slate-600 mb-4">Resolved incidents from the last 90 days.</p>
      <ul class="space-y-2">
        ${recentIncidents.slice(0, 10).map((inc) => `
          <li class="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2 text-sm">
            <div>
              <span class="text-slate-500">${esc(inc.date)}</span>
              <span class="ml-2 font-medium text-slate-900">${esc(inc.title)}</span>
            </div>
            <span class="${inc.severity === 'HEALTHY' ? 'text-emerald-500' : inc.severity === 'DEGRADED' ? 'text-amber-500' : inc.severity === 'OUTAGE' ? 'text-red-500' : inc.severity === 'MAINTENANCE' ? 'text-sky-500' : 'text-slate-500'}">${esc(inc.severity === 'HEALTHY' ? 'Operational' : inc.severity === 'DEGRADED' ? 'Degraded' : inc.severity === 'OUTAGE' ? 'Outage' : inc.severity === 'MAINTENANCE' ? 'Maintenance' : 'Unknown')}</span>
          </li>
        `).join('')}
      </ul>
    </section>
  `);

  return `<div class="max-w-4xl mx-auto space-y-12">${sections.join('')}</div>`;
}
