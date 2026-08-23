export type Customer = {
  id: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  city: string;
  tags: string[];
  eventCount: number;
  consentSms: boolean;
  consentEmail: boolean;
  lastContact: string;
};

export type EventRecord = {
  id: string;
  title: string;
  date: string;
  venue: string;
  audience: string;
  smsTemplate: string;
  emailSubject: string;
  status: "Draft" | "Scheduled" | "Sending" | "Completed";
};

export type Campaign = {
  id: string;
  name: string;
  channel: "SMS" | "Email";
  audienceSize: number;
  sent: number;
  failed: number;
  owner: string;
  launchedAt: string;
  status: "Draft" | "Queued" | "Sending" | "Completed";
};

export type DeviceStatus = {
  deviceName: string;
  phoneNumber: string;
  operator: string;
  status: "Online" | "Idle" | "Offline";
  lastSeen: string;
  queuedJobs: number;
  battery: string;
};

export type DeliveryLog = {
  id: string;
  customer: string;
  channel: "SMS" | "Email";
  campaign: string;
  timestamp: string;
  status: "Sent" | "Failed" | "Queued";
  detail: string;
};

export type Template = {
  id: string;
  name: string;
  channel: "SMS" | "Email";
  body: string;
  updatedAt: string;
};
