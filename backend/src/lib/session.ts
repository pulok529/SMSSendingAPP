import { createHmac, timingSafeEqual } from "crypto";
import { env } from "../config/env";

export const authCookieName = "pulse_session";
const sessionTtlSeconds = 60 * 60 * 24 * 7;

export type AuthSession = {
  userId: string;
  email: string;
  role: "ADMIN" | "SENDER";
  exp: number;
};

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sign(payload: string): string {
  return base64Url(createHmac("sha256", env.SESSION_SECRET).update(payload).digest());
}

export function createSessionToken(
  session: Omit<AuthSession, "exp">
): string {
  const payload = base64Url(
    JSON.stringify({
      ...session,
      exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds,
    })
  );

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): AuthSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString(
        "utf8"
      )
    ) as AuthSession;

    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    if (decoded.role !== "ADMIN" && decoded.role !== "SENDER") {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function readCookie(
  cookieHeader: string | undefined,
  name: string
): string | undefined {
  return cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function sessionCookie(token: string): string {
  const secure = env.COOKIE_SECURE ? "; Secure" : "";

  return `${authCookieName}=${token}; Max-Age=${sessionTtlSeconds}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function clearSessionCookie(): string {
  const secure = env.COOKIE_SECURE ? "; Secure" : "";

  return `${authCookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`;
}
