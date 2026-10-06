import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  createAffiliateSessionToken,
  generateAffiliateCode,
  hashPassword,
  setAffiliateSessionCookie,
} from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  fullName: z.string().trim().min(3).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter your full name, a valid email, phone number, and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.affiliate.findUnique({ where: { email }, select: { id: true } });

  if (existing) {
    return NextResponse.json({ message: "An affiliate account already exists for this email. Log in instead." }, { status: 409 });
  }

  const affiliate = await prisma.affiliate.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      passwordHash: hashPassword(parsed.data.password),
      code: await generateAffiliateCode(parsed.data.fullName),
    },
  });

  const response = NextResponse.json({ ok: true }, { status: 201 });
  setAffiliateSessionCookie(response, createAffiliateSessionToken(affiliate.id));
  return response;
}
