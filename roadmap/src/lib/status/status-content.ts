import { getCollection, type CollectionEntry } from 'astro:content';
import type {
  IncidentSummary,
  ResolvedIncidentEntry,
  ScheduledMaintenance,
} from './status-models';

function plainExcerptFromMarkdown(body: string, maxLen = 400): string {
  const stripped = body
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/^#+\s+.*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  return stripped.length <= maxLen ? stripped : `${stripped.slice(0, maxLen)}…`;
}

export function entryToIncidentSummary(
  entry: CollectionEntry<'statusActiveIncidents'>
): IncidentSummary {
  const d = entry.data;
  const description =
    d.description ??
    (entry.body?.trim() ? plainExcerptFromMarkdown(entry.body) : undefined);
  return {
    id: d.id,
    title: d.title,
    level: d.level,
    startedAt: d.startedAt,
    description,
    workaround: d.workaround,
    resolvedAt: d.resolvedAt,
    aiNote: d.aiNote,
    updates: d.updates,
  };
}

export async function getActiveIncidentsFromContent(): Promise<IncidentSummary[]> {
  const entries = await getCollection('statusActiveIncidents');
  return entries
    .map(entryToIncidentSummary)
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
}

export async function getMaintenanceFromContent(): Promise<ScheduledMaintenance[]> {
  const entries = await getCollection('statusMaintenance');
  return entries
    .map((e) => {
      const d = e.data;
      return {
        id: d.id,
        title: d.title,
        description: d.description,
        scheduledStart: d.scheduledStart,
        scheduledEnd: d.scheduledEnd,
        status: d.status,
      } satisfies ScheduledMaintenance;
    })
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
}

export async function getRecentIncidentsFromContent(): Promise<
  ResolvedIncidentEntry[]
> {
  const entries = await getCollection('statusRecentIncidents');
  return [...entries]
    .sort(
      (a, b) =>
        (b.data.sortOrder ?? 0) - (a.data.sortOrder ?? 0)
    )
    .map((e) => {
      const d = e.data;
      return {
        id: d.id,
        date: d.date,
        title: d.title,
        duration: d.duration,
        severity: d.severity,
        cause: d.cause,
      } satisfies ResolvedIncidentEntry;
    });
}

export async function getIncidentByIdFromContent(
  id: string
): Promise<IncidentSummary | null> {
  const entries = await getCollection('statusActiveIncidents');
  const entry = entries.find((e) => e.data.id === id);
  return entry ? entryToIncidentSummary(entry) : null;
}
