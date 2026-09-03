import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { startSchedulerWorker } from "./services/scheduler";

async function start() {
  await prisma.$connect();

  // Start background scheduler worker for scheduled campaigns
  startSchedulerWorker();

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Pulse Dispatch API listening on http://0.0.0.0:${env.PORT}`);
  });
}

start().catch(async (error) => {
  console.error("Failed to start backend", error);
  await prisma.$disconnect();
  process.exit(1);
});

