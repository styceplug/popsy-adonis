import crypto from "node:crypto";
import { getAppBaseUrl } from "@/lib/app-url";

export function makePaymentReference() {
  return `ADONIS_${Date.now()}_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

export function calculateDeveloperFee(totalKobo: number) {
  const basisPoints = Number(process.env.DEVELOPER_COMMISSION_BPS ?? 1000);
  return Math.round((totalKobo * basisPoints) / 10_000);
}

export async function initializePaystackTransaction(payload: {
  email: string;
  amount: number;
  reference: string;
  orderId: string;
  developerFeeKobo: number;
  adonisAmountKobo: number;
  transactionFeeKobo?: number;
}) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    throw new Error("PAYSTACK_SECRET_KEY must be a valid Paystack secret key.");
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email,
      amount: payload.amount,
      reference: payload.reference,
      currency: "NGN",
      callback_url: `${getAppBaseUrl()}/checkout/success?reference=${payload.reference}`,
      split_code: process.env.PAYSTACK_POPSY_ADONIS_SPLIT_CODE ?? process.env.PAYSTACK_ADONIS_SPLIT_CODE,
      metadata: {
        orderId: payload.orderId,
        developerFeeKobo: payload.developerFeeKobo,
        adonisAmountKobo: payload.adonisAmountKobo,
        transactionFeeKobo: payload.transactionFeeKobo ?? payload.developerFeeKobo,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    const message = data.message === "Invalid key"
      ? "Paystack rejected the secret key. Confirm or regenerate the test secret key in your Paystack dashboard."
      : data.message;

    throw new Error(message ?? "Unable to initialize Paystack transaction.");
  }

  return data.data as {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message ?? "Unable to verify Paystack transaction.");
  }

  return data.data as {
    status: "success" | "failed" | "abandoned" | "ongoing" | string;
    reference: string;
    amount?: number;
    currency?: string;
    paid_at?: string;
  };
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!process.env.PAYSTACK_SECRET_KEY || !signature) return false;

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(signature, "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
