import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

export const customersRouter = Router();

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  company: z.string().trim().optional(),
  mobile: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  city: z.string().trim().optional(),
  tags: z.array(z.string()).default([]),
  consentSms: z.boolean().default(true),
  consentEmail: z.boolean().default(true),
});

customersRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const { search, consent, tag } = request.query;

      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const whereClause: any = {
        ...userFilter,
        ...(search
          ? {
              OR: [
                { name: { contains: String(search), mode: "insensitive" } },
                { company: { contains: String(search), mode: "insensitive" } },
                { mobile: { contains: String(search) } },
                { email: { contains: String(search), mode: "insensitive" } },
                { city: { contains: String(search), mode: "insensitive" } },
              ],
            }
          : {}),
        ...(consent === "SMS" ? { consentSms: true, mobile: { not: null } } : {}),
        ...(consent === "EMAIL" ? { consentEmail: true, email: { not: null } } : {}),
        ...(tag ? { tags: { has: String(tag) } } : {}),
      };

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.customer.count({ where: whereClause }),
      ]);

      response.json({ customers, total });
    } catch (error) {
      next(error);
    }
  }
);

customersRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = createCustomerSchema.parse(request.body);

      const customer = await prisma.customer.create({
        data: {
          userId: authReq.auth.userId,
          name: payload.name,
          company: payload.company || null,
          mobile: payload.mobile || null,
          email: payload.email || null,
          city: payload.city || null,
          tags: payload.tags,
          consentSms: payload.consentSms,
          consentEmail: payload.consentEmail,
          lastContact: new Date(),
        },
      });

      response.status(201).json({ ok: true, customer });
    } catch (error) {
      next(error);
    }
  }
);

customersRouter.delete(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const id = z.string().min(1).parse(request.params.id);
      const isSuper = authReq.auth.role === "SUPERADMIN";

      const customer = await prisma.customer.findUnique({ where: { id } });
      if (!customer) {
        response.status(404).json({ error: "Customer not found." });
        return;
      }

      if (!isSuper && customer.userId && customer.userId !== authReq.auth.userId) {
        response.status(403).json({ error: "Unauthorized to delete this customer." });
        return;
      }

      await prisma.customer.delete({ where: { id } });
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);
