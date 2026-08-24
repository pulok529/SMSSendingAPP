import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

export const eventsRouter = Router();

const createEventSchema = z.object({
  title: z.string().trim().min(1, "Event title is required"),
  date: z.string().trim().min(1, "Event date is required"),
  venue: z.string().trim().min(1, "Venue is required"),
  audience: z.string().trim().default("All Contacts"),
  smsTemplate: z.string().trim().min(1, "SMS Template is required"),
  emailSubject: z.string().trim().min(1, "Email Subject is required"),
  status: z.string().trim().default("PLANNING"),
});

eventsRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const events = await prisma.event.findMany({
        where: userFilter,
        include: {
          _count: {
            select: { campaigns: true },
          },
          campaigns: {
            select: { id: true, name: true, status: true, channel: true },
            take: 3,
          },
        },
        orderBy: { date: "asc" },
      });

      response.json({ events });
    } catch (error) {
      next(error);
    }
  }
);

eventsRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = createEventSchema.parse(request.body);

      const event = await prisma.event.create({
        data: {
          userId: authReq.auth.userId,
          title: payload.title,
          date: new Date(payload.date),
          venue: payload.venue,
          audience: payload.audience,
          smsTemplate: payload.smsTemplate,
          emailSubject: payload.emailSubject,
          status: payload.status,
        },
      });

      response.status(201).json({ ok: true, event });
    } catch (error) {
      next(error);
    }
  }
);

eventsRouter.delete(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const id = z.string().min(1).parse(request.params.id);
      const isSuper = authReq.auth.role === "SUPERADMIN";

      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) {
        response.status(404).json({ error: "Event not found." });
        return;
      }

      if (!isSuper && event.userId !== authReq.auth.userId) {
        response.status(403).json({ error: "Unauthorized to delete this event." });
        return;
      }

      await prisma.event.delete({ where: { id } });
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);
