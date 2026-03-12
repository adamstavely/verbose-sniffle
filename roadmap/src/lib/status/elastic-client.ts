import { Client } from '@elastic/elasticsearch';

let cachedClient: Client | null = null;

export function getElasticClient(): Client {
  if (cachedClient) {
    return cachedClient;
  }

  const node =
    (typeof process !== 'undefined' && process.env?.ELASTICSEARCH_URL) ??
    'http://localhost:9200';
  const apiKey =
    typeof process !== 'undefined' ? process.env?.ELASTICSEARCH_API_KEY : undefined;

  cachedClient = new Client(
    apiKey
      ? {
          node,
          auth: {
            apiKey,
          },
        }
      : {
          node,
        }
  );

  return cachedClient;
}
