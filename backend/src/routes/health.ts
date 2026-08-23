import { Router } from "express";
import { env } from "../config/env";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    ok: true,
    service: "pulse-dispatch-api",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
