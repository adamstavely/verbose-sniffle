import type {
  IncidentSummary,
  IncidentUpdate,
  ScheduledMaintenance,
} from '../status/status-models';
import { getStatusLabel } from '../status/status-labels';

function env(name: string, fallback: string): string {
  return (typeof process !== 'undefined' && process.env?.[name]) ?? fallback;
}

function baseUrl(): string {
  return (
    env('SITE_URL', '') ||
    env('STATUS_PAGE_BASE_URL', '') ||
    ''
  ).replace(/\/$/, '');
}

function incidentUrl(incidentId: string): string {
  const base = baseUrl();
  const path = `/roadmap/status/incidents/${incidentId}`;
  return base ? `${base}${path}` : path;
}

export function buildSubscribeConfirmation(email: string): string {
  return `You're subscribed to status page notifications. We'll send notifications to ${email} when incidents occur.`;
}

export function buildSubscribeConfirmationSubject(): string {
  return 'Subscribed to status notifications';
}

export function buildNewIncidentEmail(incident: IncidentSummary): {
  subject: string;
  body: string;
} {
  const severity = getStatusLabel(incident.level);
  const subject = `[Status] ${incident.title} (${severity})`;
  let body = `${incident.title}  
Severity: ${severity}
Started: ${incident.startedAt}

${incident.description ?? 'No description.'}
`;

  if (incident.workaround) {
    body += `\nWorkaround: ${incident.workaround}\n`;
  }

  if (incident.updates?.length) {
    body += '\nUpdates:\n';
    for (const u of incident.updates) {
      body += `- ${u.timestamp}: ${u.message}\n`;
    }
  }

  body += `\nView details: ${incidentUrl(incident.id)}`;
  return { subject, body };
}

export function buildIncidentUpdateEmail(
  incident: IncidentSummary,
  latestUpdate: IncidentUpdate
): { subject: string; body: string } {
  const severity = getStatusLabel(incident.level);
  const subject = `[Status Update] ${incident.title}`;
  let body = `${incident.title}  
Severity: ${severity}

Latest update (${latestUpdate.timestamp}): ${latestUpdate.message}
`;

  if (incident.workaround) {
    body += `\nWorkaround: ${incident.workaround}\n`;
  }

  body += `\nView details: ${incidentUrl(incident.id)}`;
  return { subject, body };
}

export function buildIncidentResolvedEmail(incident: IncidentSummary): {
  subject: string;
  body: string;
} {
  const subject = `[Status] Resolved: ${incident.title}`;
  let body = `${incident.title} has been resolved.

Started: ${incident.startedAt}
Resolved: ${incident.resolvedAt ?? 'Unknown'}

${incident.description ?? 'No additional details.'}
`;

  body += `\nView details: ${incidentUrl(incident.id)}`;
  return { subject, body };
}

function maintenanceUrl(): string {
  const base = baseUrl();
  const path = '/roadmap/status';
  return base ? `${base}${path}` : path;
}

export function buildMaintenanceEmail(maintenance: ScheduledMaintenance): {
  subject: string;
  body: string;
} {
  const subject = `[Status] Scheduled maintenance: ${maintenance.title}`;
  let body = `${maintenance.title}
Scheduled: ${maintenance.scheduledStart} – ${maintenance.scheduledEnd}

${maintenance.description ?? 'No additional details.'}
`;

  body += `\nView status: ${maintenanceUrl()}`;
  return { subject, body };
}
