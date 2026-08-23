import { PrismaClient } from "@prisma/client";

declare global {
  var __pulsePrisma: PrismaClient | undefined;
}

export const prisma =
  global.__pulsePrisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__pulsePrisma = prisma;
}
