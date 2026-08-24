import { CampaignChannel, DeliveryStatus, DeviceStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authCookieName, readCookie, verifySessionToken } from "../lib/session";

export const mobileRouter = Router();

const registerSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).default("Pulak"),
  deviceName: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(1),
  operator: z.string().trim().min(1).default("Unknown"),
});

const heartbeatSchema = z.object({
  battery: z.string().trim().min(1).optional(),
  queuedJobs: z.number().int().min(0).optional(),
});

const resultSchema = z.object({
  status: z.enum(["SENT", "FAILED"]),
  detail: z.string().trim().min(1),
});

mobileRouter.post("/register", async (request, response, next) => {
  try {
    const payload = registerSchema.parse(request.body);

    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: { name: payload.name },
      create: {
        email: payload.email,
        name: payload.name,
      },
    });

    const existingDevice = await prisma.device.findFirst({
      where: {
        userId: user.id,
        deviceName: payload.deviceName,
        phoneNumber: payload.phoneNumber,
      },
    });

    const device = existingDevice
      ? await prisma.device.update({
          where: { id: existingDevice.id },
          data: {
            operator: payload.operator,
            status: DeviceStatus.ONLINE,
            lastSeenAt: new Date(),
          },
        })
      : await prisma.device.create({
          data: {
            userId: user.id,
            deviceName: payload.deviceName,
            phoneNumber: payload.phoneNumber,
            operator: payload.operator,
            status: DeviceStatus.ONLINE,
            lastSeenAt: new Date(),
          },
        });

    response.status(201).json({
      device: {
        id: device.id,
        deviceName: device.deviceName,
        phoneNumber: device.phoneNumber,
        operator: device.operator,
        status: device.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.post("/:deviceId/heartbeat", async (request, response, next) => {
  try {
    const { deviceId } = request.params;
    const payload = heartbeatSchema.parse(request.body);

    const device = await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.ONLINE,
        lastSeenAt: new Date(),
        ...(payload.battery !== undefined ? { battery: payload.battery } : {}),
        ...(payload.queuedJobs !== undefined
          ? { queuedJobs: payload.queuedJobs }
          : {}),
      },
    });

    response.json({
      ok: true,
      device: {
        id: device.id,
        status: device.status,
        queuedJobs: device.queuedJobs,
        battery: device.battery,
        lastSeenAt: device.lastSeenAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.get("/:deviceId/jobs", async (request, response, next) => {
  try {
    const { deviceId } = request.params;

    await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.ONLINE,
        lastSeenAt: new Date(),
      },
    });

    const pendingJobs = await prisma.delivery.findMany({
      where: {
        channel: CampaignChannel.SMS,
        status: DeliveryStatus.PENDING,
      },
      orderBy: {
        timestamp: "asc",
      },
      take: 20,
      select: {
        id: true,
      },
    });

    if (pendingJobs.length > 0) {
      await prisma.delivery.updateMany({
        where: {
          id: {
            in: pendingJobs.map((job) => job.id),
          },
        },
        data: {
          status: DeliveryStatus.ASSIGNED,
        },
      });
    }

    const jobs = await prisma.delivery.findMany({
      where: {
        channel: CampaignChannel.SMS,
        status: {
          in: [DeliveryStatus.ASSIGNED, DeliveryStatus.SENDING],
        },
      },
      include: {
        customer: true,
        campaign: true,
      },
      orderBy: {
        timestamp: "asc",
      },
      take: 20,
    });

    response.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        phoneNumber: job.customer.mobile,
        customerName: job.customer.name,
        campaignName: job.campaign.name,
        message: job.detail,
        status: job.status,
      })),
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.post("/jobs/:deliveryId/result", async (request, response, next) => {
  try {
    const { deliveryId } = request.params;
    const payload = resultSchema.parse(request.body);

    const status =
      payload.status === "SENT" ? DeliveryStatus.SENT : DeliveryStatus.FAILED;

    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status,
        detail: payload.detail,
        timestamp: new Date(),
      },
      include: {
        campaign: true,
      },
    });

    if (status === DeliveryStatus.SENT) {
      await prisma.campaign.update({
        where: { id: delivery.campaignId },
        data: {
          sentCount: {
            increment: 1,
          },
        },
      });
    } else {
      await prisma.campaign.update({
        where: { id: delivery.campaignId },
        data: {
          failedCount: {
            increment: 1,
          },
        },
      });
    }

    response.json({
      ok: true,
      delivery: {
        id: delivery.id,
        status: delivery.status,
        detail: delivery.detail,
      },
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.get("/stats", async (_request, response, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [sentToday, pending, failedToday] = await Promise.all([
      prisma.delivery.count({
        where: {
          channel: CampaignChannel.SMS,
          status: DeliveryStatus.SENT,
          updatedAt: { gte: startOfToday },
        },
      }),
      prisma.delivery.count({
        where: {
          channel: CampaignChannel.SMS,
          status: { in: [DeliveryStatus.PENDING, DeliveryStatus.ASSIGNED] },
        },
      }),
      prisma.delivery.count({
        where: {
          channel: CampaignChannel.SMS,
          status: DeliveryStatus.FAILED,
          updatedAt: { gte: startOfToday },
        },
      }),
    ]);

    response.json({
      sentToday,
      pending,
      failedToday,
    });
  } catch (error) {
    next(error);
  }
});

const createTicketSchema = z.object({
  subject: z.string().trim().min(1),
  category: z.string().trim().min(1).default("Connection Issue"),
  priority: z.string().trim().min(1).default("Medium"),
  description: z.string().trim().min(1),
});

mobileRouter.get("/tickets", async (_request, response, next) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    response.json({
      tickets: tickets.map((t) => ({
        id: t.ticketNumber,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        description: t.description,
        status: t.status,
        timestamp: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.post("/tickets", async (request, response, next) => {
  try {
    const payload = createTicketSchema.parse(request.body);
    const bearerHeader = request.headers.authorization;
    const bearerToken = bearerHeader?.startsWith("Bearer ")
      ? bearerHeader.substring(7).trim()
      : undefined;
    const token = bearerToken || readCookie(request.headers.cookie, authCookieName);
    const session = verifySessionToken(token);

    let userId = session?.userId;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        response.status(401).json({ error: "User account required." });
        return;
      }
      userId = defaultUser.id;
    }

    const count = await prisma.ticket.count();
    const ticketNumber = `#TKT-${String(count + 1).padStart(3, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        userId,
        subject: payload.subject,
        category: payload.category,
        priority: payload.priority,
        description: payload.description,
        status: "OPEN",
      },
    });

    await prisma.mobileLog.create({
      data: {
        userId,
        type: "INFO",
        title: "Support Ticket Created",
        detail: `${ticket.ticketNumber} (${ticket.subject}) submitted to support queue.`,
      },
    });

    response.status(201).json({
      ok: true,
      ticket: {
        id: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        description: ticket.description,
        status: ticket.status,
        timestamp: ticket.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

const createLogSchema = z.object({
  type: z.string().trim().default("INFO"),
  title: z.string().trim().min(1),
  detail: z.string().trim().min(1),
  deviceId: z.string().optional(),
});

mobileRouter.get("/logs", async (_request, response, next) => {
  try {
    const logs = await prisma.mobileLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    response.json({
      logs: logs.map((l) => ({
        id: l.id,
        type: l.type,
        title: l.title,
        detail: l.detail,
        timestampMillis: l.timestamp.getTime(),
        timeFormatted: l.timestamp.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      })),
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.post("/logs", async (request, response, next) => {
  try {
    const payload = createLogSchema.parse(request.body);
    const bearerHeader = request.headers.authorization;
    const bearerToken = bearerHeader?.startsWith("Bearer ")
      ? bearerHeader.substring(7).trim()
      : undefined;
    const token = bearerToken || readCookie(request.headers.cookie, authCookieName);
    const session = verifySessionToken(token);

    let userId = session?.userId;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    if (userId) {
      await prisma.mobileLog.create({
        data: {
          userId,
          deviceId: payload.deviceId ?? null,
          type: payload.type,
          title: payload.title,
          detail: payload.detail,
        },
      });
    }

    response.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});
