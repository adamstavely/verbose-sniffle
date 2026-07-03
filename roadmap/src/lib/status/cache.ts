/**
 * Tiny in-memory TTL cache for status telemetry reads so a burst of page loads
 * doesn't hit Elasticsearch on every request. State lives on the (long-lived)
 * Node server instance; each instance keeps its own cache. Keep the TTL short —
 * a status page tolerates a few seconds of staleness but not stale telemetry.
 */
const store = new Map<string, { value: unknown; expiresAt: number }>();

const DEFAULT_TTL_MS = 15_000;

export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && now < hit.expiresAt) {
    return hit.value as T;
  }
  const value = await fn();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}
