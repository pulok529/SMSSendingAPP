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

      const existing = await prisma.device.findFirst({
        where: { userId: authReq.auth.userId },
      });

      const device = existing
        ? await prisma.device.update({
            where: { id: existing.id },
            data: {
              deviceName: payload.deviceName,
              phoneNumber: payload.phoneNumber,
              operator: payload.operator,
              status: DeviceStatus.ONLINE,
              lastSeenAt: new Date(),
            },
          })
        : await prisma.device.create({
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
          title: "Device Connected",
          detail: `${payload.deviceName} (${payload.phoneNumber}) registered and online.`,
        },
      });

      response.status(200).json({ device });
    } catch (error) {
      next(error);
    }
  }
);

// Heartbeat handler (supports /heartbeat and /:deviceId/heartbeat)
const handleHeartbeat = async (request: any, response: any, next: any) => {
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
};

mobileRouter.post("/heartbeat", requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]), handleHeartbeat);
mobileRouter.post("/:deviceId/heartbeat", requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]), handleHeartbeat);

// Jobs handler (supports /jobs and /:deviceId/jobs)
const handleJobs = async (request: any, response: any, next: any) => {
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
};

mobileRouter.get("/jobs", requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]), handleJobs);
mobileRouter.get("/:deviceId/jobs", requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]), handleJobs);

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

// POST /api/mobile/sync - Synchronize staged offline batches and contacts
const syncOfflineSchema = z.object({
  stagedDispatches: z.array(
    z.object({
      name: z.string().optional(),
      subject: z.string().optional(),
      message: z.string().min(1),
      recipients: z.array(
        z.object({
          name: z.string().optional().default("Valued Contact"),
          phone: z.string().optional(),
          email: z.string().optional(),
          company: z.string().optional(),
          sendSms: z.boolean().default(true),
          sendEmail: z.boolean().default(false),
        })
      ),
      saveToDirectory: z.boolean().default(true),
      scheduledAt: z.string().optional().nullable(),
    })
  ).default([]),
  stagedContacts: z.array(
    z.object({
      name: z.string().min(1),
      contactNo: z.string().optional(),
      email: z.string().optional(),
      others: z.string().optional(),
    })
  ).default([]),
});

mobileRouter.post(
  "/sync",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = syncOfflineSchema.parse(request.body ?? {});

      let syncedContactsCount = 0;
      let syncedDispatchesCount = 0;

      // 1. Process staged contacts into Phone Directory
      for (const sc of payload.stagedContacts) {
        const cleanPhone = sc.contactNo ? sc.contactNo.replace(/[^\d+]/g, "") : null;
        const cleanEmail = sc.email?.trim().toLowerCase() || null;

        const match = await prisma.contact.findFirst({
          where: {
            userId: authReq.auth.userId,
            ...(cleanPhone ? { contactNo: cleanPhone } : cleanEmail ? { email: cleanEmail } : { name: sc.name }),
          },
        });

        if (!match) {
          await prisma.contact.create({
            data: {
              userId: authReq.auth.userId,
              name: sc.name,
              contactNo: cleanPhone,
              email: cleanEmail,
              others: sc.others || null,
            },
          });
          syncedContactsCount++;
        }
      }

      // 2. Process staged dispatches into Campaigns and Deliveries
      for (const disp of payload.stagedDispatches) {
        const now = new Date();
        const isScheduled = Boolean(disp.scheduledAt && new Date(disp.scheduledAt) > now);

        let hasSms = false;
        let hasEmail = false;
        const processedDeliveries: any[] = [];

        for (const item of disp.recipients) {
          const recipientName = item.name?.trim() || "Valued Contact";
          const cleanPhone = item.phone ? item.phone.trim().replace(/[^\d+]/g, "") : null;
          const cleanEmail = item.email ? item.email.trim().toLowerCase() : null;

          let customer = await prisma.customer.findFirst({
            where: {
              userId: authReq.auth.userId,
              ...(cleanPhone ? { mobile: cleanPhone } : cleanEmail ? { email: cleanEmail } : { name: recipientName }),
            },
          });

          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                userId: authReq.auth.userId,
                name: recipientName,
                mobile: cleanPhone,
                email: cleanEmail,
                company: item.company || null,
                consentSms: Boolean(item.sendSms),
                consentEmail: Boolean(item.sendEmail),
                tags: ["offline-sync"],
              },
            });
          }

          let text = disp.message;
          text = text.replaceAll("{{name}}", recipientName);
          text = text.replaceAll("{{phone}}", cleanPhone || "");
          text = text.replaceAll("{{email}}", cleanEmail || "");

          if (item.sendSms && cleanPhone && cleanPhone.length >= 5) {
            hasSms = true;
            processedDeliveries.push({
              customerId: customer.id,
              phone: cleanPhone,
              channel: "SMS",
              text,
            });
          }

          if (item.sendEmail && cleanEmail && cleanEmail.includes("@")) {
            hasEmail = true;
            processedDeliveries.push({
              customerId: customer.id,
              email: cleanEmail,
              channel: "EMAIL",
              text,
              subject: disp.subject || "Update from Pulse Sender",
            });
          }
        }

        if (processedDeliveries.length > 0) {
          const campaign = await prisma.campaign.create({
            data: {
              userId: authReq.auth.userId,
              name: disp.name || `Offline Sync - ${now.toLocaleDateString()}`,
              channel: hasSms && hasEmail ? "BOTH" : hasEmail ? "EMAIL" : "SMS",
              emailSubject: disp.subject || null,
              audienceSize: processedDeliveries.length,
              status: isScheduled ? CampaignStatus.SCHEDULED : CampaignStatus.QUEUED,
              scheduledAt: isScheduled && disp.scheduledAt ? new Date(disp.scheduledAt) : null,
              saveToDirectory: disp.saveToDirectory,
              launchedAt: isScheduled ? null : now,
            },
          });

          await prisma.delivery.createMany({
            data: processedDeliveries.map((d) => ({
              customerId: d.customerId,
              campaignId: campaign.id,
              channel: d.channel,
              status: DeliveryStatus.PENDING,
              recipientPhone: d.phone || null,
              recipientEmail: d.email || null,
              emailSubject: d.subject || null,
              detail: d.text,
            })),
          });

          syncedDispatchesCount++;
        }
      }

      response.status(201).json({
        ok: true,
        syncedContactsCount,
        syncedDispatchesCount,
        message: `Successfully synced ${syncedDispatchesCount} batch(es) and ${syncedContactsCount} contact(s) with central server.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

