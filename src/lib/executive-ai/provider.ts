import OpenAI from "openai";import {zodTextFormat} from "openai/helpers/zod";import {executiveOutputSchema,type ExecutiveOutput} from "./contracts";
export async function generateExecutiveAdvice(input:{advisor:string;evidence:unknown[]}):Promise<{output:ExecutiveOutput;provider:string;model:string;usage:unknown}>{
  if(!process.env.OPENAI_API_KEY){const error=new Error("Executive AI is not configured.") as Error&{code:string};error.code="missing_api_key";throw error;}
  const model=process.env.OPENAI_EXECUTIVE_MODEL||"gpt-5.6",client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:60_000,maxRetries:0});
  const response=await client.responses.parse({model,reasoning:{effort:"low"},input:[
    {role:"system",content:"You are a read-only executive advisor. Use only supplied evidence. Every recommendation must cite one or more exact evidenceId values. Never claim certainty, execute actions, invent values, or imply that a recommendation has been applied. Return no recommendation when evidence is insufficient."},
    {role:"user",content:JSON.stringify({advisor:input.advisor,evidence:input.evidence})},
  ],text:{format:zodTextFormat(executiveOutputSchema,"executive_advice")}});
  if(!response.output_parsed)throw new Error("malformed_executive_ai_output");
  return {output:response.output_parsed,provider:"openai",model,usage:response.usage?{inputTokens:response.usage.input_tokens,outputTokens:response.usage.output_tokens,totalTokens:response.usage.total_tokens}:null};
}
