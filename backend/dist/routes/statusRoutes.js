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
router.get("/incidents", async (_req, res, next) => {
    try {
        const incidents = await (0, statusService_1.getIncidents)();
        res.json({ incidents });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
