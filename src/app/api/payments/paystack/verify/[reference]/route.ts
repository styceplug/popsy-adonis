import { NextResponse } from "next/server";
import { fulfillSuccessfulTransaction } from "@/lib/fulfillment";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { reference },
    select: { status: true },
  });

  if (!transaction) {
    return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
  }

  if (transaction.status === "SUCCESS") {
    return NextResponse.json({ verified: true, fulfilled: false, reason: "Already fulfilled." });
  }

  const paystackTransaction = await verifyPaystackTransaction(reference);

  if (paystackTransaction.status !== "success") {
    return NextResponse.json({
      verified: false,
      status: paystackTransaction.status,
    });
  }

  const fulfillment = await fulfillSuccessfulTransaction(
    reference,
    { event: "manual.verify.success", data: paystackTransaction },
    paystackTransaction.paid_at,
  );

  return NextResponse.json({
    verified: true,
    ...fulfillment,
  });
}

