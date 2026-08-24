import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  clearSessionCookie,
  createSessionToken,
  readCookie,
  sessionCookie,
  authCookieName,
  verifySessionToken,
} from "../lib/session";
import { hashPassword, verifyPassword } from "../lib/password";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const payload = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (!user || !user.passwordHash) {
      response.status(401).json({ error: "Invalid email or password." });
      return;
    }

    if (user.isActive === false) {
      response.status(403).json({
        error: "Your account has been disabled. Please contact administrator.",
      });
      return;
    }

    const validPassword = await verifyPassword(payload.password, user.passwordHash);

    if (!validPassword) {
      response.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    response.setHeader("Set-Cookie", sessionCookie(token));
    response.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        isActive: user.isActive,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_request, response) => {
  response.setHeader("Set-Cookie", clearSessionCookie());
  response.json({ ok: true });
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

authRouter.get("/me", async (request, response, next) => {
  try {
    const bearerHeader = request.headers.authorization;
    const bearerToken = bearerHeader?.startsWith("Bearer ")
      ? bearerHeader.substring(7).trim()
      : undefined;
    const token = bearerToken || readCookie(request.headers.cookie, authCookieName);
    const session = verifySessionToken(token);

    if (!session) {
      response.status(401).json({ error: "Login required." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        isActive: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        notes: true,
        createdAt: true,
      },
    });

    if (!user) {
      response.status(401).json({ error: "Login required." });
      return;
    }

    if (user.isActive === false) {
      response.status(403).json({
        error: "Your account has been disabled. Please contact administrator.",
      });
      return;
    }

    response.json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.put("/profile", async (request, response, next) => {
  try {
    const bearerHeader = request.headers.authorization;
    const bearerToken = bearerHeader?.startsWith("Bearer ")
      ? bearerHeader.substring(7).trim()
      : undefined;
    const token = bearerToken || readCookie(request.headers.cookie, authCookieName);
    const session = verifySessionToken(token);

    if (!session) {
      response.status(401).json({ error: "Login required." });
      return;
    }

    const payload = updateProfileSchema.parse(request.body);

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.dateOfBirth !== undefined ? { dateOfBirth: payload.dateOfBirth } : {}),
        ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
        ...(payload.address !== undefined ? { address: payload.address } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        createdAt: true,
      },
    });

    response.json({ ok: true, user });
  } catch (error) {
    next(error);
  }
});

authRouter.put("/password", async (request, response, next) => {
  try {
    const bearerHeader = request.headers.authorization;
    const bearerToken = bearerHeader?.startsWith("Bearer ")
      ? bearerHeader.substring(7).trim()
      : undefined;
    const token = bearerToken || readCookie(request.headers.cookie, authCookieName);
    const session = verifySessionToken(token);

    if (!session) {
      response.status(401).json({ error: "Login required." });
      return;
    }

    const payload = changePasswordSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.passwordHash) {
      response.status(401).json({ error: "User account not found." });
      return;
    }

    const valid = await verifyPassword(payload.oldPassword, user.passwordHash);
    if (!valid) {
      response.status(400).json({ error: "Current password is incorrect." });
      return;
    }

    const newHash = await hashPassword(payload.newPassword);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newHash },
    });

    response.json({ ok: true, message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
});
