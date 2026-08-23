import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { apiRouter } from "./routes";

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/", (_request, response) => {
  response.json({
    name: "Pulse Dispatch API",
    version: "0.1.0",
    docs: "/api/health",
  });
});

app.use("/api", apiRouter);

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected server error occurred.";

    response.status(500).json({
      error: message,
    });
  }
);
