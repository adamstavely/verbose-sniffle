import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import statusRouter from "./routes/statusRoutes";

const app = express();

app.use(
  cors({
    origin: true,
  })
);
app.use(express.json());

app.get("/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/status", statusRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
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

export default app;

