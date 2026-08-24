import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

export const logsRouter = Router();

logsRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const { status, channel, search } = request.query;

      const deliveryFilter: any = {
        ...(isSuper ? {} : { campaign: { userId: authReq.auth.userId } }),
        ...(status && status !== "ALL" ? { status: String(status) } : {}),
        ...(channel && channel !== "ALL" ? { channel: String(channel) } : {}),
        ...(search
          ? {
              OR: [
                { customer: { name: { contains: String(search), mode: "insensitive" } } },
                { customer: { mobile: { contains: String(search) } } },
                { campaign: { name: { contains: String(search), mode: "insensitive" } } },
                { detail: { contains: String(search), mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [deliveries, mobileLogs] = await Promise.all([
        prisma.delivery.findMany({
          where: deliveryFilter,
          include: {
            customer: true,
            campaign: true,
          },
          orderBy: { timestamp: "desc" },
          take: 100,
        }),
        prisma.mobileLog.findMany({
          where: isSuper ? {} : { userId: authReq.auth.userId },
          orderBy: { timestamp: "desc" },
          take: 50,
        }),
      ]);

      response.json({ deliveries, mobileLogs });
    } catch (error) {
      next(error);
    }
  }
);
