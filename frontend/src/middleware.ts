import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("dealdrop_role")?.value;
  const url = request.nextUrl.clone();

  // Protect Dashboard (Retailer only)
  if (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/products")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (token !== "retailer") {
      url.pathname = "/deals";
      return NextResponse.redirect(url);
    }
  }

  // Protect Deals & Reservations (Consumer only, currently just deals)
  if (url.pathname.startsWith("/deals") || url.pathname.startsWith("/reservations")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Allow both for now, or just limit to consumer. The instructions say: "Access /deals while logged in as retailer -> allowed (consumers only guard later)".
    // So we don't enforce strictly `consumer` here yet.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/deals/:path*", "/reservations/:path*"],
};
