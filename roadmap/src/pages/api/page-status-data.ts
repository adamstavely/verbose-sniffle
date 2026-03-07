import type { APIRoute } from 'astro';
import {
  fetchSummary,
  fetchWorkspaces,
  fetchExternalSystems,
  fetchIncidents,
  fetchRecentIncidents,
  fetchScheduledMaintenance,
  fetchUptime,
} from '../../lib/status/fetch-status';
import { renderStatusContent } from '../../lib/status/render-status-html';

export const prerender = false;

export const GET: APIRoute = async () => {
  const [summary, workspaces, externalSystems, incidents, recentIncidents, maintenance, uptime] =
    await Promise.all([
      fetchSummary(),
      fetchWorkspaces(),
      fetchExternalSystems(),
      fetchIncidents(),
      fetchRecentIncidents(),
      fetchScheduledMaintenance(),
      fetchUptime(),
    ]);

  const html = renderStatusContent({
    summary,
    workspaces,
    externalSystems,
    incidents,
    recentIncidents,
    maintenance,
    uptime,
  });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};
