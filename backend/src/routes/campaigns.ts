import { CampaignChannel, CampaignStatus, DeliveryStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const campaignsRouter = Router();

const queueSmsSchema = z.object({
  message: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

campaignsRouter.get("/", async (_request, response, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    response.json({ campaigns });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.post(
  "/:campaignId/queue-sms",
  requireAuth(["ADMIN", "SENDER"]),
  async (request, response, next) => {
    try {
      const campaignId = z.string().min(1).parse(request.params.campaignId);
      const payload = queueSmsSchema.parse(request.body ?? {});

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { event: true },
      });

      if (!campaign) {
        response.status(404).json({ error: "Campaign not found." });
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

      const excludedCustomerIds = existingDeliveries.map(
        (delivery) => delivery.customerId
      );

      const customers = await prisma.customer.findMany({
        where: {
          consentSms: true,
          mobile: {
            not: null,
          },
          ...(excludedCustomerIds.length > 0
            ? {
                id: {
                  notIn: excludedCustomerIds,
                },
              }
            : {}),
        },
        orderBy: {
          createdAt: "asc",
        },
        take: payload.limit ?? 100,
      });

      const messageTemplate =
        payload.message ??
        campaign.event?.smsTemplate ??
        "Hi {{name}}, this is a message from Pulse Dispatch.";

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
            audienceSize: {
              increment: customers.length,
            },
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
