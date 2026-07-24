export const BASE_TRANSACTION_FEE_KOBO = 15_000;
export const ORGANIZER_COMMISSION_BPS = 250;
export const ESTIMATED_GATEWAY_FEE_BPS = 150;
export const ESTIMATED_GATEWAY_FLAT_FEE_KOBO = 10_000;
export const ESTIMATED_GATEWAY_FLAT_FEE_THRESHOLD_KOBO = 250_000;
export const ESTIMATED_GATEWAY_FEE_CAP_KOBO = 200_000;

export function calculateBasisPointAmount(amountKobo: number, basisPoints: number) {
  return Math.round((amountKobo * basisPoints) / 10_000);
}

export function roundUpToWholeNaira(amountKobo: number) {
  return Math.ceil(amountKobo / 100) * 100;
}

export function calculateEstimatedGatewayFee(amountChargedKobo: number) {
  if (amountChargedKobo <= 0) return 0;

  const percentageFeeKobo = calculateBasisPointAmount(amountChargedKobo, ESTIMATED_GATEWAY_FEE_BPS);
  const flatFeeKobo = amountChargedKobo >= ESTIMATED_GATEWAY_FLAT_FEE_THRESHOLD_KOBO
    ? ESTIMATED_GATEWAY_FLAT_FEE_KOBO
    : 0;

  return Math.min(percentageFeeKobo + flatFeeKobo, ESTIMATED_GATEWAY_FEE_CAP_KOBO);
}

export function calculateTransactionFee(subtotalKobo: number) {
  if (subtotalKobo <= 0) return 0;

  let transactionFeeKobo = BASE_TRANSACTION_FEE_KOBO;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const estimatedGatewayFeeKobo = calculateEstimatedGatewayFee(subtotalKobo + transactionFeeKobo);
    const nextTransactionFeeKobo = roundUpToWholeNaira(
      Math.max(BASE_TRANSACTION_FEE_KOBO, estimatedGatewayFeeKobo),
    );

    if (nextTransactionFeeKobo === transactionFeeKobo) return transactionFeeKobo;
    transactionFeeKobo = nextTransactionFeeKobo;
  }

  return transactionFeeKobo;
}

export function calculateOrganizerCommission(ticketSubtotalKobo: number) {
  return calculateBasisPointAmount(ticketSubtotalKobo, ORGANIZER_COMMISSION_BPS);
}

export function calculateTicketPaymentBreakdown(ticketSubtotalKobo: number) {
  return calculateCheckoutPaymentBreakdown(ticketSubtotalKobo, ticketSubtotalKobo);
}

export function calculateCheckoutPaymentBreakdown(ticketSubtotalKobo: number, feeSubtotalKobo = ticketSubtotalKobo) {
  const transactionFeeKobo = calculateTransactionFee(feeSubtotalKobo);
  const estimatedGatewayFeeKobo = calculateEstimatedGatewayFee(feeSubtotalKobo + transactionFeeKobo);
  const organizerCommissionKobo = calculateOrganizerCommission(ticketSubtotalKobo);
  const adonisAmountKobo = ticketSubtotalKobo - organizerCommissionKobo;
  const dreamAmountKobo = transactionFeeKobo + organizerCommissionKobo;
  const totalKobo = feeSubtotalKobo + transactionFeeKobo;

  return {
    ticketSubtotalKobo,
    feeSubtotalKobo,
    transactionFeeKobo,
    estimatedGatewayFeeKobo,
    organizerCommissionKobo,
    adonisAmountKobo,
    dreamAmountKobo,
    totalKobo,
  };
}
