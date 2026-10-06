import { NextResponse, type NextRequest } from "next/server";
import { getAffiliateFromRequest } from "@/lib/affiliate-auth";
import { listBanks } from "@/lib/paystack-transfers";

export async function GET(request: NextRequest) {
  const affiliate = await getAffiliateFromRequest(request);
  if (!affiliate) return NextResponse.json({ message: "Log in first." }, { status: 401 });

  try {
    return NextResponse.json({ banks: await listBanks() });
  } catch (error) {
    console.error("Unable to load banks", error);
    return NextResponse.json({ message: "Unable to load the bank list. Try again." }, { status: 502 });
  }
}
