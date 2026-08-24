import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/quick-send",
  "/users",
  "/imports",
  "/customers",
  "/events",
  "/campaigns",
  "/templates",
  "/device",
  "/logs",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSession = request.cookies.has("pulse_session");

  // Root route: redirect to /login if unauthenticated, or /dashboard if authenticated
  if (pathname === "/") {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Unauthenticated user trying to access protected page
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated user trying to access /login
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/quick-send/:path*",
    "/users/:path*",
    "/imports/:path*",
    "/customers/:path*",
    "/events/:path*",
    "/campaigns/:path*",
    "/templates/:path*",
    "/device/:path*",
    "/logs/:path*",
    "/login",
  ],
};
