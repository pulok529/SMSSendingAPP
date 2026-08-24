import { ReactNode } from "react";
import { headers } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";

const routeMeta: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Campaign command center",
    description:
      "Track imports, customer readiness, live device dispatch, and upcoming event communication from one operational dashboard.",
  },
  "/quick-send": {
    title: "Instant SMS Dispatch",
    description:
      "Quickly send SMS messages to one or multiple recipients from an Excel spreadsheet or manual list without creating formal events.",
  },
  "/users": {
    title: "User & Client Management",
    description:
      "Create client accounts, configure profiles, toggle access status, and monitor linked Android sender activity.",
  },
  "/imports": {
    title: "Import customer spreadsheets",
    description:
      "Bring in customer data from Excel, preview the rows, and prepare clean lists for event messaging and follow-up campaigns.",
  },
  "/customers": {
    title: "Customer directory",
    description:
      "Review every customer record, consent status, and event activity before launching bulk SMS or email sends.",
  },
  "/events": {
    title: "Event planning",
    description:
      "Create event records, connect invite messaging, and keep your audience lists aligned with each event schedule.",
  },
  "/campaigns": {
    title: "Campaign builder",
    description:
      "Prepare SMS and email campaigns, choose recipients, preview copy, and trigger sending through the linked delivery systems.",
  },
  "/templates": {
    title: "Message templates",
    description:
      "Save repeatable SMS and email copy with placeholders so your team can launch event updates faster and more consistently.",
  },
  "/device": {
    title: "Phone bridge status",
    description:
      "Monitor the Android companion device that will send SMS from your own mobile number once we connect the mobile app.",
  },
  "/logs": {
    title: "Delivery logs",
    description:
      "Audit campaign history, inspect failures, and confirm which customers were reached by SMS or email.",
  },
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/dashboard";
  const meta = routeMeta[pathname] ?? routeMeta["/dashboard"];

  return (
    <AppShell
      pathname={pathname}
      title={meta.title}
      description={meta.description}
    >
      {children}
    </AppShell>
  );
}
