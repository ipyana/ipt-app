import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32 || raw.includes("change-me") || raw === "fallback-secret") {
    throw new Error("JWT_SECRET is not configured with a strong value");
  }
  return new TextEncoder().encode(raw);
}

const secret = getSecret();

async function isValidToken(token: string): Promise<{ id: number; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: number; role: string };
  } catch {
    return null;
  }
}

const ADMIN_LIKE_ROLES = ["admin", "coordinator"];
const SUPER_ADMIN_ROLES = ["super_admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Allow static assets (images, fonts, css, js) to bypass auth
  if (/\.(png|svg|jpg|jpeg|gif|ico|woff2|css|js|json)$/.test(pathname)) {
    const response = NextResponse.next();
    addSecurityHeaders(request, response);
    return response;
  }

  const isLoginPage = pathname === "/" || pathname.startsWith("/login");
  const isPublicPage = pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/staff/register" || pathname === "/activate-account";
  const isPublicAuth = pathname === "/api/auth/login" || pathname === "/api/auth/register"
    || pathname === "/api/auth/forgot-password" || pathname === "/api/auth/reset-password" || pathname === "/api/auth/staff-register";
  const isProtectedAuth = pathname === "/api/auth/me" || pathname === "/api/auth/logout";
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isSuperAdminRoute = pathname.startsWith("/super-admin") || pathname.startsWith("/api/super-admin");
  const isStaffRoute = pathname.startsWith("/staff") || pathname.startsWith("/api/staff");
  const isApiRoute = pathname.startsWith("/api/");

  if (isPublicAuth) {
    const response = NextResponse.next();
    addSecurityHeaders(request, response);
    return response;
  }

  if (!token) {
    if (isLoginPage || isPublicPage || isApiRoute) {
      const response = NextResponse.next();
      addSecurityHeaders(request, response);
      return response;
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  const session = await isValidToken(token);

  if (!session) {
    const response = isLoginPage || isProtectedAuth
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("token", "", { maxAge: 0, path: "/" });
    return response;
  }

  if (isProtectedAuth) {
    const response = NextResponse.next();
    addSecurityHeaders(request, response);
    return response;
  }

  if (isLoginPage) {
    if (session.role === "super_admin") {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
    if (ADMIN_LIKE_ROLES.includes(session.role)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (session.role === "staff") {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
    return NextResponse.redirect(new URL("/student/dashboard", request.url));
  }

  if (isSuperAdminRoute && session.role !== "super_admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminPage && !ADMIN_LIKE_ROLES.includes(session.role) && session.role !== "super_admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminApi && !["admin", "coordinator", "super_admin"].includes(session.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isStaffRoute && session.role !== "staff") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();
  addSecurityHeaders(request, response);
  return response;
}

function addSecurityHeaders(request: NextRequest, response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"].filter(Boolean);
    if (allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Vary", "Origin");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|\\.(?:png|svg|jpg|jpeg|gif|ico|woff2|css|js|json)$).*)"],
};
