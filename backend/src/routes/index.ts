import { Router } from "express";
import { authRouter } from "./auth";
import { campaignsRouter } from "./campaigns";
import { customersRouter } from "./customers";
import { dashboardRouter } from "./dashboard";
import { devicesRouter } from "./devices";
import { eventsRouter } from "./events";
import { healthRouter } from "./health";
import { importsRouter } from "./imports";
import { logsRouter } from "./logs";
import { mobileRouter } from "./mobile";
import { templatesRouter } from "./templates";
import { usersRouter } from "./users";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/customers", customersRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/campaigns", campaignsRouter);
apiRouter.use("/templates", templatesRouter);
apiRouter.use("/devices", devicesRouter);
apiRouter.use("/logs", logsRouter);
apiRouter.use("/imports", importsRouter);
apiRouter.use("/mobile", mobileRouter);
