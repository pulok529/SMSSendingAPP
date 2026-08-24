import { CampaignChannel, CampaignStatus, DeliveryStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

export const campaignsRouter = Router();

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  channel: z.enum(["SMS", "EMAIL"]).default("SMS"),
  eventId: z.string().optional(),
  message: z.string().trim().optional(),
  limit: z.number().int().min(1).max(500).default(50),
});

const queueSmsSchema = z.object({
  message: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

campaignsRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const campaigns = await prisma.campaign.findMany({
        where: userFilter,
        include: {
          event: true,
          _count: {
            select: { deliveries: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      response.json({ campaigns });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = createCampaignSchema.parse(request.body);
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const customerFilter = isSuper ? {} : { userId: authReq.auth.userId };

      // Fetch matching customers for this tenant
      const customers = await prisma.customer.findMany({
        where: {
          ...customerFilter,
          ...(payload.channel === "SMS"
            ? { consentSms: true, mobile: { not: null } }
            : { consentEmail: true, email: { not: null } }),
        },
        take: payload.limit,
      });

      const campaign = await prisma.campaign.create({
        data: {
          userId: authReq.auth.userId,
          eventId: payload.eventId || null,
          name: payload.name,
          channel: payload.channel as CampaignChannel,
          audienceSize: customers.length,
          status: CampaignStatus.QUEUED,
          launchedAt: new Date(),
        },
      });

      const templateText =
        payload.message || "Hello {{name}}, update from Pulse Dispatch.";

      if (customers.length > 0) {
        await prisma.delivery.createMany({
          data: customers.map((c) => ({
            customerId: c.id,
            campaignId: campaign.id,
            channel: payload.channel as CampaignChannel,
            status: DeliveryStatus.PENDING,
            detail: templateText.replaceAll("{{name}}", c.name),
          })),
        });
      }

      response.status(201).json({ ok: true, campaign, queuedCount: customers.length });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.post(
  "/:campaignId/queue-sms",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const campaignId = z.string().min(1).parse(request.params.campaignId);
      const payload = queueSmsSchema.parse(request.body ?? {});
      const isSuper = authReq.auth.role === "SUPERADMIN";

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { event: true },
      });

      if (!campaign) {
        response.status(404).json({ error: "Campaign not found." });
        return;
      }

      if (!isSuper && campaign.userId !== authReq.auth.userId) {
        response.status(403).json({ error: "Unauthorized to queue this campaign." });
        return;
      }

      const existingDeliveries = await prisma.delivery.findMany({
        where: {
          campaignId,
          channel: CampaignChannel.SMS,
        },
        select: {
          customerId: true,
        },
      });

      const excludedCustomerIds = existingDeliveries.map((d) => d.customerId);

      const customerFilter = isSuper ? {} : { userId: authReq.auth.userId };
      const customers = await prisma.customer.findMany({
        where: {
          ...customerFilter,
          consentSms: true,
          mobile: { not: null },
          ...(excludedCustomerIds.length > 0
            ? { id: { notIn: excludedCustomerIds } }
            : {}),
        },
        orderBy: { createdAt: "asc" },
        take: payload.limit ?? 100,
      });

      const messageTemplate =
        payload.message ??
        campaign.event?.smsTemplate ??
        "Hi {{name}}, this is an update from Pulse Dispatch.";

      if (customers.length > 0) {
        await prisma.delivery.createMany({
          data: customers.map((customer) => ({
            customerId: customer.id,
            campaignId: campaign.id,
            channel: CampaignChannel.SMS,
            status: DeliveryStatus.PENDING,
            detail: messageTemplate.replaceAll("{{name}}", customer.name),
          })),
        });

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            channel: CampaignChannel.SMS,
            status: CampaignStatus.QUEUED,
            audienceSize: { increment: customers.length },
          },
        });
      }

      response.status(201).json({
        ok: true,
        campaignId: campaign.id,
        queued: customers.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

const quickSendSchema = z.object({
  name: z.string().trim().optional(),
  message: z.string().trim().min(1, "SMS message is required"),
  recipients: z
    .array(
      z.object({
        name: z.string().trim().optional().default("Valued Contact"),
        phone: z.string().trim().min(3, "Phone number is required"),
        company: z.string().trim().optional(),
        custom: z.string().trim().optional(),
      })
    )
    .min(1, "At least 1 recipient is required"),
});

campaignsRouter.post(
  "/quick-send",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = quickSendSchema.parse(request.body);

      const processedDeliveries: { customerId: string; phone: string; text: string }[] = [];

      for (const item of payload.recipients) {
        const rawPhone = item.phone.trim();
        const cleanPhone = rawPhone.replace(/[^\d+]/g, "");
        if (!cleanPhone || cleanPhone.length < 5) continue;

        const recipientName = item.name?.trim() || "Valued Contact";
        const recipientCompany = item.company?.trim() || null;

        let customer = await prisma.customer.findFirst({
          where: {
            userId: authReq.auth.userId,
            mobile: cleanPhone,
          },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              userId: authReq.auth.userId,
              name: recipientName,
              mobile: cleanPhone,
              company: recipientCompany,
              consentSms: true,
              tags: ["instant-send", "quick-dispatch"],
            },
          });
        }

        let text = payload.message;
        text = text.replaceAll("{{name}}", recipientName);
        text = text.replaceAll("{{phone}}", cleanPhone);
        text = text.replaceAll("{{company}}", recipientCompany || "");
        text = text.replaceAll("{{custom}}", item.custom?.trim() || "");
        text = text.replaceAll("[name]", recipientName);
        text = text.replaceAll("[phone]", cleanPhone);
        text = text.replaceAll("[company]", recipientCompany || "");

        processedDeliveries.push({
          customerId: customer.id,
          phone: cleanPhone,
          text,
        });
      }

      if (processedDeliveries.length === 0) {
        response.status(400).json({ error: "No valid phone numbers found in recipient list." });
        return;
      }

      const now = new Date();
      const campaignTitle =
        payload.name?.trim() ||
        `Instant SMS - ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

      const campaign = await prisma.campaign.create({
        data: {
          userId: authReq.auth.userId,
          name: campaignTitle,
          channel: CampaignChannel.SMS,
          audienceSize: processedDeliveries.length,
          status: CampaignStatus.QUEUED,
          launchedAt: new Date(),
        },
      });

      await prisma.delivery.createMany({
        data: processedDeliveries.map((item) => ({
          customerId: item.customerId,
          campaignId: campaign.id,
          channel: CampaignChannel.SMS,
          status: DeliveryStatus.PENDING,
          detail: item.text,
        })),
      });

      response.status(201).json({
        ok: true,
        campaignId: campaign.id,
        campaignName: campaign.name,
        queuedCount: processedDeliveries.length,
        message: `Successfully queued ${processedDeliveries.length} instant SMS messages for dispatch!`,
      });
    } catch (error) {
      next(error);
    }
  }
);

