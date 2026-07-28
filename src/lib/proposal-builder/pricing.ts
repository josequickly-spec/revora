import type { ProposalPricing, ProposalPricingInput } from "./contracts.ts";
import { PROPOSAL_PRICING_VERSION } from "./versions.ts";

function safeNumber(value: bigint) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("money_overflow");
  return Number(value);
}

function percentage(amount: bigint, basisPoints: number) {
  return (amount * BigInt(basisPoints) + BigInt(5_000)) / BigInt(10_000);
}

export function calculateProposalPricing(input: ProposalPricingInput): ProposalPricing {
  const subtotal = input.lineItems.reduce((sum, item) => sum + BigInt(item.quantity) * BigInt(item.unitAmountMinor), BigInt(0));
  const discount = input.discount.type === "percentage"
    ? percentage(subtotal, Math.min(input.discount.value, 10_000))
    : input.discount.type === "fixed" ? BigInt(input.discount.value) : BigInt(0);
  const boundedDiscount = discount > subtotal ? subtotal : discount;
  const taxableBase = subtotal - boundedDiscount;
  const tax = percentage(taxableBase, input.taxRateBasisPoints);
  const total = taxableBase + tax;
  const deposit = input.deposit.type === "percentage"
    ? percentage(total, Math.min(input.deposit.value, 10_000))
    : input.deposit.type === "fixed" ? BigInt(input.deposit.value) : BigInt(0);
  const boundedDeposit = deposit > total ? total : deposit;
  const recurring = input.lineItems.filter(item => item.recurringInterval).reduce((sum, item) => sum + BigInt(item.quantity) * BigInt(item.unitAmountMinor), BigInt(0));
  return {
    ...input,
    subtotalMinor: safeNumber(subtotal), discountMinor: safeNumber(boundedDiscount),
    taxMinor: safeNumber(tax), totalMinor: safeNumber(total),
    depositMinor: safeNumber(boundedDeposit), remainingMinor: safeNumber(total - boundedDeposit),
    recurringTotalMinor: recurring ? safeNumber(recurring) : null,
    calculationVersion: PROPOSAL_PRICING_VERSION,
  };
}

export function formatMoney(minor: number, currency: string, locale = "en-US") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);
}
