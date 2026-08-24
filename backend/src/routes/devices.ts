import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

export const devicesRouter = Router();

devicesRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const devices = await prisma.device.findMany({
        where: userFilter,
        include: {
          user: {
            select: { id: true, name: true, email: true, company: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      response.json({ devices });
    } catch (error) {
      next(error);
    }
  }
);
