import { NextResponse } from "next/server";
import { clearAffiliateSessionCookie } from "@/lib/affiliate-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAffiliateSessionCookie(response);
  return response;
}
