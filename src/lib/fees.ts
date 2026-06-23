export const TRANSACTION_FEE_BPS = 500;
export const MAX_TRANSACTION_FEE_KOBO = 500_000;

export function calculateTransactionFee(subtotalKobo: number) {
  return Math.min(
    Math.round((subtotalKobo * TRANSACTION_FEE_BPS) / 10_000),
    MAX_TRANSACTION_FEE_KOBO,
  );
}

