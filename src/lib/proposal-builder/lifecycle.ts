import type { ProposalStatus } from "./contracts.ts";

const transitions: Partial<Record<ProposalStatus, ProposalStatus[]>> = {
  draft: ["ready", "archived"],
  ready: ["draft", "published", "archived"],
  published: ["draft", "expired", "archived"],
  viewed: ["draft", "expired", "archived"],
  expired: ["draft", "archived"],
};

export function assertProposalTransition(from: ProposalStatus, to: ProposalStatus) {
  if (!transitions[from]?.includes(to)) throw new Error(`invalid_transition:${from}:${to}`);
}
