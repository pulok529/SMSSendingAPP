import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { CampaignChannel } from "@prisma/client";

export const templatesRouter = Router();

const createTemplateSchema = z.object({
  title: z.string().trim().min(1, "Template title is required"),
  category: z.string().trim().default("General"),
  channel: z.enum(["SMS", "EMAIL"]).default("SMS"),
  body: z.string().trim().min(1, "Template body is required"),
  variables: z.array(z.string()).default(["name"]),
});

templatesRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const templates = await prisma.template.findMany({
        where: userFilter,
        orderBy: { createdAt: "desc" },
      });

      response.json({ templates });
    } catch (error) {
      next(error);
    }
  }
);

templatesRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = createTemplateSchema.parse(request.body);

      const template = await prisma.template.create({
        data: {
          userId: authReq.auth.userId,
          title: payload.title,
          category: payload.category,
          channel: payload.channel as CampaignChannel,
          body: payload.body,
          variables: payload.variables,
        },
      });

      response.status(201).json({ ok: true, template });
    } catch (error) {
      next(error);
    }
  }
);

templatesRouter.delete(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const id = z.string().min(1).parse(request.params.id);
      const isSuper = authReq.auth.role === "SUPERADMIN";

      const template = await prisma.template.findUnique({ where: { id } });
      if (!template) {
        response.status(404).json({ error: "Template not found." });
        return;
      }

      if (!isSuper && template.userId !== authReq.auth.userId) {
        response.status(403).json({ error: "Unauthorized to delete this template." });
        return;
      }

      await prisma.template.delete({ where: { id } });
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);
