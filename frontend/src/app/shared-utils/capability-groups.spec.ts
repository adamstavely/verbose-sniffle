import { buildCapabilityGroups } from 'shared/capability-groups';
import type { CoreServiceStatus } from 'shared/status-models';

describe('buildCapabilityGroups', () => {
  const mockServices: CoreServiceStatus[] = [
    {
      id: 'auth-service',
      name: 'Auth',
      level: 'HEALTHY',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'storage-service',
      name: 'Storage',
      level: 'OUTAGE',
      lastUpdated: new Date().toISOString(),
    },
  ];

  it('should return three groups', () => {
    const groups = buildCapabilityGroups(mockServices);
    expect(groups.length).toBe(3);
    expect(groups[0].group).toBe('Analyst Workspace');
    expect(groups[1].group).toBe('Operations Workspace');
    expect(groups[2].group).toBe('Shared Platform');
  });

  it('should map core service levels to capability items', () => {
    const groups = buildCapabilityGroups(mockServices);
    const sharedGroup = groups.find((g) => g.id === 'shared');
    const authItem = sharedGroup?.items.find((i) => i.id === 'auth');
    expect(authItem?.level).toBe('HEALTHY');
  });

  it('should handle empty services', () => {
    const groups = buildCapabilityGroups([]);
    expect(groups.length).toBe(3);
    expect(groups[0].items.length).toBeGreaterThan(0);
  });
});
