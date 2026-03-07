import { Client } from "@elastic/elasticsearch";

let cachedClient: Client | null = null;

export function getElasticClient(): Client {
  if (cachedClient) {
    return cachedClient;
  }

  const node = process.env.ELASTICSEARCH_URL ?? "http://localhost:9200";
  const apiKey = process.env.ELASTICSEARCH_API_KEY;

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

