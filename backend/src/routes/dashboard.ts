import { Router } from "express";
import { prisma } from "../lib/prisma";
import { dashboardSummary } from "../data/dashboard-data";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_request, response, next) => {
  try {
    const [customerCount, campaignCount, eventCount, device] = await Promise.all([
      prisma.customer.count(),
      prisma.campaign.count(),
      prisma.event.count(),
      prisma.device.findFirst({
        orderBy: {
          updatedAt: "desc",
        },
      }),
    ]);

    response.json({
      stats: dashboardSummary,
      counts: {
        customers: customerCount,
        campaigns: campaignCount,
        events: eventCount,
      },
      device,
    });
  } catch (error) {
    next(error);
  }
});
