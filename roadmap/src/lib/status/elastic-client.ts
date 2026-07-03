import { Client, type ClientOptions } from '@elastic/elasticsearch';

let cachedClient: Client | null = null;

/** Per-request timeout in ms from STATUS_FETCH_TIMEOUT_MS (default 15000; 0 disables). */
function getRequestTimeoutMs(): number {
  const raw =
    typeof process !== 'undefined' ? process.env?.STATUS_FETCH_TIMEOUT_MS : undefined;
  if (raw === undefined || raw === '') return 15_000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 15_000;
}

export function getElasticClient(): Client {
  if (cachedClient) {
    return cachedClient;
  }

  const node =
    (typeof process !== 'undefined' ? process.env?.ELASTICSEARCH_URL : undefined) ??
    'http://localhost:9200';
  const apiKey =
    typeof process !== 'undefined' ? process.env?.ELASTICSEARCH_API_KEY : undefined;

  const timeoutMs = getRequestTimeoutMs();

  const options: ClientOptions = {
    node,
    // Bound each query so a slow/unreachable cluster can't hang a page render;
    // a timeout surfaces as an error that the query functions turn into an
    // honest "unknown" state. Set STATUS_FETCH_TIMEOUT_MS=0 to disable.
    ...(timeoutMs > 0 ? { requestTimeout: timeoutMs, maxRetries: 1 } : {}),
    ...(apiKey ? { auth: { apiKey } } : {}),
  };

  cachedClient = new Client(options);

  return cachedClient;
}
