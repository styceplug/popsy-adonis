import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAffiliateSessionToken, setAffiliateSessionCookie, verifyPassword } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
  }

  const affiliate = await prisma.affiliate.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  if (!affiliate || !verifyPassword(parsed.data.password, affiliate.passwordHash)) {
    return NextResponse.json({ message: "Incorrect email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAffiliateSessionCookie(response, createAffiliateSessionToken(affiliate.id));
  return response;
}
