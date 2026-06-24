import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { clearAdminSessionCookie, getAdminSessionFromRequest } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  const response = NextResponse.json({ ok: true });
  clearAdminSessionCookie(response);

  if (session) {
    await createAdminAuditLog({
      actorName: session.name,
      action: "admin.logout",
      entityType: "AdminSession",
      request,
    });
  }

  return response;
}
