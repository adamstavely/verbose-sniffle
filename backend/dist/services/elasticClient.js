"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElasticClient = getElasticClient;
const elasticsearch_1 = require("@elastic/elasticsearch");
let cachedClient = null;
function getElasticClient() {
    if (cachedClient) {
        return cachedClient;
    }
    const node = process.env.ELASTICSEARCH_URL ?? "http://localhost:9200";
    const apiKey = process.env.ELASTICSEARCH_API_KEY;
    cachedClient = new elasticsearch_1.Client(apiKey
        ? {
            node,
            auth: {
                apiKey,
            },
        }
        : {
            node,
        });
    return cachedClient;
}
