import type { CapabilityGroup, CapabilityItem, CoreServiceStatus } from './status-models';

/** Maps core service id to capability item. Builds groups from core services. */
export function buildCapabilityGroups(
  services: CoreServiceStatus[]
): CapabilityGroup[] {
  const byId = new Map(services.map((s) => [s.id, s]));
  const get = (id: string) => byId.get(id)?.level ?? 'HEALTHY';
  const getDesc = (id: string) => byId.get(id)?.description;

  return [
    {
      id: 'analyst',
      group: 'Analyst Workspace',
      barColor: 'violet-500',
      items: [
        {
          id: 'ai-assist',
          label: 'AI Assist',
          level: get('messaging-service'),
          impact:
            'Responses may be slower. Falling back to secondary model routing.',
          aiNote: true,
        },
        {
          id: 'search',
          label: 'Search & Retrieval',
          level: get('search-service'),
          impact: getDesc('search-service'),
        },
        { id: 'entity-intel', label: 'Entity Intelligence', level: 'HEALTHY' },
        {
          id: 'doc-analysis',
          label: 'Document Analysis',
          level: get('storage-service'),
          impact: getDesc('storage-service'),
        },
        { id: 'workspace', label: 'Analyst Workspace', level: 'HEALTHY' },
        { id: 'collab', label: 'Annotations & Notes', level: 'HEALTHY' },
      ],
    },
    {
      id: 'operations',
      group: 'Operations Workspace',
      barColor: 'amber-500',
      items: [
        { id: 'ops-workspace', label: 'Operations Workspace', level: 'HEALTHY' },
        {
          id: 'ops-ai',
          label: 'AI Decision Assist',
          level: get('billing-service'),
          impact:
            'Confidence scores may reflect reduced model quality during degradation.',
          aiNote: true,
        },
        {
          id: 'alerts',
          label: 'Alerts & Notifications',
          level: get('messaging-service'),
          impact: getDesc('messaging-service'),
        },
        {
          id: 'reporting',
          label: 'Reporting & Exports',
          level: get('billing-service'),
          impact: getDesc('billing-service'),
        },
      ],
    },
    {
      id: 'shared',
      group: 'Shared Platform',
      barColor: 'sky-500',
      items: [
        {
          id: 'auth',
          label: 'Authentication & SSO',
          level: get('auth-service'),
          impact: getDesc('auth-service'),
        },
        { id: 'data-platform', label: 'Data & Enrichment', level: 'HEALTHY' },
        {
          id: 'media',
          label: 'Media Processing',
          level: get('storage-service'),
          impact:
            'Scheduled maintenance. Existing files accessible; new uploads queued.',
        },
        { id: 'geo', label: 'Geospatial Services', level: 'HEALTHY' },
        {
          id: 'knowledge',
          label: 'Knowledge Platform',
          level: get('search-service'),
          impact: getDesc('search-service'),
        },
      ],
    },
  ];
}
