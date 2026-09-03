import { Router } from "express";
import { z } from "zod";
import { CampaignChannel } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

export const messagesRouter = Router();

messagesRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const allMessages = await prisma.messageLibrary.findMany({
        where: {
          ...userFilter,
          status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
      });

      const auto = allMessages.filter((m) => m.type === "AUTO");
      const manual = allMessages.filter((m) => m.type === "MANUAL");

      res.json({ auto, manual, total: allMessages.length });
    } catch (err) {
      next(err);
    }
  }
);

const createMessageSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  subject: z.string().trim().optional(),
  body: z.string().trim().min(1, "Message content is required"),
  channel: z.enum(["SMS", "EMAIL", "BOTH"]).default("SMS"),
});

messagesRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const payload = createMessageSchema.parse(req.body);

      const created = await prisma.messageLibrary.create({
        data: {
          userId: authReq.auth.userId,
          title: payload.title,
          subject: payload.subject || null,
          body: payload.body,
          channel: payload.channel as CampaignChannel,
          type: "MANUAL",
          status: "ACTIVE",
          version: 1,
        },
      });

      res.status(201).json({ ok: true, message: created });
    } catch (err) {
      next(err);
    }
  }
);

const editMessageSchema = z.object({
  title: z.string().trim().min(1),
  subject: z.string().trim().optional(),
  body: z.string().trim().min(1),
  channel: z.enum(["SMS", "EMAIL", "BOTH"]).default("SMS"),
});

messagesRouter.put(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const targetId = String(req.params.id);
      const payload = editMessageSchema.parse(req.body);

      const existing = await prisma.messageLibrary.findUnique({
        where: { id: targetId },
      });

      if (!existing) {
        res.status(404).json({ error: "Message template not found" });
        return;
      }

      if (existing.type === "AUTO") {
        res.status(400).json({ error: "Automatically logged messages cannot be modified." });
        return;
      }

      await prisma.messageLibrary.update({
        where: { id: existing.id },
        data: { status: "DISABLED" },
      });

      const newVersion = await prisma.messageLibrary.create({
        data: {
          userId: authReq.auth.userId,
          title: payload.title,
          subject: payload.subject || null,
          body: payload.body,
          channel: payload.channel as CampaignChannel,
          type: "MANUAL",
          status: "ACTIVE",
          version: (existing.version || 1) + 1,
        },
      });

      res.json({
        ok: true,
        message: newVersion,
        previousVersion: existing.version,
        newVersionNumber: newVersion.version,
      });
    } catch (err) {
      next(err);
    }
  }
);

messagesRouter.delete(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const targetId = String(req.params.id);
      await prisma.messageLibrary.update({
        where: { id: targetId },
        data: { status: "DISABLED" },
      });

      res.json({ ok: true, message: "Template archived." });
    } catch (err) {
      next(err);
    }
  }
);
