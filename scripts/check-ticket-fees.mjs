import { calculateCheckoutPaymentBreakdown, calculateTicketPaymentBreakdown } from "../src/lib/fees.ts";

const cases = [
  {
    name: "Regular",
    ticketSubtotalKobo: 500_000,
    expected: {
      transactionFeeKobo: 17_800,
      totalKobo: 517_800,
      estimatedGatewayFeeKobo: 17_767,
      organizerCommissionKobo: 12_500,
      adonisAmountKobo: 487_500,
      dreamAmountKobo: 30_300,
    },
  },
  {
    name: "Minimum fee guard",
    ticketSubtotalKobo: 100_000,
    expected: {
      transactionFeeKobo: 15_000,
      totalKobo: 115_000,
      estimatedGatewayFeeKobo: 1_725,
      organizerCommissionKobo: 2_500,
      adonisAmountKobo: 97_500,
      dreamAmountKobo: 17_500,
    },
  },
  {
    name: "10:30PM Early Bird promo",
    ticketSubtotalKobo: 150_000,
    expected: {
      transactionFeeKobo: 15_000,
      totalKobo: 165_000,
      estimatedGatewayFeeKobo: 2_475,
      organizerCommissionKobo: 3_750,
      adonisAmountKobo: 146_250,
      dreamAmountKobo: 18_750,
    },
  },
  {
    name: "Maximum fee guard",
    ticketSubtotalKobo: 20_000_000,
    expected: {
      transactionFeeKobo: 200_000,
      totalKobo: 20_200_000,
      estimatedGatewayFeeKobo: 200_000,
      organizerCommissionKobo: 500_000,
      adonisAmountKobo: 19_500_000,
      dreamAmountKobo: 700_000,
    },
  },
  {
    name: "VIP",
    ticketSubtotalKobo: 2_000_000,
    expected: {
      transactionFeeKobo: 40_700,
      totalKobo: 2_040_700,
      estimatedGatewayFeeKobo: 40_611,
      organizerCommissionKobo: 50_000,
      adonisAmountKobo: 1_950_000,
      dreamAmountKobo: 90_700,
    },
  },
];

for (const testCase of cases) {
  const actual = calculateTicketPaymentBreakdown(testCase.ticketSubtotalKobo);

  for (const [key, expectedValue] of Object.entries(testCase.expected)) {
    if (actual[key] !== expectedValue) {
      throw new Error(
        `${testCase.name} ${key} expected ${expectedValue}, received ${actual[key]}`,
      );
    }
  }

  console.log(`${testCase.name} fee check passed`, actual);
}

const addOnOnly = calculateCheckoutPaymentBreakdown(0, 700_000);
if (
  addOnOnly.transactionFeeKobo !== 20_900 ||
  addOnOnly.estimatedGatewayFeeKobo !== 20_814 ||
  addOnOnly.organizerCommissionKobo !== 0 ||
  addOnOnly.adonisAmountKobo !== 0 ||
  addOnOnly.dreamAmountKobo !== 20_900 ||
  addOnOnly.totalKobo !== 720_900
) {
  throw new Error(`Water gun add-on fee check failed: ${JSON.stringify(addOnOnly)}`);
}

console.log("Water gun add-on fee check passed", addOnOnly);
