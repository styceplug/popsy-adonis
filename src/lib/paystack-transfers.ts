/**
 * Paystack Transfers: pays affiliates out of the main Paystack balance.
 * Requires Transfers to be enabled on the account and transfer OTP switched off,
 * otherwise every payout stops at an OTP prompt nobody can answer.
 */

/** Paystack answered and said no. Safe to treat the request as not having happened. */
export class PaystackApiError extends Error {}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new PaystackApiError("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);

  // A 5xx tells us nothing about whether the transfer was created, so it must not be
  // reported as a clean rejection.
  if (response.status >= 500) {
    throw new Error(data?.message ?? `Paystack is unavailable (${response.status}).`);
  }

  if (!response.ok || !data?.status) {
    throw new PaystackApiError(data?.message ?? `Paystack request failed (${response.status}).`);
  }

  return data.data as T;
}

export type PaystackBank = { name: string; code: string };

let bankCache: { banks: PaystackBank[]; expiresAt: number } | null = null;

export async function listBanks() {
  if (bankCache && bankCache.expiresAt > Date.now()) return bankCache.banks;

  const data = await paystackRequest<Array<{ name: string; code: string; active?: boolean }>>(
    "/bank?currency=NGN&perPage=100",
  );
  const seen = new Set<string>();
  const banks = data
    .filter((bank) => bank.active !== false && bank.code && !seen.has(bank.code) && seen.add(bank.code))
    .map((bank) => ({ name: bank.name, code: bank.code }))
    .sort((a, b) => a.name.localeCompare(b.name));

  bankCache = { banks, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  return banks;
}

export function resolveBankAccount(accountNumber: string, bankCode: string) {
  return paystackRequest<{ account_number: string; account_name: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
}

export function createTransferRecipient(input: { name: string; accountNumber: string; bankCode: string }) {
  return paystackRequest<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: "NGN",
    }),
  });
}

export type PaystackTransfer = {
  status: string;
  transfer_code?: string;
  reference?: string;
  reason?: string;
  gateway_response?: string;
};

export function initiateTransfer(input: {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason: string;
}) {
  return paystackRequest<PaystackTransfer>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: input.amountKobo,
      recipient: input.recipientCode,
      reference: input.reference,
      reason: input.reason,
      currency: "NGN",
    }),
  });
}

export function verifyTransfer(reference: string) {
  return paystackRequest<PaystackTransfer>(`/transfer/verify/${encodeURIComponent(reference)}`);
}
