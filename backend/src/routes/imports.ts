import { CampaignChannel, CampaignStatus, DeliveryStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

export const importsRouter = Router();

const cellSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const smsImportSchema = z.object({
  campaignName: z.string().trim().min(1).default("Imported SMS Campaign"),
  messageTemplate: z.string().trim().min(1),
  phoneColumn: z.string().trim().min(1).optional(),
  rows: z.array(z.record(z.string(), cellSchema)).min(1).max(1000),
});

type ImportRow = z.infer<typeof smsImportSchema>["rows"][number];

const phoneColumnCandidates = [
  "mobile",
  "phone",
  "phone number",
  "phone_number",
  "mobile number",
  "mobile_number",
  "number",
];

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replaceAll("_", " ");
}

function rowValue(row: ImportRow, key: string): string {
  const wantedKey = normalizeKey(key);

  if (wantedKey === "name") {
    return firstRowValue(row, ["name", "full name", "customer name"]);
  }

  if (wantedKey === "mobile" || wantedKey === "phone") {
    return firstRowValue(row, phoneColumnCandidates);
  }

  return rowValueWithoutAliases(row, key);
}

function firstRowValue(row: ImportRow, candidates: string[]): string {
  for (const candidate of candidates) {
    const value = rowValueWithoutAliases(row, candidate).trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function rowValueWithoutAliases(row: ImportRow, key: string): string {
  const wantedKey = normalizeKey(key);
  const match = Object.entries(row).find(
    ([rowKey]) => normalizeKey(rowKey) === wantedKey
  );

  return match?.[1] === null || match?.[1] === undefined ? "" : String(match[1]);
}

function personalizedMessage(template: string, row: ImportRow): string {
  return template.replace(/\[([^\]]+)\]/g, (_placeholder, key: string) =>
    rowValue(row, key).trim()
  );
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

importsRouter.post(
  "/sms",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (request, response, next) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const payload = smsImportSchema.parse(request.body);
      const seenPhoneNumbers = new Set<string>();
      const validRows = payload.rows
        .map((row) => {
          const name = firstRowValue(row, ["name", "full name", "customer name"]);
          const phoneNumber = payload.phoneColumn
            ? rowValue(row, payload.phoneColumn).trim()
            : firstRowValue(row, phoneColumnCandidates);
          const email = firstRowValue(row, ["email", "email address"]);

          return {
            row,
            name: name || "Unknown Recipient",
            phoneNumber,
            email,
            company: firstRowValue(row, ["company", "business"]),
            city: firstRowValue(row, ["city", "location"]),
            tags: splitTags(firstRowValue(row, ["tags", "segments"])),
            message: personalizedMessage(payload.messageTemplate, row),
          };
        })
        .filter((row) => {
          if (!row.phoneNumber || !row.message || seenPhoneNumbers.has(row.phoneNumber)) {
            return false;
          }

          seenPhoneNumbers.add(row.phoneNumber);
          return true;
        });

      if (validRows.length === 0) {
        response.status(400).json({
          error: "No valid SMS recipients were found. Check the phone/mobile column.",
        });
        return;
      }

      const campaign = await prisma.campaign.create({
        data: {
          userId: authRequest.auth.userId,
          name: payload.campaignName,
          channel: CampaignChannel.SMS,
          audienceSize: validRows.length,
          status: CampaignStatus.QUEUED,
          launchedAt: new Date(),
        },
      });

      const deliveries = [];

      for (const validRow of validRows) {
        const existingCustomer = validRow.email
          ? await prisma.customer.findUnique({
              where: {
                email: validRow.email,
              },
            })
          : await prisma.customer.findFirst({
              where: {
                mobile: validRow.phoneNumber,
              },
            });

        const customer = existingCustomer
          ? await prisma.customer.update({
              where: {
                id: existingCustomer.id,
              },
              data: {
                userId: authRequest.auth.userId,
                name: validRow.name,
                company: validRow.company || existingCustomer.company,
                mobile: validRow.phoneNumber,
                email: validRow.email || existingCustomer.email,
                city: validRow.city || existingCustomer.city,
                tags: validRow.tags.length > 0 ? validRow.tags : existingCustomer.tags,
                consentSms: true,
              },
            })
          : await prisma.customer.create({
              data: {
                userId: authRequest.auth.userId,
                name: validRow.name,
                company: validRow.company || null,
                mobile: validRow.phoneNumber,
                email: validRow.email || null,
                city: validRow.city || null,
                tags: validRow.tags,
                consentSms: true,
                consentEmail: Boolean(validRow.email),
              },
            });

        const delivery = await prisma.delivery.create({
          data: {
            customerId: customer.id,
            campaignId: campaign.id,
            channel: CampaignChannel.SMS,
            status: DeliveryStatus.PENDING,
            detail: validRow.message,
          },
        });

        deliveries.push(delivery);
      }

      response.status(201).json({
        ok: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
        },
        queued: deliveries.length,
        skipped: payload.rows.length - deliveries.length,
      });
    } catch (error) {
      next(error);
    }
  }
);
