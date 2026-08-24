import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { CampaignStatus, DeliveryStatus, DeviceStatus } from "@prisma/client";

export const mobileRouter = Router();

const registerDeviceSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  deviceName: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(1),
  operator: z.string().trim().min(1),
});

const heartbeatSchema = z.object({
  battery: z.string().trim().optional(),
  queuedJobs: z.number().int().optional(),
});

const reportJobSchema = z.object({
  status: z.enum(["SENT", "FAILED"]),
  detail: z.string().trim().min(1),
});

const sendLogSchema = z.object({
  type: z.string().trim().default("INFO"),
  title: z.string().trim().min(1),
  detail: z.string().trim().min(1),
  deviceId: z.string().trim().optional(),
});

// POST /api/mobile/register - Register Android companion device
mobileRouter.post(
  "/register",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = registerDeviceSchema.parse(request.body);

      const device = await prisma.device.create({
        data: {
          userId: authReq.auth.userId,
          deviceName: payload.deviceName,
          phoneNumber: payload.phoneNumber,
          operator: payload.operator,
          status: DeviceStatus.ONLINE,
          lastSeenAt: new Date(),
        },
      });

      await prisma.mobileLog.create({
        data: {
          userId: authReq.auth.userId,
          deviceId: device.id,
          type: "SUCCESS",
          title: "Device Registered",
          detail: `${payload.deviceName} (${payload.phoneNumber}) registered to user account.`,
        },
      });

      response.status(201).json({ device });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/heartbeat - Device heartbeat
mobileRouter.post(
  "/heartbeat",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = heartbeatSchema.parse(request.body ?? {});

      await prisma.device.updateMany({
        where: { userId: authReq.auth.userId },
        data: {
          status: DeviceStatus.ONLINE,
          battery: payload.battery || null,
          queuedJobs: payload.queuedJobs || 0,
          lastSeenAt: new Date(),
        },
      });

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/jobs - Pull pending SMS jobs strictly scoped to this client tenant
mobileRouter.get(
  "/jobs",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";

      const deliveries = await prisma.delivery.findMany({
        where: {
          status: DeliveryStatus.PENDING,
          channel: "SMS",
          ...(isSuper ? {} : { campaign: { userId: authReq.auth.userId } }),
        },
        include: {
          customer: true,
          campaign: true,
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      const jobs = deliveries.map((d) => ({
        id: d.id,
        phoneNumber: d.customer.mobile || "",
        customerName: d.customer.name,
        campaignName: d.campaign.name,
        message: d.detail,
        status: d.status,
      }));

      response.json({ jobs });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/jobs/:id/result - Report SIM SMS send result
mobileRouter.post(
  "/jobs/:id/result",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const id = z.string().min(1).parse(request.params.id);
      const payload = reportJobSchema.parse(request.body);

      const delivery = await prisma.delivery.update({
        where: { id },
        data: {
          status: payload.status as DeliveryStatus,
          detail: payload.detail,
          timestamp: new Date(),
        },
        include: { campaign: true, customer: true },
      });

      if (payload.status === "SENT") {
        await prisma.campaign.update({
          where: { id: delivery.campaignId },
          data: {
            sentCount: { increment: 1 },
            status: CampaignStatus.SENDING,
          },
        });
      } else {
        await prisma.campaign.update({
          where: { id: delivery.campaignId },
          data: {
            failedCount: { increment: 1 },
          },
        });
      }

      await prisma.mobileLog.create({
        data: {
          userId: authReq.auth.userId,
          type: payload.status === "SENT" ? "SUCCESS" : "ERROR",
          title: payload.status === "SENT" ? "SMS Dispatched" : "SMS Send Failed",
          detail: `SMS to ${delivery.customer.name} (${delivery.customer.mobile}): ${payload.detail}`,
        },
      });

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mobile/logs - Send mobile audit log
mobileRouter.post(
  "/logs",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = sendLogSchema.parse(request.body);

      await prisma.mobileLog.create({
        data: {
          userId: authReq.auth.userId,
          deviceId: payload.deviceId || null,
          type: payload.type,
          title: payload.title,
          detail: payload.detail,
        },
      });

      response.status(201).json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/logs - Fetch mobile logs stream
mobileRouter.get(
  "/logs",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";

      const logs = await prisma.mobileLog.findMany({
        where: isSuper ? {} : { userId: authReq.auth.userId },
        orderBy: { timestamp: "desc" },
        take: 100,
      });

      response.json({ logs });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mobile/stats - Live stats for mobile app dashboard
mobileRouter.get(
  "/stats",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [sentToday, pendingJobs, failedJobs] = await Promise.all([
        prisma.delivery.count({
          where: {
            ...(isSuper ? {} : { campaign: { userId: authReq.auth.userId } }),
            status: DeliveryStatus.SENT,
            timestamp: { gte: startOfDay },
          },
        }),
        prisma.delivery.count({
          where: {
            ...(isSuper ? {} : { campaign: { userId: authReq.auth.userId } }),
            status: DeliveryStatus.PENDING,
            channel: "SMS",
          },
        }),
        prisma.delivery.count({
          where: {
            ...(isSuper ? {} : { campaign: { userId: authReq.auth.userId } }),
            status: DeliveryStatus.FAILED,
          },
        }),
      ]);

      response.json({ sentToday, pendingJobs, failedJobs });
    } catch (error) {
      next(error);
    }
  }
);

// TICKETS (CRUD)
mobileRouter.post(
  "/tickets",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const { subject, category, priority, description } = request.body;

      const ticketCount = await prisma.ticket.count();
      const ticketNumber = `#TKT-${String(ticketCount + 1).padStart(3, "0")}`;

      const ticket = await prisma.ticket.create({
        data: {
          userId: authReq.auth.userId,
          ticketNumber,
          subject: subject || "Mobile sender support request",
          category: category || "General",
          priority: priority || "Medium",
          description: description || "",
          status: "OPEN",
        },
      });

      response.status(201).json({ ok: true, ticket });
    } catch (error) {
      next(error);
    }
  }
);

mobileRouter.get(
  "/tickets",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";

      const tickets = await prisma.ticket.findMany({
        where: isSuper ? {} : { userId: authReq.auth.userId },
        orderBy: { createdAt: "desc" },
      });

      response.json({ tickets });
    } catch (error) {
      next(error);
    }
  }
);
