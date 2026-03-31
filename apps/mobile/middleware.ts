import { isMobilePhoneUserAgent } from "@lark-sso/device";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const desktopOrigin = process.env.DESKTOP_APP_URL;
  if (!desktopOrigin?.trim()) {
    return NextResponse.next();
  }

  const ua = request.headers.get("user-agent");
  if (isMobilePhoneUserAgent(ua)) {
    return NextResponse.next();
  }

  const target = normalizeOrigin(desktopOrigin);
  const dest = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    `${target}/`
  );
  return NextResponse.redirect(dest, 307);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
