import { NextResponse, type NextRequest } from "next/server";

/**
 * Case-insensitive URLs. A flyer or a shul announcement gets typed as
 * 4minimset.com/Baltimore or /HE; those should land, not 404.
 * Order codes are excluded (they are uppercase by design).
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (/[A-Z]/.test(pathname) && !pathname.startsWith("/order/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|img|api|.*\\..*).*)"],
};
