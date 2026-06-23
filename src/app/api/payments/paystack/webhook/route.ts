import { NextResponse } from "next/server";
import { fulfillSuccessfulTransaction } from "@/lib/fulfillment";
import { verifyPaystackSignature } from "@/lib/paystack";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data.reference;
  await fulfillSuccessfulTransaction(reference, event, event.data.paid_at);

  return NextResponse.json({ received: true });
}
