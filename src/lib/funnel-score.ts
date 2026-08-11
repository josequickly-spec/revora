export const FUNNELSPY_SCORE_VERSION = "funnelspy-score-v1" as const;

export function calculateFunnelScore(input: {
  pages: number; ctas: number; forms: number; pixels: number;
  hasCheckout: boolean; hasThankYou: boolean;
}) {
  return Math.min(100, 28 + Math.min(input.pages * 5, 20) + Math.min(input.ctas, 15) + Math.min(input.forms * 9, 18) + Math.min(input.pixels * 5, 10) + (input.hasCheckout ? 5 : 0) + (input.hasThankYou ? 4 : 0));
}
