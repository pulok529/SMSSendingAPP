import { Router } from "express";
import { prisma } from "../lib/prisma";

export const eventsRouter = Router();

eventsRouter.get("/", async (_request, response, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        date: "asc",
      },
      take: 50,
    });

    response.json({ events });
  } catch (error) {
    next(error);
  }
});
