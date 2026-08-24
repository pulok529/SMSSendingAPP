import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { CampaignStatus, DeliveryStatus } from "@prisma/client";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };
      const customerFilter = isSuper ? {} : { userId: authReq.auth.userId };
      const campaignFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const [
        totalCustomers,
        smsReadyCount,
        emailReadyCount,
        totalCampaigns,
        activeCampaignsCount,
        deliveriesSentCount,
        deliveriesFailedCount,
        activeCampaigns,
        recentDeliveries,
        upcomingEvents,
        device,
      ] = await Promise.all([
        prisma.customer.count({ where: customerFilter }),
        prisma.customer.count({
          where: {
            ...customerFilter,
            consentSms: true,
            mobile: { not: null },
          },
        }),
        prisma.customer.count({
          where: {
            ...customerFilter,
            consentEmail: true,
            email: { not: null },
          },
        }),
        prisma.campaign.count({ where: campaignFilter }),
        prisma.campaign.count({
          where: {
            ...campaignFilter,
            status: { in: [CampaignStatus.QUEUED, CampaignStatus.SENDING] },
          },
        }),
        prisma.delivery.count({
          where: {
            ...(isSuper ? {} : { campaign: { userId: authReq.auth.userId } }),
            status: DeliveryStatus.SENT,
          },
        }),
        prisma.delivery.count({
          where: {
            ...(isSuper ? {} : { campaign: { userId: authReq.auth.userId } }),
            status: DeliveryStatus.FAILED,
          },
        }),
        prisma.campaign.findMany({
          where: campaignFilter,
          include: { event: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        prisma.delivery.findMany({
          where: isSuper ? {} : { campaign: { userId: authReq.auth.userId } },
          include: {
            customer: true,
            campaign: true,
          },
          orderBy: { timestamp: "desc" },
          take: 8,
        }),
        prisma.event.findMany({
          where: userFilter,
          orderBy: { date: "asc" },
          take: 4,
        }),
        prisma.device.findFirst({
          where: userFilter,
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      const totalDeliveries = deliveriesSentCount + deliveriesFailedCount;
      const successRate =
        totalDeliveries > 0
          ? ((deliveriesSentCount / totalDeliveries) * 100).toFixed(1) + "%"
          : "100%";

      const stats = [
        {
          label: "Ready to send",
          value: `${smsReadyCount.toLocaleString()} SMS`,
          note: "Consented mobile contacts",
        },
        {
          label: "Active campaigns",
          value: `${activeCampaignsCount} live`,
          note: `${totalCampaigns} total campaigns`,
        },
        {
          label: "Delivered Messages",
          value: deliveriesSentCount.toLocaleString(),
          note: `${successRate} success rate`,
        },
        {
          label: "Linked Android Senders",
          value: device ? device.deviceName : "No device",
          note: device ? `${device.status} · ${device.operator}` : "Ready to pair",
        },
      ];

      response.json({
        stats,
        counts: {
          customers: totalCustomers,
          smsReady: smsReadyCount,
          emailReady: emailReadyCount,
          campaigns: totalCampaigns,
          activeCampaigns: activeCampaignsCount,
          deliveriesSent: deliveriesSentCount,
          deliveriesFailed: deliveriesFailedCount,
        },
        activeCampaigns,
        recentDeliveries,
        upcomingEvents,
        device,
      });
    } catch (error) {
      next(error);
    }
  }
);
