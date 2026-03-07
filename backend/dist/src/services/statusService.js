"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusSummary = getStatusSummary;
exports.getWorkspaceStatuses = getWorkspaceStatuses;
exports.getWorkspaceFeatureStatuses = getWorkspaceFeatureStatuses;
exports.getExternalSystemStatuses = getExternalSystemStatuses;
exports.getIncidents = getIncidents;
exports.getScheduledMaintenance = getScheduledMaintenance;
exports.getRecentIncidents = getRecentIncidents;
exports.getUptime90Days = getUptime90Days;
exports.getIncidentById = getIncidentById;
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
        const id = doc.service_id ?? hit._id ?? "unknown-service";
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
            const id = doc.workspace_id ?? hit._id ?? "unknown-workspace";
            if (!latestByWorkspace.has(id)) {
                latestByWorkspace.set(id, doc);
            }
        }
        const environment = process.env.STATUS_ENVIRONMENT ?? "production";
        const workspaces = Array.from(latestByWorkspace.entries()).map(([id, doc]) => {
            const safeId = id ?? "unknown-workspace";
            return {
                id: safeId,
                name: doc.workspace_name ?? safeId,
                ownerTeam: doc.owner_team,
                environment: doc.environment ?? environment,
            };
        });
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
            const featureId = doc.feature_id ?? hit._id ?? "unknown-feature";
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
            const id = doc.system_id ?? hit._id ?? "unknown-system";
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
        const incidents = result.hits.hits.map((hit) => toIncidentSummary(hit._source ?? {}, hit._id ?? nowIso()));
        return incidents;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for incidents", error);
        return [];
    }
}
function toIncidentSummary(doc, fallbackId) {
    const id = doc.incident_id ?? fallbackId;
    const updates = doc.updates?.map((u) => ({
        timestamp: u.timestamp ?? nowIso(),
        message: u.message ?? "",
        status: u.status,
    }));
    return {
        id,
        title: doc.title ?? "Unknown incident",
        level: doc.status_level ?? "UNKNOWN",
        startedAt: doc.started_at ?? doc["@timestamp"] ?? nowIso(),
        resolvedAt: doc.resolved_at,
        description: doc.description,
        updates: updates?.length ? updates : undefined,
        affectedWorkspaceIds: doc.affected_workspace_ids,
        affectedCoreServiceIds: doc.affected_core_service_ids,
        affectedExternalSystemIds: doc.affected_external_system_ids,
    };
}
async function getScheduledMaintenance() {
    const client = (0, elasticClient_1.getElasticClient)();
    const now = nowIso();
    try {
        const result = await client.search({
            index: statusConfig_1.statusConfig.indices.scheduledMaintenance,
            size: 50,
            sort: ["scheduled_start:asc"],
            query: {
                range: {
                    scheduled_end: { gte: now },
                },
            },
        });
        return result.hits.hits
            .map((hit) => {
            const doc = hit._source ?? {};
            const id = doc.maintenance_id ?? hit._id ?? "unknown";
            const status = (doc.status ?? "SCHEDULED");
            return {
                id,
                title: doc.title ?? "Scheduled maintenance",
                description: doc.description,
                scheduledStart: doc.scheduled_start ?? now,
                scheduledEnd: doc.scheduled_end ?? now,
                status,
                affectedCoreServiceIds: doc.affected_core_service_ids,
                affectedExternalSystemIds: doc.affected_external_system_ids,
            };
        })
            .filter((m) => m.status !== "COMPLETED");
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for scheduled maintenance", error);
        return [];
    }
}
async function getRecentIncidents() {
    const client = (0, elasticClient_1.getElasticClient)();
    const to = nowIso();
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    try {
        const result = await client.search({
            index: statusConfig_1.statusConfig.indices.incidents,
            size: 100,
            sort: ["resolved_at:desc"],
            query: {
                bool: {
                    filter: [
                        { exists: { field: "resolved_at" } },
                        {
                            range: {
                                resolved_at: { gte: from, lte: to },
                            },
                        },
                    ],
                },
            },
        });
        return result.hits.hits.map((hit) => {
            const doc = hit._source ?? {};
            const id = doc.incident_id ?? hit._id ?? "unknown";
            const startedAt = new Date(doc.started_at ?? doc["@timestamp"] ?? nowIso());
            const resolvedAt = doc.resolved_at
                ? new Date(doc.resolved_at)
                : startedAt;
            const durationMs = resolvedAt.getTime() - startedAt.getTime();
            const duration = durationMs < 60000
                ? `${Math.round(durationMs / 1000)} sec`
                : durationMs < 3600000
                    ? `${Math.round(durationMs / 60000)} min`
                    : `${Math.floor(durationMs / 3600000)}h ${Math.round((durationMs % 3600000) / 60000)}m`;
            return {
                id,
                date: resolvedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                title: doc.title ?? "Unknown incident",
                duration,
                severity: (doc.status_level ?? "UNKNOWN"),
                cause: doc.description ?? "No details available.",
            };
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for recent incidents", error);
        return [];
    }
}
/** Map StatusLevel to DailyStatus for uptime bar */
function toDailyStatus(level) {
    switch (level) {
        case "OUTAGE":
            return "unavailable";
        case "DEGRADED":
        case "MAINTENANCE":
            return "degraded";
        default:
            return "operational";
    }
}
/** Get worst daily status from core services and incidents for the last 90 days */
async function getUptime90Days() {
    const client = (0, elasticClient_1.getElasticClient)();
    const to = new Date();
    const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
    const days = new Array(90).fill("operational");
    const dayIndex = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const fromStart = new Date(from);
        fromStart.setHours(0, 0, 0, 0);
        const diff = Math.floor((d.getTime() - fromStart.getTime()) / (24 * 60 * 60 * 1000));
        return Math.max(0, Math.min(89, diff));
    };
    try {
        const [coreResult, incidentResult] = await Promise.all([
            client.search({
                index: statusConfig_1.statusConfig.indices.coreServices,
                size: 10000,
                query: {
                    range: {
                        "@timestamp": {
                            gte: from.toISOString(),
                            lte: to.toISOString(),
                        },
                    },
                },
            }),
            client.search({
                index: statusConfig_1.statusConfig.indices.incidents,
                size: 500,
                query: {
                    range: {
                        started_at: {
                            gte: from.toISOString(),
                            lte: to.toISOString(),
                        },
                    },
                },
            }),
        ]);
        for (const hit of coreResult.hits.hits) {
            const doc = hit._source ?? {};
            const ts = doc["@timestamp"];
            if (!ts)
                continue;
            const date = new Date(ts);
            const idx = dayIndex(date);
            const level = doc.status_level ?? "UNKNOWN";
            const current = days[idx];
            const candidate = toDailyStatus(level);
            if (candidate === "unavailable" ||
                (candidate === "degraded" && current === "operational")) {
                days[idx] = candidate;
            }
        }
        for (const hit of incidentResult.hits.hits) {
            const doc = hit._source ?? {};
            const level = (doc.status_level ?? "UNKNOWN");
            const startedAt = doc.started_at
                ? new Date(doc.started_at)
                : new Date(doc["@timestamp"] ?? nowIso());
            const resolvedAt = doc.resolved_at
                ? new Date(doc.resolved_at)
                : to;
            const startDay = new Date(startedAt);
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(resolvedAt);
            endDay.setHours(0, 0, 0, 0);
            for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
                const idx = dayIndex(new Date(d));
                const candidate = toDailyStatus(level);
                if (candidate === "unavailable" ||
                    (candidate === "degraded" && days[idx] === "operational")) {
                    days[idx] = candidate;
                }
            }
        }
        const operational = days.filter((d) => d === "operational").length;
        const percentage = Math.round((operational / 90) * 1000) / 10;
        return { days, percentage };
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for uptime", error);
        const fallback = new Array(90).fill("operational");
        return {
            days: fallback,
            percentage: 100,
        };
    }
}
async function getIncidentById(incidentId) {
    const client = (0, elasticClient_1.getElasticClient)();
    try {
        const result = await client.search({
            index: statusConfig_1.statusConfig.indices.incidents,
            size: 1,
            sort: ["started_at:desc"],
            query: {
                term: { incident_id: incidentId },
            },
        });
        const hit = result.hits.hits[0];
        if (!hit || !hit._source)
            return null;
        return toIncidentSummary(hit._source, hit._id ?? incidentId);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to query ElasticSearch for incident by id", error);
        return null;
    }
}
