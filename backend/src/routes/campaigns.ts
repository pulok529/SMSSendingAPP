import { CampaignChannel, CampaignStatus, DeliveryStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { findMatchingContact } from "./directory";
import { sendLiveEmail } from "../services/email-sender";

export const campaignsRouter = Router();

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  channel: z.enum(["SMS", "EMAIL", "BOTH"]).default("SMS"),
  eventId: z.string().optional(),
  message: z.string().trim().optional(),
  emailSubject: z.string().trim().optional(),
  limit: z.number().int().min(1).max(500).default(50),
});

campaignsRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const campaigns = await prisma.campaign.findMany({
        where: userFilter,
        include: {
          event: true,
          _count: {
            select: { deliveries: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      response.json({ campaigns });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.get(
  "/jobs-history",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const campaigns = await prisma.campaign.findMany({
        where: userFilter,
        include: {
          _count: {
            select: { deliveries: true },
          },
          deliveries: {
            take: 3,
            include: { customer: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      const list = campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        channel: c.channel,
        status: c.status,
        audienceSize: c.audienceSize || c._count.deliveries,
        createdAt: c.createdAt,
        sampleContacts: c.deliveries.map((d) => ({
          name: d.customer.name,
          phone: d.recipientPhone || d.customer.mobile || undefined,
          email: d.recipientEmail || d.customer.email || undefined,
        })),
      }));

      response.json({ jobs: list });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (request, response, next) => {
    try {
      const authReq = request as AuthenticatedRequest;
      const payload = createCampaignSchema.parse(request.body);
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const customerFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const customers = await prisma.customer.findMany({
        where: {
          ...customerFilter,
          ...(payload.channel === "SMS"
            ? { consentSms: true, mobile: { not: null } }
            : payload.channel === "EMAIL"
            ? { consentEmail: true, email: { not: null } }
            : {
                OR: [
                  { consentSms: true, mobile: { not: null } },
                  { consentEmail: true, email: { not: null } },
                ],
              }),
        },
        take: payload.limit,
      });

      const campaign = await prisma.campaign.create({
        data: {
          userId: authReq.auth.userId,
          eventId: payload.eventId || null,
          name: payload.name,
          channel: payload.channel as CampaignChannel,
          emailSubject: payload.emailSubject || null,
          audienceSize: customers.length,
          status: CampaignStatus.QUEUED,
          launchedAt: new Date(),
        },
      });

      const templateText =
        payload.message || "Hello {{name}}, update from Pulse Dispatch.";

      if (customers.length > 0) {
        await prisma.delivery.createMany({
          data: customers.map((c) => ({
            customerId: c.id,
            campaignId: campaign.id,
            channel: (payload.channel === "BOTH" ? "SMS" : payload.channel) as CampaignChannel,
            status: DeliveryStatus.PENDING,
            detail: templateText.replaceAll("{{name}}", c.name),
            recipientPhone: c.mobile,
            recipientEmail: c.email,
          })),
        });
      }

      response.status(201).json({ ok: true, campaign, queuedCount: customers.length });
    } catch (error) {
      next(error);
    }
  }
);

const dispatchSchema = z.object({
  name: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  message: z.string().trim().min(1, "Message content is required"),
  recipients: z
    .array(
      z.object({
        name: z.string().trim().optional().default("Valued Contact"),
        phone: z.string().trim().optional(),
        email: z.string().trim().optional(),
        company: z.string().trim().optional(),
        custom: z.string().trim().optional(),
        sendSms: z.boolean().default(true),
        sendEmail: z.boolean().default(false),
      })
    )
    .min(1, "At least 1 recipient is required"),
  saveToDirectory: z.boolean().default(true),
  scheduledAt: z.string().optional().nullable(),
});

interface ProcessedItem {
  customerId: string;
  phone?: string | null;
  email?: string | null;
  channel: CampaignChannel;
  text: string;
  subject?: string | null;
}

const handleDispatch = async (request: any, response: any, next: any) => {
  try {
    const authReq = request as AuthenticatedRequest;
    const payload = dispatchSchema.parse(request.body);

    const processedDeliveries: ProcessedItem[] = [];

    let hasSms = false;
    let hasEmail = false;

    for (const item of payload.recipients) {
      const recipientName = item.name?.trim() || "Valued Contact";
      const cleanPhone = item.phone ? item.phone.trim().replace(/[^\d+]/g, "") : null;
      const cleanEmail = item.email ? item.email.trim().toLowerCase() : null;
      const recipientCompany = item.company?.trim() || null;

      if (payload.saveToDirectory) {
        const match = await findMatchingContact(authReq.auth.userId, {
          name: recipientName,
          contactNo: cleanPhone,
          email: cleanEmail,
        });

        if (!match) {
          await prisma.contact.create({
            data: {
              userId: authReq.auth.userId,
              name: recipientName,
              contactNo: cleanPhone,
              email: cleanEmail,
              others: recipientCompany,
            },
          });
        }
      }

      let customer = await prisma.customer.findFirst({
        where: {
          userId: authReq.auth.userId,
          ...(cleanPhone ? { mobile: cleanPhone } : cleanEmail ? { email: cleanEmail } : { name: recipientName }),
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            userId: authReq.auth.userId,
            name: recipientName,
            mobile: cleanPhone,
            email: cleanEmail,
            company: recipientCompany,
            consentSms: Boolean(item.sendSms),
            consentEmail: Boolean(item.sendEmail),
            tags: ["dispatch", "instant"],
          },
        });
      }

      let text = payload.message;
      text = text.replaceAll("{{name}}", recipientName);
      text = text.replaceAll("{{phone}}", cleanPhone || "");
      text = text.replaceAll("{{email}}", cleanEmail || "");
      text = text.replaceAll("{{company}}", recipientCompany || "");
      text = text.replaceAll("{{custom}}", item.custom?.trim() || "");
      text = text.replaceAll("[name]", recipientName);
      text = text.replaceAll("[phone]", cleanPhone || "");
      text = text.replaceAll("[email]", cleanEmail || "");
      text = text.replaceAll("[company]", recipientCompany || "");

      let renderedSubject = payload.subject;
      if (renderedSubject) {
        renderedSubject = renderedSubject.replaceAll("{{name}}", recipientName);
        renderedSubject = renderedSubject.replaceAll("{{company}}", recipientCompany || "");
      }

      if (item.sendSms && cleanPhone && cleanPhone.length >= 5) {
        hasSms = true;
        processedDeliveries.push({
          customerId: customer.id,
          phone: cleanPhone,
          email: cleanEmail,
          channel: CampaignChannel.SMS,
          text,
        });
      }

      if (item.sendEmail && cleanEmail && cleanEmail.includes("@")) {
        hasEmail = true;
        processedDeliveries.push({
          customerId: customer.id,
          phone: cleanPhone,
          email: cleanEmail,
          channel: CampaignChannel.EMAIL,
          text,
          subject: renderedSubject || "Update from Pulse Sender",
        });
      }
    }

    if (processedDeliveries.length === 0) {
      response.status(400).json({
        error: "No valid channels selected or recipients lack phone/email details.",
      });
      return;
    }

    try {
      await prisma.messageLibrary.create({
        data: {
          userId: authReq.auth.userId,
          title: payload.name || "Instant Dispatch",
          subject: payload.subject || null,
          body: payload.message,
          channel: hasSms && hasEmail ? CampaignChannel.BOTH : hasEmail ? CampaignChannel.EMAIL : CampaignChannel.SMS,
          type: "AUTO",
          status: "ACTIVE",
          version: 1,
        },
      });
    } catch (_) {}

    const now = new Date();
    const isScheduled = Boolean(payload.scheduledAt && new Date(payload.scheduledAt) > now);
    const scheduledDate = isScheduled && payload.scheduledAt ? new Date(payload.scheduledAt) : null;

    const campaignChannel = hasSms && hasEmail ? CampaignChannel.BOTH : hasEmail ? CampaignChannel.EMAIL : CampaignChannel.SMS;
    const campaignTitle =
      payload.name?.trim() ||
      `Dispatch - ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

    const campaign = await prisma.campaign.create({
      data: {
        userId: authReq.auth.userId,
        name: campaignTitle,
        channel: campaignChannel,
        emailSubject: payload.subject || null,
        audienceSize: processedDeliveries.length,
        status: isScheduled ? CampaignStatus.SCHEDULED : CampaignStatus.QUEUED,
        scheduledAt: scheduledDate,
        saveToDirectory: payload.saveToDirectory,
        launchedAt: isScheduled ? null : now,
      },
    });

    await prisma.delivery.createMany({
      data: processedDeliveries.map((item) => ({
        customerId: item.customerId,
        campaignId: campaign.id,
        channel: item.channel,
        status: DeliveryStatus.PENDING,
        recipientPhone: item.phone || null,
        recipientEmail: item.email || null,
        emailSubject: item.subject || null,
        detail: item.text,
      })),
    });

    if (!isScheduled && hasEmail) {
      const emailDeliveries = await prisma.delivery.findMany({
        where: { campaignId: campaign.id, channel: CampaignChannel.EMAIL },
      });

      (async () => {
        for (const ed of emailDeliveries) {
          if (ed.recipientEmail) {
            const res = await sendLiveEmail(
              authReq.auth.userId,
              ed.recipientEmail,
              ed.emailSubject || payload.subject || "Update from Pulse Sender",
              ed.detail
            );
            await prisma.delivery.update({
              where: { id: ed.id },
              data: {
                status: res.ok ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
              },
            });
          }
        }
      })().catch((e) => console.error("Error in background email dispatch:", e));
    }

    response.status(201).json({
      ok: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: campaign.channel,
      isScheduled,
      scheduledAt: scheduledDate,
      queuedCount: processedDeliveries.length,
      smsCount: processedDeliveries.filter((d) => d.channel === "SMS").length,
      emailCount: processedDeliveries.filter((d) => d.channel === "EMAIL").length,
      message: isScheduled
        ? `Successfully scheduled ${processedDeliveries.length} messages for ${scheduledDate?.toLocaleString()}!`
        : `Successfully queued ${processedDeliveries.length} messages for immediate dispatch!`,
    });
  } catch (error) {
    next(error);
  }
};

campaignsRouter.post("/dispatch", requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]), handleDispatch);
campaignsRouter.post("/quick-send", requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]), handleDispatch);
