"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statusService_1 = require("../services/statusService");
const router = (0, express_1.Router)();
router.get("/summary", async (_req, res, next) => {
    try {
        const data = await (0, statusService_1.getStatusSummary)();
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
router.get("/workspaces", async (_req, res, next) => {
    try {
        const workspaces = await (0, statusService_1.getWorkspaceStatuses)();
        res.json({ workspaces });
    }
    catch (error) {
        next(error);
    }
});
router.get("/workspaces/:workspaceId/features", async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const features = await (0, statusService_1.getWorkspaceFeatureStatuses)(workspaceId);
        res.json({ workspaceId, features });
    }
    catch (error) {
        next(error);
    }
});
router.get("/external-systems", async (_req, res, next) => {
    try {
        const systems = await (0, statusService_1.getExternalSystemStatuses)();
        res.json({ systems });
    }
    catch (error) {
        next(error);
    }
});
router.get("/scheduled-maintenance", async (_req, res, next) => {
    try {
        const maintenance = await (0, statusService_1.getScheduledMaintenance)();
        res.json({ maintenance });
    }
    catch (error) {
        next(error);
    }
});
router.get("/incidents", async (_req, res, next) => {
    try {
        const incidents = await (0, statusService_1.getIncidents)();
        res.json({ incidents });
    }
    catch (error) {
        next(error);
    }
});
router.get("/incidents/recent", async (_req, res, next) => {
    try {
        const incidents = await (0, statusService_1.getRecentIncidents)();
        res.json(incidents);
    }
    catch (error) {
        next(error);
    }
});
router.get("/uptime", async (_req, res, next) => {
    try {
        const data = await (0, statusService_1.getUptime90Days)();
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
router.get("/incidents/:incidentId", async (req, res, next) => {
    try {
        const { incidentId } = req.params;
        const incident = await (0, statusService_1.getIncidentById)(incidentId);
        if (!incident) {
            res.status(404).json({ error: "Incident not found" });
            return;
        }
        res.json(incident);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
