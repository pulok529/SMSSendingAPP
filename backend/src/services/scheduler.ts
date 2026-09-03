import { CampaignStatus, DeliveryStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { sendLiveEmail } from "./email-sender";

let isSchedulerRunning = false;

export function startSchedulerWorker() {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;

  console.log("⚡ [Scheduler] Pulse Scheduled Dispatch Worker initialized (Interval: 20s)");

  setInterval(async () => {
    try {
      const now = new Date();
      const scheduledCampaigns = await prisma.campaign.findMany({
        where: {
          status: CampaignStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
        include: {
          deliveries: {
            where: { status: DeliveryStatus.PENDING },
            include: { customer: true },
          },
        },
      });

      for (const campaign of scheduledCampaigns) {
        console.log(`⚡ [Scheduler] Activating scheduled campaign "${campaign.name}" (${campaign.id})`);

        // 1. Mark campaign as QUEUED
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: CampaignStatus.QUEUED,
            launchedAt: now,
          },
        });

        // 2. If there are Email deliveries in this campaign, dispatch them via SMTP
        const emailDeliveries = campaign.deliveries.filter((d) => d.channel === "EMAIL");
        for (const ed of emailDeliveries) {
          const targetEmail = ed.recipientEmail || ed.customer.email;
          if (targetEmail) {
            const subject = ed.emailSubject || campaign.emailSubject || "Update from Pulse Sender";
            const emailResult = await sendLiveEmail(campaign.userId, targetEmail, subject, ed.detail);

            await prisma.delivery.update({
              where: { id: ed.id },
              data: {
                status: emailResult.ok ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
              },
            });
          }
        }
      }
    } catch (err) {
      console.error("❌ [Scheduler] Error during scheduled scan:", err);
    }
  }, 20000);
}
