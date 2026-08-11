import type {ExecutiveOutput} from "./contracts";
export function validateExecutiveAdvice(output:ExecutiveOutput,evidence:Array<{evidenceId:string}>){
  const allowed=new Set(evidence.map(item=>item.evidenceId));
  for(const recommendation of output.recommendations)for(const reference of recommendation.evidenceRefs)if(!allowed.has(reference))throw new Error("unknown_executive_evidence_reference");
  if(!evidence.length&&output.recommendations.length)throw new Error("recommendation_without_evidence");
  return output;
}
