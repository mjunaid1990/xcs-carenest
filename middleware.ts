import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap edge guard: without a session cookie there is no point rendering the
 * dashboard shell (and a real 307 keeps crawlers and uptime checks honest).
 * The layout and every API still verify the session server-side.
 */
const SESSION_COOKIE = "carenest_session";

export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  const next = `${url.pathname}${url.search}`;
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
