import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

async function isValidToken(token: string): Promise<{ id: number; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: number; role: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isLoginPage = pathname === "/" || pathname.startsWith("/login");
  const isPublicAuth = pathname === "/api/auth/login" || pathname === "/api/auth/register";
  const isProtectedAuth = pathname === "/api/auth/me" || pathname === "/api/auth/logout";
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isApiRoute = pathname.startsWith("/api/");

  if (isPublicAuth) {
    const response = NextResponse.next();
    addSecurityHeaders(request, response);
    return response;
  }

  if (!token) {
    if (isLoginPage || isApiRoute) {
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
    return NextResponse.redirect(
      new URL(session.role === "admin" ? "/admin/dashboard" : "/student/dashboard", request.url)
    );
  }

  if (isAdminRoute && session.role !== "admin") {
    return NextResponse.redirect(new URL("/student/dashboard", request.url));
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

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"];
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      response.headers.set("Access-Control-Allow-Origin", origin || "*");
    }
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|\\.(?:png|svg|jpg|jpeg|gif|ico|woff2|css|js|json)$).*)"],
};
