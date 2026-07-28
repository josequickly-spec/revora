import type { ProposalRecord } from "./contracts";
import { escapeHtml } from "./sanitization.ts";
import { formatMoney } from "./pricing.ts";

export function publicProposalPayload(proposal: ProposalRecord) {
  return {
    title: proposal.title, proposalType: proposal.proposalType, status: proposal.status,
    currency: proposal.currency, locale: proposal.locale, version: proposal.publishedVersion,
    content: proposal.content, pricing: proposal.pricing, terms: proposal.terms,
    publishedAt: proposal.publishedAt, publicExpiresAt: proposal.publicExpiresAt,
  };
}

export function exportProposalJson(proposal: ProposalRecord) {
  const { internalNotes: _internalNotes, publicTokenPrefix: _prefix, ...safe } = proposal;
  void _internalNotes; void _prefix;
  return JSON.stringify({ ...safe, exportLabel: proposal.status === "published" ? "Published proposal" : "Draft proposal" }, null, 2);
}

export function exportProposalHtml(proposal: ProposalRecord) {
  const services = proposal.content.recommendedServices.filter(item => item.selected).map(item => `<li><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.description)}</p></li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(proposal.title)}</title><style>body{font-family:system-ui;max-width:860px;margin:40px auto;padding:20px;color:#172033}h1,h2{color:#0f172a}.meta{color:#64748b}.total{font-size:1.4rem;font-weight:800}@media print{button{display:none}}</style></head><body><p class="meta">${proposal.status === "published" ? "Published" : "Draft"} · Version ${proposal.currentVersion}</p><h1>${escapeHtml(proposal.title)}</h1><p>${escapeHtml(proposal.content.executiveSummary)}</p><h2>Recommended services</h2><ul>${services}</ul><h2>Timeline</h2><p>${escapeHtml(proposal.content.timeline)}</p><h2>Pricing</h2><p class="total">${escapeHtml(formatMoney(proposal.pricing.totalMinor, proposal.currency, proposal.locale === "es" ? "es-ES" : "en-US"))}</p><h2>Assumptions</h2><ul>${proposal.content.assumptions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><h2>Exclusions</h2><ul>${proposal.content.exclusions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><h2>Disclaimers</h2><ul>${proposal.content.disclaimers.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></body></html>`;
}
