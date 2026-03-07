import { Router } from "express";
import {
  getStatusSummary,
  getWorkspaceStatuses,
  getWorkspaceFeatureStatuses,
  getExternalSystemStatuses,
  getIncidents,
  getIncidentById,
  getRecentIncidents,
  getScheduledMaintenance,
} from "../services/statusService";

const router = Router();

router.get("/summary", async (_req, res, next) => {
  try {
    const data = await getStatusSummary();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/workspaces", async (_req, res, next) => {
  try {
    const workspaces = await getWorkspaceStatuses();
    res.json({ workspaces });
  } catch (error) {
    next(error);
  }
});

router.get("/workspaces/:workspaceId/features", async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const features = await getWorkspaceFeatureStatuses(workspaceId);
    res.json({ workspaceId, features });
  } catch (error) {
    next(error);
  }
});

router.get("/external-systems", async (_req, res, next) => {
  try {
    const systems = await getExternalSystemStatuses();
    res.json({ systems });
  } catch (error) {
    next(error);
  }
});

router.get("/scheduled-maintenance", async (_req, res, next) => {
  try {
    const maintenance = await getScheduledMaintenance();
    res.json({ maintenance });
  } catch (error) {
    next(error);
  }
});

router.get("/incidents", async (_req, res, next) => {
  try {
    const incidents = await getIncidents();
    res.json({ incidents });
  } catch (error) {
    next(error);
  }
});

router.get("/incidents/recent", async (_req, res, next) => {
  try {
    const incidents = await getRecentIncidents();
    res.json(incidents);
  } catch (error) {
    next(error);
  }
});

router.get("/incidents/:incidentId", async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const incident = await getIncidentById(incidentId);
    if (!incident) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

export default router;

