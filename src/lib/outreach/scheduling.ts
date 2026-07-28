export type SchedulingPolicy = { weekdays:number[]; startHour:number; endHour:number; timezone:string; dailyLimit:number; hourlyLimit:number };

export function isWithinSendingWindow(date: Date, policy: SchedulingPolicy) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: policy.timezone, weekday:"short", hour:"numeric", hourCycle:"h23" }).formatToParts(date);
  const weekday = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(parts.find(p=>p.type==="weekday")?.value || "") + 1;
  const hour = Number(parts.find(p=>p.type==="hour")?.value);
  return policy.weekdays.includes(weekday) && hour >= policy.startHour && hour < policy.endHour;
}

export function nextAllowedTime(from: Date, policy: SchedulingPolicy) {
  const candidate = new Date(from);
  for (let i=0;i<24*14;i++) {
    if (isWithinSendingWindow(candidate, policy)) return candidate;
    candidate.setUTCHours(candidate.getUTCHours()+1,0,0,0);
  }
  throw new Error("sending_window_unresolvable");
}

export const retryDelaysMinutes = [5,30,120] as const;
export function shouldRetry(code: string, acceptedAmbiguously = false) {
  if (acceptedAmbiguously) return false;
  return ["temporary_provider_error","provider_rate_limited","confirmed_network_non_acceptance","temporary_transport"].includes(code);
}
