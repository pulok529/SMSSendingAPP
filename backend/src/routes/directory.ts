import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

export const directoryRouter = Router();

export async function findMatchingContact(
  userId: string,
  data: { name?: string | null; contactNo?: string | null; email?: string | null }
) {
  const cleanName = data.name?.trim() || null;
  const cleanPhone = data.contactNo?.trim() ? data.contactNo.trim().replace(/[^\d+]/g, "") : null;
  const cleanEmail = data.email?.trim().toLowerCase() || null;

  const existingContacts = await prisma.contact.findMany({
    where: { userId },
  });

  for (const c of existingContacts) {
    let checkedFields = 0;
    let matches = true;

    if (cleanName && c.name) {
      checkedFields++;
      if (cleanName.toLowerCase() !== c.name.trim().toLowerCase()) {
        matches = false;
      }
    }

    if (matches && cleanPhone && c.contactNo) {
      checkedFields++;
      const storedPhone = c.contactNo.trim().replace(/[^\d+]/g, "");
      if (cleanPhone !== storedPhone) {
        matches = false;
      }
    }

    if (matches && cleanEmail && c.email) {
      checkedFields++;
      if (cleanEmail !== c.email.trim().toLowerCase()) {
        matches = false;
      }
    }

    if (matches && checkedFields > 0) {
      return c;
    }
  }

  return null;
}

directoryRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

      const contacts = await prisma.contact.findMany({
        where: {
          ...userFilter,
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { contactNo: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                  { others: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ contacts });
    } catch (err) {
      next(err);
    }
  }
);

const createContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contactNo: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  others: z.string().trim().optional(),
});

directoryRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const payload = createContactSchema.parse(req.body);

      const cleanPhone = payload.contactNo ? payload.contactNo.replace(/[^\d+]/g, "") : null;
      const cleanEmail = payload.email?.trim() || null;

      const existing = await findMatchingContact(authReq.auth.userId, {
        name: payload.name,
        contactNo: cleanPhone,
        email: cleanEmail,
      });

      if (existing) {
        res.status(200).json({
          ok: true,
          contact: existing,
          alreadyExisted: true,
          message: "Contact already exists with matching non-null fields.",
        });
        return;
      }

      const created = await prisma.contact.create({
        data: {
          userId: authReq.auth.userId,
          name: payload.name,
          contactNo: cleanPhone,
          email: cleanEmail,
          others: payload.others || null,
        },
      });

      res.status(201).json({ ok: true, contact: created, alreadyExisted: false });
    } catch (err) {
      next(err);
    }
  }
);

const bulkContactSchema = z.object({
  contacts: z.array(
    z.object({
      name: z.string().trim().min(1),
      contactNo: z.string().trim().optional(),
      email: z.string().trim().optional(),
      others: z.string().trim().optional(),
    })
  ).min(1),
});

directoryRouter.post(
  "/bulk",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const payload = bulkContactSchema.parse(req.body);

      let createdCount = 0;
      let skippedCount = 0;
      const inserted: any[] = [];

      for (const item of payload.contacts) {
        const cleanPhone = item.contactNo ? item.contactNo.replace(/[^\d+]/g, "") : null;
        const cleanEmail = item.email?.trim().toLowerCase() || null;

        const match = await findMatchingContact(authReq.auth.userId, {
          name: item.name,
          contactNo: cleanPhone,
          email: cleanEmail,
        });

        if (!match) {
          const contact = await prisma.contact.create({
            data: {
              userId: authReq.auth.userId,
              name: item.name,
              contactNo: cleanPhone,
              email: cleanEmail,
              others: item.others || null,
            },
          });
          inserted.push(contact);
          createdCount++;
        } else {
          skippedCount++;
        }
      }

      res.status(201).json({
        ok: true,
        createdCount,
        skippedCount,
        total: payload.contacts.length,
        contacts: inserted,
      });
    } catch (err) {
      next(err);
    }
  }
);

directoryRouter.get(
  "/duplicates",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const allContacts = await prisma.contact.findMany({
        where: userFilter,
        orderBy: { createdAt: "desc" },
      });

      const duplicatePairs: { type: string; contacts: any[] }[] = [];

      for (let i = 0; i < allContacts.length; i++) {
        for (let j = i + 1; j < allContacts.length; j++) {
          const a = allContacts[i]!;
          const b = allContacts[j]!;

          const nameMatch = a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
          const phoneA = a.contactNo?.replace(/[^\d+]/g, "");
          const phoneB = b.contactNo?.replace(/[^\d+]/g, "");
          const phoneMatch = Boolean(phoneA && phoneB && phoneA === phoneB);
          const emailA = a.email?.trim().toLowerCase();
          const emailB = b.email?.trim().toLowerCase();
          const emailMatch = Boolean(emailA && emailB && emailA === emailB);

          if (nameMatch && phoneMatch && emailA !== emailB) {
            duplicatePairs.push({
              type: "Same Name & Phone (Different Email)",
              contacts: [a, b],
            });
          } else if (nameMatch && emailMatch && phoneA !== phoneB) {
            duplicatePairs.push({
              type: "Same Name & Email (Different Phone)",
              contacts: [a, b],
            });
          }
        }
      }

      res.json({ duplicates: duplicatePairs });
    } catch (err) {
      next(err);
    }
  }
);

directoryRouter.get(
  "/errors",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const allContacts = await prisma.contact.findMany({
        where: userFilter,
        orderBy: { createdAt: "desc" },
      });

      const errorPairs: { type: string; contacts: any[] }[] = [];

      for (let i = 0; i < allContacts.length; i++) {
        for (let j = i + 1; j < allContacts.length; j++) {
          const a = allContacts[i]!;
          const b = allContacts[j]!;

          const nameMismatch = a.name.trim().toLowerCase() !== b.name.trim().toLowerCase();
          const phoneA = a.contactNo?.replace(/[^\d+]/g, "");
          const phoneB = b.contactNo?.replace(/[^\d+]/g, "");
          const phoneMatch = Boolean(phoneA && phoneB && phoneA === phoneB);
          const emailA = a.email?.trim().toLowerCase();
          const emailB = b.email?.trim().toLowerCase();
          const emailMatch = Boolean(emailA && emailB && emailA === emailB);

          if (nameMismatch && (phoneMatch || emailMatch)) {
            errorPairs.push({
              type: phoneMatch && emailMatch
                ? "Same Phone & Email with Different Names"
                : phoneMatch
                ? "Same Phone with Different Names"
                : "Same Email with Different Names",
              contacts: [a, b],
            });
          }
        }
      }

      res.json({ errors: errorPairs });
    } catch (err) {
      next(err);
    }
  }
);

const resolveSchema = z.object({
  keepId: z.string(),
  deleteId: z.string(),
  mergedName: z.string().trim().min(1),
  mergedContactNo: z.string().trim().optional().nullable(),
  mergedEmail: z.string().trim().optional().nullable(),
  mergedOthers: z.string().trim().optional().nullable(),
});

directoryRouter.post(
  "/resolve",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const payload = resolveSchema.parse(req.body);

      const updated = await prisma.contact.update({
        where: { id: payload.keepId },
        data: {
          name: payload.mergedName,
          contactNo: payload.mergedContactNo || null,
          email: payload.mergedEmail || null,
          others: payload.mergedOthers || null,
        },
      });

      await prisma.contact.delete({
        where: { id: payload.deleteId },
      });

      res.json({ ok: true, contact: updated, message: "Records successfully merged." });
    } catch (err) {
      next(err);
    }
  }
);

directoryRouter.delete(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const targetId = String(req.params.id);

      const contact = await prisma.contact.findUnique({
        where: { id: targetId },
      });

      if (!contact) {
        res.status(404).json({ error: "Contact not found" });
        return;
      }

      if (!isSuper && contact.userId !== authReq.auth.userId) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      await prisma.contact.delete({
        where: { id: targetId },
      });

      res.json({ ok: true, message: "Contact deleted." });
    } catch (err) {
      next(err);
    }
  }
);
