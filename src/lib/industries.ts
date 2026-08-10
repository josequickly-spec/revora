export interface IndustryConfig {
  key: string;
  label: string;
  emoji: string;
  color: string;
  accent: string;
  defaultPlatform: string;
  defaultNiche: string;
  defaultOffer: string;
  defaultPrice: string;
  defaultPainPoint: string;
  funnelType: string;
  funnelHeadline: (name: string, offer: string) => string;
  funnelSubheadline: (name: string) => string;
  funnelCta: string;
  funnelBadge: string;
  funnelBonus: string;
  emailSubject: (name: string) => string;
  emailBody: (bizName: string, contactFirst: string, offer: string, slug: string) => string;
  loomHook: (contactFirst: string, bizName: string, offer: string) => string;
  loomPitch: (bizName: string) => string;
  loomOffer: () => string;
  loomCta: () => string;
  adHook: (bizName: string, offer: string) => string;
  adCopy: (bizName: string, offer: string) => string;
  adPlatform: string;
  liftPercent: number;
  niches: string[];
}

export const INDUSTRIES: Record<string, IndustryConfig> = {
  general: {
    key: "general", label: "Other / Any business", emoji: "🏢", color: "#2563EB", accent: "#14B8A6",
    defaultPlatform: "Website", defaultNiche: "Local or digital business", defaultOffer: "Offer to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Conversion opportunity pending confirmation via audit",
    funnelType: "lead_generation", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} at ${n}`,
    funnelSubheadline: (n) => `See how ${n} can help you and request information with no obligation.`,
    funnelCta: "Request information", funnelBadge: "CONCEPT PROPOSAL", funnelBonus: "Next step to be confirmed",
    emailSubject: (n) => `I prepared a growth opportunity for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed the public information available for ${biz} and prepared a concept proposal to evaluate the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I reviewed ${b}'s public information and prepared a concept proposal to discuss with you."`,
    loomPitch: (b) => `"This proposal was built specifically for ${b}'s business model..."`,
    loomOffer: () => `"We implement and measure lead capture; the proposal adapts to the business's actual results."`,
    loomCta: () => `"Can we review it for 10 minutes this week?"`,
    adHook: (b, o) => `${o} with ${b}. Request information today.`,
    adCopy: (b, o) => `Discover how ${b} can help you. ${o} with no obligation.`,
    adPlatform: "Google Ads + Meta Ads",
    niches: ["Automotive / Dealership", "Beauty / Salon / Spa", "Construction / Contractor", "Cleaning", "Home Services", "Retail", "Tourism / Hotel", "Manufacturing", "Repairs / Auto Shop", "Finance / Insurance", "Education / Academy", "Logistics / Transportation", "Other"],
  },
  // E-commerce (any size)
  ecommerce: {
    key: "ecommerce", label: "E-Commerce / Online Store", emoji: "🛒", color: "#6366F1", accent: "#EC4899",
    defaultPlatform: "Shopify/WooCommerce", defaultNiche: "E-commerce", defaultOffer: "Offer to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Conversion opportunity pending confirmation via audit",
    funnelType: "flash_sale", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} at ${n}`,
    funnelSubheadline: (n) => `Explore ${n}'s offer and confirm availability, price, and terms.`,
    funnelCta: "View options", funnelBadge: "OFFER SUBJECT TO CONFIRMATION", funnelBonus: "Benefit to be confirmed",
    emailSubject: (n) => `Concept proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I prepared a concept proposal to review ${b}'s purchase journey."`,
    loomPitch: (b) => `"Look at this funnel I built for ${b} — it works for any online store..."`,
    loomOffer: () => `"Investment, reach, and the business model would be defined with verified data and client approval."`,
    loomCta: () => `"15 minutes this week?"`,
    adHook: (b, o) => `Discover ${o} at ${b}. Special offer available now.`,
    adCopy: (b, o) => `${o} at ${b}. Confirm price, availability, and terms before publishing.`,
    adPlatform: "Meta Ads + Google Shopping",
    niches: ["Cosmetics", "Apparel", "Technology", "Pets", "Food", "Home", "Sports", "Books", "Art", "Services"],
  },
  // Restaurant (any size)
  restaurant: {
    key: "restaurant", label: "Restaurant / Hospitality", emoji: "🍽️", color: "#DC2626", accent: "#F59E0B",
    defaultPlatform: "Google Business + Web", defaultNiche: "Restaurant", defaultOffer: "Offer to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Reservation opportunity pending confirmation via audit",
    funnelType: "reservation", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} at ${n} — Easy Online Booking`,
    funnelSubheadline: (n) => `A unique atmosphere at ${n}. Home cooking with fresh ingredients.`,
    funnelCta: "Check availability", funnelBadge: "TERMS TO BE CONFIRMED", funnelBonus: "Benefit to be confirmed",
    emailSubject: (n) => `Reservation proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I reviewed ${b}'s public reservation journey and prepared a concept proposal."`,
    loomPitch: (b) => `"This reservation funnel for ${b} captures customers directly..."`,
    loomOffer: () => `"Investment and the business model would be defined after verifying current reservations and spend."`,
    loomCta: () => `"5 minutes tomorrow?"`,
    adHook: (b, o) => `${o} at ${b}. Ask about the details directly.`,
    adCopy: (b, o) => `Check availability for ${o} at ${b}.`,
    adPlatform: "Instagram Ads + Google Ads Local",
    niches: ["Traditional Restaurant", "Pizzeria", "Sushi", "Mediterranean", "Tapas", "Vegan", "Brunch", "Cafe", "Bar", "Catering"],
  },
  // Gym/Fitness (any size)
  gym: {
    key: "gym", label: "Gym / Fitness", emoji: "💪", color: "#059669", accent: "#F97316",
    defaultPlatform: "Web + App", defaultNiche: "Gym", defaultOffer: "Offer to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Lead capture opportunity pending confirmation via audit",
    funnelType: "free_trial", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} at ${n}`,
    funnelSubheadline: (n) => `See ${n}'s offer and confirm services, equipment, and terms.`,
    funnelCta: "Request information", funnelBadge: "OFFER TO BE CONFIRMED", funnelBonus: "Benefit to be confirmed",
    emailSubject: (n) => `Lead capture proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I prepared a concept proposal to review ${b}'s lead capture."`,
    loomPitch: (b) => `"This funnel for ${b} captures and converts leads into members..."`,
    loomOffer: () => `"Any investment or compensation would be defined with verified metrics and prior approval."`,
    loomCta: () => `"10 minutes this week?"`,
    adHook: (b, o) => `${o} at ${b}. Ask about terms.`,
    adCopy: (b, o) => `Discover ${b} and request information about ${o}.`,
    adPlatform: "Meta Ads + Google Ads",
    niches: ["Gym", "CrossFit", "Yoga", "Pilates", "Boxing", "Spinning", "Personal Training", "Functional", "Martial Arts", "Strength"],
  },
  // Professional Services
  professional: {
    key: "professional", label: "Professional Services", emoji: "👨‍💼", color: "#0891B2", accent: "#6366F1",
    defaultPlatform: "Web + LinkedIn", defaultNiche: "Professional services", defaultOffer: "Offer to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Lead capture opportunity pending confirmation via audit",
    funnelType: "lead_magnet", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} at ${n} — Experts At Your Service`,
    funnelSubheadline: (n) => `See ${n}'s services and confirm experience, scope, and terms directly.`,
    funnelCta: "Request information", funnelBadge: "SERVICES TO BE CONFIRMED", funnelBonus: "Next step to be confirmed",
    emailSubject: (n) => `Business proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I reviewed ${b}'s public presence and prepared a concept proposal."`,
    loomPitch: (b) => `"This funnel for ${b} captures qualified leads..."`,
    loomOffer: () => `"Channels, investment, and compensation would be defined after verifying the current sales process."`,
    loomCta: () => `"15 minutes?"`,
    adHook: (b, o) => `Free consultation with ${b}'s experts. No obligation.`,
    adCopy: (b, o) => `Request information about ${o} at ${b}. Confirm credentials and terms directly.`,
    adPlatform: "Google Ads + LinkedIn Ads",
    niches: ["Law", "Accounting", "Consulting", "Design", "Marketing", "Software Development", "Photography", "Translation", "Coaching", "HR Consulting"],
  },
  // Healthcare
  healthcare: {
    key: "healthcare", label: "Healthcare / Clinic", emoji: "🏥", color: "#0D9488", accent: "#0891B2",
    defaultPlatform: "Web + Google", defaultNiche: "Clinic", defaultOffer: "Service to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Appointment opportunity pending confirmation via audit",
    funnelType: "appointment", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} at ${n} — We Care For Your Health`,
    funnelSubheadline: (n) => `Medical team specialized at ${n}. Personalized care.`,
    funnelCta: "Request information", funnelBadge: "SERVICE TO BE CONFIRMED", funnelBonus: "Next step to be confirmed",
    emailSubject: (n) => `Digital experience proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I reviewed ${b}'s public appointment journey and prepared a concept proposal."`,
    loomPitch: (b) => `"Lead capture funnel for ${b} — works for any clinic..."`,
    loomOffer: () => `"Any campaign would require confirming services, compliance, investment, and current metrics."`,
    loomCta: () => `"15 minutes?"`,
    adHook: (b, o) => `Your health matters most. ${o} at ${b}.`,
    adCopy: (b, o) => `Request information about ${o} at ${b}. Confirm services and credentials directly.`,
    adPlatform: "Google Ads + Meta Ads",
    niches: ["Medical Clinic", "Dental", "Physiotherapy", "Nutrition", "Psychology", "Veterinary", "Aesthetics", "Podiatry", "Dentistry", "Aesthetic Medicine"],
  },
  // SaaS/Software
  saas: {
    key: "saas", label: "SaaS / Software", emoji: "💻", color: "#7C3AED", accent: "#06B6D4",
    defaultPlatform: "Web App", defaultNiche: "Software", defaultOffer: "Plan to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Activation opportunity pending confirmation via audit",
    funnelType: "free_trial", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} at ${n} — Automate Your Business`,
    funnelSubheadline: (n) => `See ${n} and confirm features, seats, implementation, and terms.`,
    funnelCta: "See information", funnelBadge: "PLAN TO BE CONFIRMED", funnelBonus: "Benefit to be confirmed",
    emailSubject: (n) => `Conversion proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I reviewed ${b}'s public activation journey and prepared a concept proposal."`,
    loomPitch: (b) => `"Funnel for ${b} — works for any SaaS..."`,
    loomOffer: () => `"Channels, investment, and business model would be defined with verified acquisition and activation metrics."`,
    loomCta: () => `"15 minutes?"`,
    adHook: (b, o) => `Discover ${b}: ${o}.`,
    adCopy: (b, o) => `Check features, price, and terms for ${o} at ${b}.`,
    adPlatform: "LinkedIn Ads + Google Ads",
    niches: ["Productivity", "CRM", "Marketing", "Fintech", "EdTech", "HealthTech", "Human Resources", "Analytics", "AI", "Development"],
  },
  // Real Estate
  realestate: {
    key: "realestate", label: "Real Estate", emoji: "🏠", color: "#B45309", accent: "#059669",
    defaultPlatform: "Web + Portals", defaultNiche: "Real estate", defaultOffer: "Service to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Lead capture opportunity pending confirmation via audit",
    funnelType: "lead_magnet", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} at ${n} — Your Property, Valued`,
    funnelSubheadline: (n) => `${n}: Experts in your area. Personalized service.`,
    funnelCta: "Request information", funnelBadge: "SERVICE TO BE CONFIRMED", funnelBonus: "Next step to be confirmed",
    emailSubject: (n) => `Lead capture proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I reviewed ${b}'s public journey and prepared a concept proposal."`,
    loomPitch: (b) => `"Funnel for ${b} — works for any real estate business..."`,
    loomOffer: () => `"Channels, investment, and business model would be defined with verified metrics and prior approval."`,
    loomCta: () => `"15 minutes?"`,
    adHook: (b, o) => `Buying or selling? ${b} can help. Free valuation.`,
    adCopy: (b, o) => `Request information about ${o} at ${b}. Confirm scope and terms directly.`,
    adPlatform: "Meta Ads + Google Ads",
    niches: ["Residential", "Commercial", "Luxury", "Investment", "Rental", "New Construction", "Rural", "Tourist", "Industrial", "Offices"],
  },
  // Coaching/Education
  coaching: {
    key: "coaching", label: "Coaching / Education", emoji: "🎓", color: "#E11D48", accent: "#8B5CF6",
    defaultPlatform: "Web + Social", defaultNiche: "Training", defaultOffer: "Offer to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Lead capture opportunity pending confirmation via audit",
    funnelType: "webinar_registration", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} with ${n} — Your Transformation`,
    funnelSubheadline: (n) => `See ${n}'s offer and confirm methodology, experience, and terms.`,
    funnelCta: "Request information", funnelBadge: "OFFER TO BE CONFIRMED", funnelBonus: "Next step to be confirmed",
    emailSubject: (n) => `Business proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I reviewed ${b}'s public presence and prepared a concept proposal."`,
    loomPitch: (b) => `"Funnel for ${b} — works for any coaching business..."`,
    loomOffer: () => `"Channels, investment, and compensation would be defined with verified data and prior approval."`,
    loomCta: () => `"15 minutes?"`,
    adHook: (b, o) => `Transform your life with ${b}. Free session.`,
    adCopy: (b, o) => `Book your ${o} at ${b}. Change your future.`,
    adPlatform: "Meta Ads + YouTube Ads",
    niches: ["Personal Development", "Business", "Health", "Finance", "Relationships", "Productivity", "Leadership", "Sales", "Motivation", "Entrepreneurship"],
  },
  // Agency/Consulting
  agency: {
    key: "agency", label: "Agency / Consulting", emoji: "🚀", color: "#0EA5E9", accent: "#F43F5E",
    defaultPlatform: "Web + Portfolio", defaultNiche: "Agency", defaultOffer: "Service to be confirmed", defaultPrice: "Ask for details",
    defaultPainPoint: "Lead capture opportunity pending confirmation via audit",
    funnelType: "audit_offer", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} by ${n} — Scale Your Business`,
    funnelSubheadline: (n) => `See ${n}'s services and confirm scope, experience, and terms.`,
    funnelCta: "Request information", funnelBadge: "SERVICE TO BE CONFIRMED", funnelBonus: "Next step to be confirmed",
    emailSubject: (n) => `Business proposal for ${n}`,
    emailBody: (biz, c, o, s) => `Hi ${c},\n\nI reviewed ${biz}'s public digital presence and prepared a concept proposal to simplify the sales journey.\n\nYou can review it here:\n/funnel/${s}\n\nWould it be useful to discuss it for 15 minutes?\n\nBest,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hi ${c}, I reviewed ${b}'s public presence and prepared a concept proposal."`,
    loomPitch: (b) => `"Funnel for ${b} — works for any agency..."`,
    loomOffer: () => `"Channels, investment, and compensation would be defined with verified metrics and prior approval."`,
    loomCta: () => `"15 minutes?"`,
    adHook: (b, o) => `Discover ${b}: ${o}.`,
    adCopy: (b, o) => `Request information about ${o} at ${b}. Confirm scope and terms.`,
    adPlatform: "LinkedIn Ads + Google Ads",
    niches: ["Marketing", "Design", "Social Media", "SEO/SEM", "Branding", "Web", "Ads", "Consulting", "IT", "Human Resources"],
  },
};

export const INDUSTRY_LIST = Object.values(INDUSTRIES);

export function getIndustry(key: string): IndustryConfig {
  return INDUSTRIES[key] || INDUSTRIES.general;
}
