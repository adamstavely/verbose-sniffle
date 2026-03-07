import { describe, it, expect } from 'vitest';
import { StatusLabelPipe } from './status-label.pipe';

describe('StatusLabelPipe', () => {
  const pipe = new StatusLabelPipe();

  it('should return label for HEALTHY', () => {
    expect(pipe.transform('HEALTHY')).toBe('All systems operational');
  });
  it('should return label for DEGRADED', () => {
    expect(pipe.transform('DEGRADED')).toBe('Some issues');
  });
  it('should return label for OUTAGE', () => {
    expect(pipe.transform('OUTAGE')).toBe('Service unavailable');
  });
  it('should return unknown label for null', () => {
    expect(pipe.transform(null)).toContain('Checking');
  });
  it('should return unknown label for undefined', () => {
    expect(pipe.transform(undefined)).toContain('Checking');
  });
});
