import { NextFunction, Request, Response } from "express";
import { AuthSession, authCookieName, readCookie, verifySessionToken } from "../lib/session";

export type AuthenticatedRequest = Request & {
  auth: AuthSession;
};

export function requireAuth(allowedRoles: AuthSession["role"][] = ["ADMIN", "SENDER"]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const token = readCookie(request.headers.cookie, authCookieName);
    const session = verifySessionToken(token);

    if (!session) {
      response.status(401).json({ error: "Login required." });
      return;
    }

    if (!allowedRoles.includes(session.role)) {
      response.status(403).json({ error: "You do not have permission for this action." });
      return;
    }

    (request as AuthenticatedRequest).auth = session;
    next();
  };
}
