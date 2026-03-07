"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusConfig = void 0;
exports.statusConfig = {
    timeWindowMinutes: Number(process.env.STATUS_TIME_WINDOW_MINUTES ?? 5),
    indices: {
        coreServices: process.env.ELASTICSEARCH_INDEX_CORE_SERVICES ?? "status-core-services",
        workspaces: process.env.ELASTICSEARCH_INDEX_WORKSPACES ?? "status-workspaces",
        externalSystems: process.env.ELASTICSEARCH_INDEX_EXTERNAL_SYSTEMS ??
            "status-external-systems",
        incidents: process.env.ELASTICSEARCH_INDEX_INCIDENTS ?? "status-incidents",
    },
    thresholds: {
        errorRate: {
            healthyMax: Number(process.env.STATUS_ERROR_RATE_HEALTHY_MAX ?? (0.01).toString()),
            degradedMax: Number(process.env.STATUS_ERROR_RATE_DEGRADED_MAX ?? (0.05).toString()),
        },
        latencyP95Ms: {
            healthyMax: Number(process.env.STATUS_LATENCY_P95_HEALTHY_MAX ?? (500).toString()),
            degradedMax: Number(process.env.STATUS_LATENCY_P95_DEGRADED_MAX ?? (1500).toString()),
        },
    },
};
