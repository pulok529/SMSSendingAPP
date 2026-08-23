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
import { verifyPassword } from "../lib/password";

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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

authRouter.get("/me", async (request, response, next) => {
  try {
    const token = readCookie(request.headers.cookie, authCookieName);
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
      },
    });

    if (!user) {
      response.status(401).json({ error: "Login required." });
      return;
    }

    response.json({ user });
  } catch (error) {
    next(error);
  }
});
