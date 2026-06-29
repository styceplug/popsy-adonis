import { calculateCheckoutPaymentBreakdown, calculateTicketPaymentBreakdown } from "../src/lib/fees.ts";

const cases = [
  {
    name: "Early Bird",
    ticketSubtotalKobo: 300_000,
    expected: {
      transactionFeeKobo: 15_000,
      totalKobo: 315_000,
      organizerCommissionKobo: 7_500,
      adonisAmountKobo: 292_500,
      dreamAmountKobo: 22_500,
    },
  },
  {
    name: "Minimum fee guard",
    ticketSubtotalKobo: 100_000,
    expected: {
      transactionFeeKobo: 15_000,
      totalKobo: 115_000,
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
      organizerCommissionKobo: 3_750,
      adonisAmountKobo: 146_250,
      dreamAmountKobo: 18_750,
    },
  },
  {
    name: "Maximum fee guard",
    ticketSubtotalKobo: 20_000_000,
    expected: {
      transactionFeeKobo: 500_000,
      totalKobo: 20_500_000,
      organizerCommissionKobo: 500_000,
      adonisAmountKobo: 19_500_000,
      dreamAmountKobo: 1_000_000,
    },
  },
  {
    name: "VIP",
    ticketSubtotalKobo: 2_000_000,
    expected: {
      transactionFeeKobo: 100_000,
      totalKobo: 2_100_000,
      organizerCommissionKobo: 50_000,
      adonisAmountKobo: 1_950_000,
      dreamAmountKobo: 150_000,
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
  addOnOnly.transactionFeeKobo !== 35_000 ||
  addOnOnly.organizerCommissionKobo !== 0 ||
  addOnOnly.adonisAmountKobo !== 0 ||
  addOnOnly.dreamAmountKobo !== 35_000 ||
  addOnOnly.totalKobo !== 735_000
) {
  throw new Error(`Water gun add-on fee check failed: ${JSON.stringify(addOnOnly)}`);
}

console.log("Water gun add-on fee check passed", addOnOnly);
