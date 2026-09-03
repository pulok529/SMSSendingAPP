import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { findMatchingContact } from "./directory";

export const groupsRouter = Router();

groupsRouter.get(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const isSuper = authReq.auth.role === "SUPERADMIN";
      const userFilter = isSuper ? {} : { userId: authReq.auth.userId };

      const allGroups = await prisma.contactGroup.findMany({
        where: userFilter,
        include: {
          _count: {
            select: { members: true },
          },
        },
        orderBy: [
          { rank: "asc" },
          { createdAt: "desc" },
        ],
      });

      const ranked = allGroups.filter((g) => g.rank !== null && g.rank !== undefined);
      const general = allGroups.filter((g) => g.rank === null || g.rank === undefined);

      res.json({ ranked, general, all: allGroups });
    } catch (err) {
      next(err);
    }
  }
);

const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group Name is required"),
  details: z.string().trim().optional(),
  code: z.string().trim().optional(),
  rank: z.number().int().min(1).optional().nullable(),
});

groupsRouter.post(
  "/",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const payload = createGroupSchema.parse(req.body);

      const created = await prisma.contactGroup.create({
        data: {
          userId: authReq.auth.userId,
          name: payload.name,
          details: payload.details || null,
          code: payload.code || null,
          rank: payload.rank || null,
        },
      });

      res.status(201).json({ ok: true, group: created });
    } catch (err) {
      next(err);
    }
  }
);

const updateRanksSchema = z.object({
  rankedGroupIds: z.array(z.string()),
  generalGroupIds: z.array(z.string()).optional(),
});

groupsRouter.put(
  "/ranks",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const payload = updateRanksSchema.parse(req.body);

      await Promise.all(
        payload.rankedGroupIds.map((id, index) =>
          prisma.contactGroup.update({
            where: { id },
            data: { rank: index + 1 },
          })
        )
      );

      if (payload.generalGroupIds && payload.generalGroupIds.length > 0) {
        await Promise.all(
          payload.generalGroupIds.map((id) =>
            prisma.contactGroup.update({
              where: { id },
              data: { rank: null },
            })
          )
        );
      }

      res.json({ ok: true, message: "Group ranks updated successfully." });
    } catch (err) {
      next(err);
    }
  }
);

groupsRouter.get(
  "/:id/members",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT", "SENDER"]),
  async (req, res, next) => {
    try {
      const targetId = String(req.params.id);
      const group = await prisma.contactGroup.findUnique({
        where: { id: targetId },
        include: {
          members: {
            include: {
              contact: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const contacts = group.members.map((m: any) => m.contact);
      res.json({ group, contacts, total: contacts.length });
    } catch (err) {
      next(err);
    }
  }
);

const addSingleContactSchema = z.object({
  contactId: z.string().optional(),
  name: z.string().trim().min(1),
  contactNo: z.string().trim().optional(),
  email: z.string().trim().optional(),
  others: z.string().trim().optional(),
  autoCreateDirectory: z.boolean().default(false),
});

groupsRouter.post(
  "/:id/contacts",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const groupId = String(req.params.id);
      const payload = addSingleContactSchema.parse(req.body);

      let targetContactId = payload.contactId;

      if (!targetContactId) {
        const cleanPhone = payload.contactNo ? payload.contactNo.replace(/[^\d+]/g, "") : null;
        const cleanEmail = payload.email?.trim().toLowerCase() || null;

        const match = await findMatchingContact(authReq.auth.userId, {
          name: payload.name,
          contactNo: cleanPhone,
          email: cleanEmail,
        });

        if (match) {
          targetContactId = match.id;
        } else if (payload.autoCreateDirectory) {
          const newContact = await prisma.contact.create({
            data: {
              userId: authReq.auth.userId,
              name: payload.name,
              contactNo: cleanPhone,
              email: cleanEmail,
              others: payload.others || null,
            },
          });
          targetContactId = newContact.id;
        } else {
          res.status(400).json({
            error: "Contact not in phone directory.",
            requiresDirectoryPrompt: true,
          });
          return;
        }
      }

      const existingMember = await prisma.groupMember.findUnique({
        where: {
          groupId_contactId: {
            groupId,
            contactId: targetContactId,
          },
        },
      });

      if (existingMember) {
        res.status(200).json({
          ok: true,
          alreadyMember: true,
          message: "Contact is already a member of this group.",
        });
        return;
      }

      await prisma.groupMember.create({
        data: {
          groupId,
          contactId: targetContactId,
        },
      });

      const updatedGroup = await prisma.contactGroup.findUnique({
        where: { id: groupId },
        include: { _count: { select: { members: true } } },
      });

      res.status(201).json({
        ok: true,
        alreadyMember: false,
        group: updatedGroup,
        contactId: targetContactId,
      });
    } catch (err) {
      next(err);
    }
  }
);

const addFromJobSchema = z.object({
  campaignId: z.string().min(1),
});

groupsRouter.post(
  "/:id/from-job",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const groupId = String(req.params.id);
      const { campaignId } = addFromJobSchema.parse(req.body);

      const deliveries = await prisma.delivery.findMany({
        where: { campaignId },
        include: { customer: true },
      });

      let addedCount = 0;
      let existingCount = 0;

      for (const d of deliveries) {
        const phone = d.recipientPhone || d.customer.mobile;
        const email = d.recipientEmail || d.customer.email;
        const name = d.customer.name;

        let contact = await findMatchingContact(authReq.auth.userId, {
          name,
          contactNo: phone,
          email,
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              userId: authReq.auth.userId,
              name,
              contactNo: phone ? phone.replace(/[^\d+]/g, "") : null,
              email: email?.trim().toLowerCase() || null,
              others: d.customer.company || null,
            },
          });
        }

        try {
          await prisma.groupMember.create({
            data: {
              groupId,
              contactId: contact.id,
            },
          });
          addedCount++;
        } catch (_) {
          existingCount++;
        }
      }

      res.json({
        ok: true,
        addedCount,
        existingCount,
        totalInJob: deliveries.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

const addFromExcelSchema = z.object({
  contacts: z.array(
    z.object({
      name: z.string().trim().min(1),
      contactNo: z.string().trim().optional(),
      email: z.string().trim().optional(),
      others: z.string().trim().optional(),
    })
  ).min(1),
  autoCreateDirectory: z.boolean().default(true),
});

groupsRouter.post(
  "/:id/from-excel",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const groupId = String(req.params.id);
      const { contacts, autoCreateDirectory } = addFromExcelSchema.parse(req.body);

      let addedCount = 0;
      let skippedCount = 0;

      for (const item of contacts) {
        const cleanPhone = item.contactNo ? item.contactNo.replace(/[^\d+]/g, "") : null;
        const cleanEmail = item.email?.trim().toLowerCase() || null;

        let contact = await findMatchingContact(authReq.auth.userId, {
          name: item.name,
          contactNo: cleanPhone,
          email: cleanEmail,
        });

        if (!contact) {
          if (autoCreateDirectory) {
            contact = await prisma.contact.create({
              data: {
                userId: authReq.auth.userId,
                name: item.name,
                contactNo: cleanPhone,
                email: cleanEmail,
                others: item.others || null,
              },
            });
          } else {
            skippedCount++;
            continue;
          }
        }

        try {
          await prisma.groupMember.create({
            data: {
              groupId,
              contactId: contact.id,
            },
          });
          addedCount++;
        } catch (_) {
          skippedCount++;
        }
      }

      res.json({
        ok: true,
        addedCount,
        skippedCount,
        total: contacts.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

groupsRouter.delete(
  "/:id/members/:contactId",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const targetGroupId = String(req.params.id);
      const targetContactId = String(req.params.contactId);

      await prisma.groupMember.deleteMany({
        where: {
          groupId: targetGroupId,
          contactId: targetContactId,
        },
      });

      res.json({ ok: true, message: "Member removed from group." });
    } catch (err) {
      next(err);
    }
  }
);

groupsRouter.delete(
  "/:id",
  requireAuth(["SUPERADMIN", "ADMIN", "CLIENT"]),
  async (req, res, next) => {
    try {
      const targetId = String(req.params.id);

      await prisma.contactGroup.delete({
        where: { id: targetId },
      });

      res.json({ ok: true, message: "Group deleted." });
    } catch (err) {
      next(err);
    }
  }
);
