export const CUSTOMER_TRANSACTION_FEE_BPS = 500;
export const ORGANIZER_COMMISSION_BPS = 250;
export const MIN_TRANSACTION_FEE_KOBO = 15_000;
export const MAX_TRANSACTION_FEE_KOBO = 500_000;

export function calculateBasisPointAmount(amountKobo: number, basisPoints: number) {
  return Math.round((amountKobo * basisPoints) / 10_000);
}

export function calculateTransactionFee(ticketSubtotalKobo: number) {
  if (ticketSubtotalKobo <= 0) return 0;

  return Math.min(
    Math.max(
      calculateBasisPointAmount(ticketSubtotalKobo, CUSTOMER_TRANSACTION_FEE_BPS),
      MIN_TRANSACTION_FEE_KOBO,
    ),
    MAX_TRANSACTION_FEE_KOBO,
  );
}

export function calculateOrganizerCommission(ticketSubtotalKobo: number) {
  return calculateBasisPointAmount(ticketSubtotalKobo, ORGANIZER_COMMISSION_BPS);
}

export function calculateTicketPaymentBreakdown(ticketSubtotalKobo: number) {
  return calculateCheckoutPaymentBreakdown(ticketSubtotalKobo, ticketSubtotalKobo);
}

export function calculateCheckoutPaymentBreakdown(ticketSubtotalKobo: number, feeSubtotalKobo = ticketSubtotalKobo) {
  const transactionFeeKobo = calculateTransactionFee(feeSubtotalKobo);
  const organizerCommissionKobo = calculateOrganizerCommission(ticketSubtotalKobo);
  const adonisAmountKobo = ticketSubtotalKobo - organizerCommissionKobo;
  const dreamAmountKobo = transactionFeeKobo + organizerCommissionKobo;
  const totalKobo = feeSubtotalKobo + transactionFeeKobo;

  return {
    ticketSubtotalKobo,
    feeSubtotalKobo,
    transactionFeeKobo,
    organizerCommissionKobo,
    adonisAmountKobo,
    dreamAmountKobo,
    totalKobo,
  };
}
