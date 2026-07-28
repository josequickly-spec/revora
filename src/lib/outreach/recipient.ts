export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function isEmailSyntaxValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email)) && email.length <= 320;
}
export function emailDomain(email: string) { return normalizeEmail(email).split("@")[1] || ""; }
export function isEligibleVerification(status: string, riskyApproved = false) {
  return ["provider_verified","domain_valid","syntax_valid"].includes(status) || (status === "provider_risky" && riskyApproved);
}
