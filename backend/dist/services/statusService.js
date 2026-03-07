"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusSummary = getStatusSummary;
exports.getWorkspaceStatuses = getWorkspaceStatuses;
exports.getWorkspaceFeatureStatuses = getWorkspaceFeatureStatuses;
exports.getExternalSystemStatuses = getExternalSystemStatuses;
exports.getIncidents = getIncidents;
const elasticClient_1 = require("./elasticClient");
const statusConfig_1 = require("../config/statusConfig");
function nowIso() {
    return new Date().toISOString();
}
const STATUS_ORDER = [
    "OUTAGE",
    "DEGRADED",
    "MAINTENANCE",
    "UNKNOWN",
    "HEALTHY",
];
function worseStatus(a, b) {
    const idxA = STATUS_ORDER.indexOf(a);
    const idxB = STATUS_ORDER.indexOf(b);
    return idxA <= idxB ? a : b;
}
function toCoreServiceStatus(doc, fallbackId) {
    const timestamp = doc["@timestamp"] ?? nowIso();
    const status = doc.status_level ?? "UNKNOWN";
    return {
        id: doc.service_id ?? fallbackId,
        name: doc.service_name ?? fallbackId,
        level: status,
        errorRate: doc.error_rate,
        latencyP95Ms: doc.latency_p95_ms,
        lastUpdated: timestamp,
    };
}
async function fetchCoreServices(client) {
    const to = nowIso();
    const from = new Date(Date.now() - statusConfig_1.statusConfig.timeWindowMinutes * 60000).toISOString();
    const result = await client.search({
        index: statusConfig_1.statusConfig.indices.coreServices,
        size: 500,
        sort: ["@timestamp:desc"],
        query: {
            range: {
                "@timestamp": {
                    gte: from,
                    lte: to,
                },
            },
        },
    });
    const latestByService = new Map();
    for (const hit of result.hits.hits) {
        const doc = hit._source ?? {};
        const id = doc.service_id ?? hit._id;
        if (!latestByService.has(id)) {
            latestByService.set(id, doc);
        }
    }
    return Array.from(latestByService.entries()).map(([id, doc]) => toCoreServiceStatus(doc, id));
}
async function getStatusSummary() {
    const client = (0, elasticClient_1.getElasticClient)();
    const environment = process.env.STATUS_ENVIRONMENT ?? "production";
    try {
        const coreServices = await fetchCoreServices(client);
        let overall = "UNKNOWN";
        for (const svc of coreServices) {
            overall =
                overall === "UNKNOWN" ? svc.level : worseStatus(overall, svc.level);
        }
        const summary = {
            level: coreServices.length ? overall : "UNKNOWN",
            environment,
            overallMessage: coreServices.length
                ? "Status derived from core service telemetry."
                : "No recent core service telemetry available.",
            incidentCount: 0,
            lastUpdated: nowIso(),
        };
        return { summary, coreServices };
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for status summary", error);
        const summary = {
            level: "UNKNOWN",
            environment,
            overallMessage: "Unable to contact observability backend. Status is currently unknown.",
            incidentCount: 0,
            lastUpdated: nowIso(),
        };
        return {
            summary,
            coreServices: [],
        };
    }
}
async function getWorkspaceStatuses() {
    const client = (0, elasticClient_1.getElasticClient)();
    const to = nowIso();
    const from = new Date(Date.now() - statusConfig_1.statusConfig.timeWindowMinutes * 60000).toISOString();
    try {
        const result = await client.search({
            index: statusConfig_1.statusConfig.indices.workspaces,
            size: 1000,
            sort: ["@timestamp:desc"],
            query: {
                range: {
                    "@timestamp": {
                        gte: from,
                        lte: to,
                    },
                },
            },
        });
        const latestByWorkspace = new Map();
        for (const hit of result.hits.hits) {
            const doc = hit._source ?? {};
            const id = doc.workspace_id ?? hit._id;
            if (!latestByWorkspace.has(id)) {
                latestByWorkspace.set(id, doc);
            }
        }
        const environment = process.env.STATUS_ENVIRONMENT ?? "production";
        const workspaces = Array.from(latestByWorkspace.entries()).map(([id, doc]) => ({
            id,
            name: doc.workspace_name ?? id,
            ownerTeam: doc.owner_team,
            environment: doc.environment ?? environment,
        }));
        return workspaces;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for workspaces", error);
        return [];
    }
}
async function getWorkspaceFeatureStatuses(workspaceId) {
    const client = (0, elasticClient_1.getElasticClient)();
    const to = nowIso();
    const from = new Date(Date.now() - statusConfig_1.statusConfig.timeWindowMinutes * 60000).toISOString();
    try {
        const result = await client.search({
            index: statusConfig_1.statusConfig.indices.workspaces,
            size: 1000,
            sort: ["@timestamp:desc"],
            query: {
                bool: {
                    filter: [
                        {
                            term: {
                                workspace_id: workspaceId,
                            },
                        },
                        {
                            range: {
                                "@timestamp": {
                                    gte: from,
                                    lte: to,
                                },
                            },
                        },
                    ],
                },
            },
        });
        const latestByFeature = new Map();
        for (const hit of result.hits.hits) {
            const doc = hit._source ?? {};
            const featureId = doc.feature_id ?? hit._id;
            if (!latestByFeature.has(featureId)) {
                latestByFeature.set(featureId, doc);
            }
        }
        const features = Array.from(latestByFeature.entries()).map(([featureId, doc]) => ({
            workspaceId,
            featureId,
            level: doc.status_level ?? "UNKNOWN",
            lastSeen: doc["@timestamp"] ?? nowIso(),
            degradationSummary: doc.degradation_summary,
            impactingExternalSystemIds: doc.impacting_external_system_ids,
        }));
        return features;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for workspace feature status", error);
        return [];
    }
}
async function getExternalSystemStatuses() {
    const client = (0, elasticClient_1.getElasticClient)();
    const to = nowIso();
    const from = new Date(Date.now() - statusConfig_1.statusConfig.timeWindowMinutes * 60000).toISOString();
    try {
        const result = await client.search({
            index: statusConfig_1.statusConfig.indices.externalSystems,
            size: 500,
            sort: ["@timestamp:desc"],
            query: {
                range: {
                    "@timestamp": {
                        gte: from,
                        lte: to,
                    },
                },
            },
        });
        const latestBySystem = new Map();
        for (const hit of result.hits.hits) {
            const doc = hit._source ?? {};
            const id = doc.system_id ?? hit._id;
            if (!latestBySystem.has(id)) {
                latestBySystem.set(id, doc);
            }
        }
        const systems = Array.from(latestBySystem.entries()).map(([id, doc]) => ({
            id,
            name: doc.system_name ?? id,
            type: doc.system_type ?? "THIRD_PARTY_API",
            level: doc.status_level ?? "UNKNOWN",
            latencyP95Ms: doc.latency_p95_ms,
            errorRate: doc.error_rate,
            lastUpdated: doc["@timestamp"] ?? nowIso(),
            impactedCoreServiceIds: doc.impacted_core_service_ids,
            impactedFeatureIds: doc.impacted_feature_ids,
        }));
        return systems;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for external system status", error);
        return [];
    }
}
async function getIncidents() {
    const client = (0, elasticClient_1.getElasticClient)();
    const to = nowIso();
    const from = new Date(Date.now() - statusConfig_1.statusConfig.timeWindowMinutes * 60000).toISOString();
    try {
        const result = await client.search({
            index: statusConfig_1.statusConfig.indices.incidents,
            size: 200,
            sort: ["started_at:desc"],
            query: {
                range: {
                    started_at: {
                        gte: from,
                        lte: to,
                    },
                },
            },
        });
        const incidents = result.hits.hits.map((hit) => {
            const doc = hit._source ?? {};
            return {
                id: doc.incident_id ?? hit._id,
                title: doc.title ?? "Unknown incident",
                level: doc.status_level ?? "UNKNOWN",
                startedAt: doc.started_at ?? doc["@timestamp"] ?? nowIso(),
                resolvedAt: doc.resolved_at,
                affectedWorkspaceIds: doc.affected_workspace_ids,
                affectedCoreServiceIds: doc.affected_core_service_ids,
                affectedExternalSystemIds: doc.affected_external_system_ids,
            };
        });
        return incidents;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for incidents", error);
        return [];
    }
}
