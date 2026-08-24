import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { hashPassword } from "../lib/password";
import { UserRole } from "@prisma/client";

export const usersRouter = Router();

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  role: z.enum(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]).default("CLIENT"),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  role: z.enum(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]).optional(),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// GET /api/users - List all users (Superadmin / Admin)
usersRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN"]),
  async (_request, response, next) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          company: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              devices: true,
              campaigns: true,
              tickets: true,
              mobileLogs: true,
            },
          },
          devices: {
            select: {
              id: true,
              deviceName: true,
              phoneNumber: true,
              operator: true,
              status: true,
              battery: true,
              lastSeenAt: true,
            },
            take: 3,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      response.json({ users });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/users - Create new user/client (Superadmin / Admin)
usersRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = createUserSchema.parse(request.body);

      // Only SUPERADMIN can create other SUPERADMIN/ADMIN users
      if (
        (payload.role === "SUPERADMIN" || payload.role === "ADMIN") &&
        authReq.auth.role !== "SUPERADMIN"
      ) {
        response
          .status(403)
          .json({ error: "Only Superadmin can create Admin or Superadmin users." });
        return;
      }

      const existing = await prisma.user.findUnique({
        where: { email: payload.email.toLowerCase() },
      });

      if (existing) {
        response
          .status(409)
          .json({ error: "A user with this email address already exists." });
        return;
      }

      const passwordHash = await hashPassword(payload.password);

      const user = await prisma.user.create({
        data: {
          name: payload.name,
          email: payload.email.toLowerCase(),
          passwordHash,
          role: payload.role as UserRole,
          isActive: payload.isActive,
          company: payload.company || null,
          phone: payload.phone || null,
          dateOfBirth: payload.dateOfBirth || null,
          gender: payload.gender || null,
          address: payload.address || null,
          notes: payload.notes || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          company: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          notes: true,
          createdAt: true,
        },
      });

      // Create an audit log entry
      await prisma.mobileLog.create({
        data: {
          userId: authReq.auth.userId,
          type: "INFO",
          title: "Client User Created",
          detail: `Created user ${user.name} (${user.email}) with role ${user.role}.`,
        },
      });

      response.status(201).json({ ok: true, user });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/:id - Get specific user details with their activity
usersRouter.get(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN"]),
  async (request, response, next) => {
    try {
      const id = z.string().min(1).parse(request.params.id);
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          company: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          devices: {
            orderBy: { updatedAt: "desc" },
          },
          campaigns: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          tickets: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          mobileLogs: {
            orderBy: { timestamp: "desc" },
            take: 25,
          },
          _count: {
            select: {
              devices: true,
              campaigns: true,
              tickets: true,
              mobileLogs: true,
            },
          },
        },
      });

      if (!user) {
        response.status(404).json({ error: "User not found." });
        return;
      }

      response.json({ user });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/users/:id - Update user info
usersRouter.put(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const id = z.string().min(1).parse(request.params.id);
      const payload = updateUserSchema.parse(request.body);

      // Prevent non-superadmin from promoting anyone to SUPERADMIN
      if (payload.role === "SUPERADMIN" && authReq.auth.role !== "SUPERADMIN") {
        response
          .status(403)
          .json({ error: "Only Superadmin can assign Superadmin role." });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.company !== undefined ? { company: payload.company } : {}),
          ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
          ...(payload.dateOfBirth !== undefined
            ? { dateOfBirth: payload.dateOfBirth }
            : {}),
          ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
          ...(payload.address !== undefined ? { address: payload.address } : {}),
          ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
          ...(payload.role !== undefined
            ? { role: payload.role as UserRole }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          company: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          notes: true,
          updatedAt: true,
        },
      });

      response.json({ ok: true, user });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/users/:id/status - Enable or Disable a user (Approve / Disable)
usersRouter.patch(
  "/:id/status",
  requireAuth(["SUPERADMIN", "ADMIN"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const id = z.string().min(1).parse(request.params.id);
      const payload = updateStatusSchema.parse(request.body);

      // Cannot disable own account
      if (id === authReq.auth.userId && !payload.isActive) {
        response
          .status(400)
          .json({ error: "You cannot disable your own administrator account." });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive: payload.isActive,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      // Audit log
      await prisma.mobileLog.create({
        data: {
          userId: authReq.auth.userId,
          type: payload.isActive ? "SUCCESS" : "WARNING",
          title: payload.isActive ? "User Account Activated" : "User Account Disabled",
          detail: `User ${user.name} (${user.email}) status changed to ${
            payload.isActive ? "ACTIVE" : "DISABLED"
          }.`,
        },
      });

      response.json({ ok: true, user });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/users/:id/reset-password - Superadmin reset client password
usersRouter.post(
  "/:id/reset-password",
  requireAuth(["SUPERADMIN", "ADMIN"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const id = z.string().min(1).parse(request.params.id);
      const payload = resetPasswordSchema.parse(request.body);

      const passwordHash = await hashPassword(payload.newPassword);

      const user = await prisma.user.update({
        where: { id },
        data: { passwordHash },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      await prisma.mobileLog.create({
        data: {
          userId: authReq.auth.userId,
          type: "INFO",
          title: "Password Reset by Admin",
          detail: `Password was reset for user ${user.name} (${user.email}).`,
        },
      });

      response.json({ ok: true, message: `Password reset successfully for ${user.email}.` });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/users/:id - Delete user account (Superadmin only)
usersRouter.delete(
  "/:id",
  requireAuth(["SUPERADMIN"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const id = z.string().min(1).parse(request.params.id);

      if (id === authReq.auth.userId) {
        response
          .status(400)
          .json({ error: "You cannot delete your own account." });
        return;
      }

      const deleted = await prisma.user.delete({
        where: { id },
        select: { id: true, name: true, email: true },
      });

      await prisma.mobileLog.create({
        data: {
          userId: authReq.auth.userId,
          type: "WARNING",
          title: "User Account Deleted",
          detail: `User ${deleted.name} (${deleted.email}) was permanently removed.`,
        },
      });

      response.json({ ok: true, deleted });
    } catch (error) {
      next(error);
    }
  }
);
