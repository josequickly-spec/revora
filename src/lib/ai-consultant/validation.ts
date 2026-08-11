import type { AIConsultantContext, AIConsultantOutput } from "./contracts.ts";
import { aiConsultantOutputSchema } from "./contracts.ts";

const RESULT_NUMERIC_CLAIM = /(?:[$€£]\s?\d[\d,.]*|\b\d+(?:\.\d+)?\s?%|\b(?:double|triple|2x|3x)\b)/gi;
const IMPLEMENTATION_ESTIMATE = /\b(?:day|days|week|weeks|hour|hours|día|días|semana|semanas|hora|horas)\b/i;

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}

export function validateConsultantOutput(raw: unknown, context: AIConsultantContext) {
  const report = aiConsultantOutputSchema.parse(raw);
  const allowedIds = new Set(context.evidenceCatalog.map(item => item.id));
  const suppliedFacts = context.evidenceCatalog.map(item => item.fact).join(" ");
  for (const reference of report.evidenceReferences) {
    if (!allowedIds.has(reference.id)) throw new Error(`unknown_evidence_id:${reference.id}`);
    const canonical = context.evidenceCatalog.find(item => item.id === reference.id);
    if (JSON.stringify(reference) !== JSON.stringify(canonical)) throw new Error(`altered_evidence:${reference.id}`);
  }
  const citedIds = collectStrings(report)
    .filter(value => allowedIds.has(value));
  for (const id of citedIds) if (!allowedIds.has(id)) throw new Error(`unknown_evidence_id:${id}`);

  const recommendationGroups = [
    report.topPriorities, report.funnelStrategy, report.offerStrategy, report.leadCaptureStrategy,
    report.trackingStrategy, report.trustStrategy, report.quickWins, report.longerTermActions,
  ];
  for (const recommendation of recommendationGroups.flat()) {
    if (!recommendation.evidenceReferenceIds.length) throw new Error("recommendation_without_evidence");
    for (const id of recommendation.evidenceReferenceIds) {
      if (!allowedIds.has(id)) throw new Error(`unknown_evidence_id:${id}`);
    }
  }
  for (const step of report.implementationRoadmap) {
    for (const id of step.evidenceReferenceIds) if (!allowedIds.has(id)) throw new Error(`unknown_evidence_id:${id}`);
  }
  for (const text of collectStrings(report)) {
    if (IMPLEMENTATION_ESTIMATE.test(text)) continue;
    for (const match of text.matchAll(RESULT_NUMERIC_CLAIM)) {
      if (!suppliedFacts.includes(match[0])) throw new Error(`unsupported_numeric_claim:${match[0]}`);
    }
  }
  return report;
}
