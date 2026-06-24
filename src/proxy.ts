import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const pathname = request.nextUrl.pathname;

  if (host === "admin.popsyadonis.com" && pathname === "/") {
    return NextResponse.rewrite(new URL("/admin", request.url));
  }

  if (host === "checkin.popsyadonis.com" && pathname === "/") {
    return NextResponse.rewrite(new URL("/admin/checkin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.jpg|.*\\..*).*)"],
};
