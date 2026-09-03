import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";

export async function getTenantMailer(userId: string) {
  const config = await prisma.emailConfig.findUnique({
    where: { userId },
  });

  if (!config || !config.host || !config.fromEmail) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure || config.port === 465,
    auth: config.username && config.password ? {
      user: config.username,
      pass: config.password,
    } : undefined,
  });

  return {
    transporter,
    fromEmail: config.fromEmail,
    fromName: config.fromName || "Pulse Sender",
  };
}

export async function sendLiveEmail(
  userId: string,
  to: string,
  subject: string,
  htmlOrText: string
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const mailer = await getTenantMailer(userId);

    if (!mailer) {
      return { ok: false, error: "SMTP Email Settings not configured for this account. Please configure SMTP in Email Settings." };
    }

    const info = await mailer.transporter.sendMail({
      from: `"${mailer.fromName}" <${mailer.fromEmail}>`,
      to,
      subject,
      text: htmlOrText,
      html: htmlOrText.replace(/\n/g, "<br>"),
    });

    return { ok: true, messageId: info.messageId };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to transmit email via SMTP server." };
  }
}
