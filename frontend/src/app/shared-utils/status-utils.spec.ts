import {
  STATUS_SEVERITY_ORDER,
  compareByStatus,
  getStatusDotClass,
  getStatusPillClass,
  getStatusTextClass,
  getStatusIcon,
} from 'shared/status-utils';

describe('status-utils', () => {
  describe('STATUS_SEVERITY_ORDER', () => {
    it('should order OUTAGE first (worst)', () => {
      expect(STATUS_SEVERITY_ORDER['OUTAGE']).toBe(0);
    });
    it('should order UNKNOWN last', () => {
      expect(STATUS_SEVERITY_ORDER['UNKNOWN']).toBe(4);
    });
  });

  describe('compareByStatus', () => {
    it('should return negative when first is worse', () => {
      expect(compareByStatus('OUTAGE', 'HEALTHY')).toBeLessThan(0);
    });
    it('should return positive when first is better', () => {
      expect(compareByStatus('HEALTHY', 'OUTAGE')).toBeGreaterThan(0);
    });
    it('should return 0 when equal', () => {
      expect(compareByStatus('DEGRADED', 'DEGRADED')).toBe(0);
    });
  });

  describe('getStatusDotClass', () => {
    it('should return emerald for HEALTHY', () => {
      expect(getStatusDotClass('HEALTHY')).toContain('emerald');
    });
    it('should return amber for DEGRADED', () => {
      expect(getStatusDotClass('DEGRADED')).toContain('amber');
    });
    it('should return red for OUTAGE', () => {
      expect(getStatusDotClass('OUTAGE')).toContain('red');
    });
    it('should return slate for null/undefined', () => {
      expect(getStatusDotClass(null)).toContain('slate');
      expect(getStatusDotClass(undefined)).toContain('slate');
    });
  });

  describe('getStatusPillClass', () => {
    it('should return emerald classes for HEALTHY', () => {
      const cls = getStatusPillClass('HEALTHY');
      expect(cls).toContain('emerald');
      expect(cls).toContain('bg-');
    });
  });

  describe('getStatusTextClass', () => {
    it('should return text color classes', () => {
      expect(getStatusTextClass('OUTAGE')).toContain('red');
    });
  });

  describe('getStatusIcon', () => {
    it('should return ● for HEALTHY', () => {
      expect(getStatusIcon('HEALTHY')).toBe('●');
    });
    it('should return ○ for OUTAGE', () => {
      expect(getStatusIcon('OUTAGE')).toBe('○');
    });
  });
});
