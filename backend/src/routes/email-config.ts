import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { sendLiveEmail } from "../services/email-sender";

export const emailConfigRouter = Router();

// 1. Get current SMTP settings
emailConfigRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;

      let config = await prisma.emailConfig.findUnique({
        where: { userId: authReq.auth.userId },
      });

      if (!config) {
        config = await prisma.emailConfig.create({
          data: {
            userId: authReq.auth.userId,
            provider: "SMTP",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            username: "",
            password: "",
            fromEmail: authReq.auth.email,
            fromName: "Pulse Sender",
          },
        });
      }

      res.json({ config });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Save / Update SMTP configuration
const updateEmailConfigSchema = z.object({
  provider: z.string().default("SMTP"),
  host: z.string().trim().min(1, "SMTP Host is required"),
  port: z.number().int().min(1).max(65535).default(587),
  secure: z.boolean().default(false),
  username: z.string().trim().default(""),
  password: z.string().trim().default(""),
  fromEmail: z.string().trim().email("Valid From Email required"),
  fromName: z.string().trim().optional(),
});

emailConfigRouter.put(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const payload = updateEmailConfigSchema.parse(req.body);

      const updated = await prisma.emailConfig.upsert({
        where: { userId: authReq.auth.userId },
        create: {
          userId: authReq.auth.userId,
          provider: payload.provider,
          host: payload.host,
          port: payload.port,
          secure: payload.secure,
          username: payload.username,
          password: payload.password,
          fromEmail: payload.fromEmail,
          fromName: payload.fromName || "Pulse Sender",
        },
        update: {
          provider: payload.provider,
          host: payload.host,
          port: payload.port,
          secure: payload.secure,
          username: payload.username,
          password: payload.password,
          fromEmail: payload.fromEmail,
          fromName: payload.fromName || "Pulse Sender",
        },
      });

      res.json({ ok: true, config: updated, message: "Email configuration saved successfully." });
    } catch (err) {
      next(err);
    }
  }
);

// 3. Test SMTP Connection
const testEmailSchema = z.object({
  recipient: z.string().trim().email("Valid recipient email is required"),
});

emailConfigRouter.post(
  "/test",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { recipient } = testEmailSchema.parse(req.body);

      const result = await sendLiveEmail(
        authReq.auth.userId,
        recipient,
        "⚡ Pulse Sender SMTP Test Email",
        "Congratulations! Your SMTP Email settings in Pulse Sender are working properly.\n\nYou can now dispatch email campaigns seamlessly!"
      );

      if (!result.ok) {
        res.status(400).json({ ok: false, error: result.error });
        return;
      }

      res.json({
        ok: true,
        message: `Test email successfully dispatched to ${recipient}!`,
        messageId: result.messageId,
      });
    } catch (err) {
      next(err);
    }
  }
);
