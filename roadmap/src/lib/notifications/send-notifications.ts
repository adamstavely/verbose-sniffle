import type { IncidentSummary, IncidentUpdate } from '../status/status-models';
import {
  getIncidentsForNotifications,
  getMaintenanceForNotifications,
} from '../status/elastic-status';
import { getSubscribers } from './elastic-subscribers';
import { getLastSentState, recordSent, type NotificationType } from './notification-state';
import {
  getMaintenanceSentState,
  recordMaintenanceSent,
} from './maintenance-notification-state';
import { sendEmail, isEmailServiceConfigured } from './email-client';
import {
  buildNewIncidentEmail,
  buildIncidentUpdateEmail,
  buildIncidentResolvedEmail,
  buildMaintenanceEmail,
} from './email-templates';

function getLatestUpdate(incident: IncidentSummary): IncidentUpdate | null {
  const updates = incident.updates;
  if (!updates?.length) return null;
  return updates[updates.length - 1] ?? null;
}

function updatesSignature(incident: IncidentSummary): string {
  const u = incident.updates ?? [];
  return u.map((x) => `${x.timestamp}:${x.message}`).join('|');
}

function determineNotification(
  incident: IncidentSummary,
  lastSent: { type: NotificationType; lastUpdatedAt: string; updatesSignature?: string } | null
): NotificationType | null {
  const resolved = !!incident.resolvedAt;
  const latestUpdate = getLatestUpdate(incident);
  const updatesSig = updatesSignature(incident);

  if (!lastSent) {
    if (resolved) return 'resolved';
    return 'new';
  }

  if (resolved && lastSent.type !== 'resolved') {
    return 'resolved';
  }

  if (!resolved && (lastSent.type === 'new' || lastSent.type === 'update')) {
    if (updatesSig !== lastSent.updatesSignature && latestUpdate) {
      return 'update';
    }
  }

  return null;
}

export async function runNotificationDelivery(): Promise<{
  sent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let sent = 0;

  if (!isEmailServiceConfigured()) {
    return { sent: 0, errors: ['EMAIL_SERVICE_URL not configured'] };
  }

  const [incidents, subscribers] = await Promise.all([
    getIncidentsForNotifications(),
    getSubscribers(),
  ]);

  if (subscribers.length === 0) {
    return { sent: 0, errors: [] };
  }

  for (const incident of incidents) {
    const lastSent = await getLastSentState(incident.id);
    const type = determineNotification(incident, lastSent);

    if (!type) continue;

    let subject: string;
    let body: string;

    if (type === 'new') {
      const built = buildNewIncidentEmail(incident);
      subject = built.subject;
      body = built.body;
    } else if (type === 'update') {
      const latest = getLatestUpdate(incident);
      if (!latest) continue;
      const built = buildIncidentUpdateEmail(incident, latest);
      subject = built.subject;
      body = built.body;
    } else {
      const built = buildIncidentResolvedEmail(incident);
      subject = built.subject;
      body = built.body;
    }

    const lastUpdatedAt =
      type === 'resolved'
        ? incident.resolvedAt ?? incident.startedAt
        : type === 'update'
          ? getLatestUpdate(incident)?.timestamp ?? incident.startedAt
          : incident.startedAt;

    const updatesSig = type === 'new' || type === 'update' ? updatesSignature(incident) : undefined;

    for (const to of subscribers) {
      const ok = await sendEmail(to, subject, body);
      if (ok) {
        sent++;
      } else {
        errors.push(`Failed to send to ${to} for incident ${incident.id}`);
      }
    }

    await recordSent(incident.id, type, lastUpdatedAt, updatesSig);
  }

  const maintenanceItems = await getMaintenanceForNotifications();
  for (const maintenance of maintenanceItems) {
    const alreadySent = await getMaintenanceSentState(maintenance.id);
    if (alreadySent) continue;

    const { subject, body } = buildMaintenanceEmail(maintenance);
    for (const to of subscribers) {
      const ok = await sendEmail(to, subject, body);
      if (ok) {
        sent++;
      } else {
        errors.push(`Failed to send maintenance notification to ${to} for ${maintenance.id}`);
      }
    }
    await recordMaintenanceSent(maintenance.id);
  }

  return { sent, errors };
}
