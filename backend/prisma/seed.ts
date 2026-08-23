import "dotenv/config";
import {
  CampaignChannel,
  CampaignStatus,
  DeliveryStatus,
  DeviceStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  const passwordHash = await hashPassword("admin12345");
  const user = await prisma.user.upsert({
    where: { email: "pulak@example.com" },
    update: {
      name: "Pulak",
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Pulak",
      email: "pulak@example.com",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.device.upsert({
    where: { id: "seed-device" },
    update: {
      status: DeviceStatus.ONLINE,
      queuedJobs: 43,
      battery: "78%",
      lastSeenAt: new Date("2026-04-19T11:56:00Z"),
    },
    create: {
      id: "seed-device",
      userId: user.id,
      deviceName: "Pulak's Galaxy A55",
      phoneNumber: "+61 422 111 909",
      operator: "Telstra AU",
      status: DeviceStatus.ONLINE,
      queuedJobs: 43,
      battery: "78%",
      lastSeenAt: new Date("2026-04-19T11:56:00Z"),
    },
  });

  const customerRecords = await Promise.all(
    [
      {
        name: "Olivia Carter",
        company: "South Coast Realty",
        mobile: "+61 412 334 810",
        email: "olivia@southcoastrealty.au",
        city: "Sydney",
        tags: ["VIP", "Event"],
        eventCount: 4,
        consentSms: true,
        consentEmail: true,
      },
      {
        name: "Amelia Brooks",
        company: "Brookside Dental",
        mobile: "+61 401 258 901",
        email: "amelia@brookside.au",
        city: "Brisbane",
        tags: ["Repeat", "Email"],
        eventCount: 5,
        consentSms: true,
        consentEmail: true,
      },
      {
        name: "Charlotte Evans",
        company: "Sunline Events",
        mobile: "+61 478 222 631",
        email: "charlotte@sunlineevents.au",
        city: "Adelaide",
        tags: ["VIP", "Repeat"],
        eventCount: 7,
        consentSms: true,
        consentEmail: true,
      },
    ].map((customer) =>
      prisma.customer.upsert({
        where: { email: customer.email },
        update: customer,
        create: customer,
      })
    )
  );

  const event = await prisma.event.upsert({
    where: { id: "seed-event" },
    update: {
      title: "Autumn VIP Preview",
      venue: "Sydney Showroom",
      audience: "VIP Customers",
      smsTemplate:
        "Hi {{name}}, you're invited to our Autumn VIP Preview on 28 April.",
      emailSubject: "Your VIP invitation for 28 April",
      status: "Scheduled",
    },
    create: {
      id: "seed-event",
      userId: user.id,
      title: "Autumn VIP Preview",
      date: new Date("2026-04-28T18:30:00Z"),
      venue: "Sydney Showroom",
      audience: "VIP Customers",
      smsTemplate:
        "Hi {{name}}, you're invited to our Autumn VIP Preview on 28 April.",
      emailSubject: "Your VIP invitation for 28 April",
      status: "Scheduled",
    },
  });

  const campaign = await prisma.campaign.upsert({
    where: { id: "seed-campaign" },
    update: {
      name: "Autumn VIP SMS",
      audienceSize: 240,
      sentCount: 197,
      failedCount: 5,
      status: CampaignStatus.SENDING,
      launchedAt: new Date("2026-04-19T10:20:00Z"),
    },
    create: {
      id: "seed-campaign",
      userId: user.id,
      eventId: event.id,
      name: "Autumn VIP SMS",
      channel: CampaignChannel.SMS,
      audienceSize: 240,
      sentCount: 197,
      failedCount: 5,
      status: CampaignStatus.SENDING,
      launchedAt: new Date("2026-04-19T10:20:00Z"),
    },
  });

  await prisma.delivery.upsert({
    where: { id: "seed-delivery" },
    update: {
      status: DeliveryStatus.SENT,
      detail: "Delivered through device Pulak's Galaxy A55",
    },
    create: {
      id: "seed-delivery",
      customerId: customerRecords[0].id,
      campaignId: campaign.id,
      channel: CampaignChannel.SMS,
      status: DeliveryStatus.SENT,
      detail: "Delivered through device Pulak's Galaxy A55",
    },
  });

  await prisma.delivery.upsert({
    where: { id: "seed-delivery-pending-1" },
    update: {
      status: DeliveryStatus.PENDING,
      detail:
        "Hi Olivia, this is a live SMS test from Pulse Dispatch. Reply STOP to opt out.",
    },
    create: {
      id: "seed-delivery-pending-1",
      customerId: customerRecords[0].id,
      campaignId: campaign.id,
      channel: CampaignChannel.SMS,
      status: DeliveryStatus.PENDING,
      detail:
        "Hi Olivia, this is a live SMS test from Pulse Dispatch. Reply STOP to opt out.",
    },
  });

  await prisma.delivery.upsert({
    where: { id: "seed-delivery-pending-2" },
    update: {
      status: DeliveryStatus.PENDING,
      detail:
        "Hi Amelia, your event reminder from Pulse Dispatch is queued for Android delivery.",
    },
    create: {
      id: "seed-delivery-pending-2",
      customerId: customerRecords[1].id,
      campaignId: campaign.id,
      channel: CampaignChannel.SMS,
      status: DeliveryStatus.PENDING,
      detail:
        "Hi Amelia, your event reminder from Pulse Dispatch is queued for Android delivery.",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
