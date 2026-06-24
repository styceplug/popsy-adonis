import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { createAdminSessionToken, isValidAdminLogin, setAdminSessionCookie } from "@/lib/admin-auth";

const loginSchema = z.object({
  name: z.string().min(2),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Enter your name and admin password." }, { status: 400 });
  }

  const name = parsed.data.name.trim();

  if (!isValidAdminLogin(name, parsed.data.password)) {
    return NextResponse.json({ message: "Invalid admin password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, name });
  setAdminSessionCookie(response, createAdminSessionToken(name));

  await createAdminAuditLog({
    actorName: name,
    action: "admin.login",
    entityType: "AdminSession",
    metadata: { name },
    request,
  });

  return response;
}
