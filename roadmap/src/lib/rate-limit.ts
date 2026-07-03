/**
 * Minimal in-memory fixed-window rate limiter for the write Actions
 * (vote / subscribe / feedback) to blunt trivial ES write amplification.
 *
 * NOTE: state is per server instance and keyed by the caller's voter cookie, so
 * it is a mitigation, not a hard guarantee. A production deployment should also
 * enforce limits at the edge (gateway / WAF) and ideally key on client IP.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) {
    return false;
  }
  bucket.count += 1;
  return true;
}
