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
