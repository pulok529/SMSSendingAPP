import { Router } from "express";
import { prisma } from "../lib/prisma";

export const customersRouter = Router();

customersRouter.get("/", async (_request, response, next) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    response.json({ customers });
  } catch (error) {
    next(error);
  }
});
