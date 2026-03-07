"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const statusRoutes_1 = __importDefault(require("./routes/statusRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: true,
}));
app.use(express_1.default.json());
app.get("/healthz", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/status", statusRoutes_1.default);
app.use((req, res) => {
    res.status(404).json({
        error: "NotFound",
        message: `Route ${req.method} ${req.path} not found`,
    });
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    // In production you may want to hide details and log to an observability system instead.
    // For now we surface a minimal error with a generic message.
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({
        error: "InternalServerError",
        message: "Unexpected error while processing request.",
    });
});
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Status API listening on http://localhost:${port}`);
});
exports.default = app;
