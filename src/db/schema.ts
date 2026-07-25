import { sqliteTable, integer, text, primaryKey } from "drizzle-orm/sqlite-core";

export const businesses = sqliteTable("businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  country: text("country").notNull(),
  businessType: text("business_type").notNull().default("ecommerce"),
  niche: text("niche").notNull(),
  monthlyRevenue: integer("monthly_revenue").notNull().default(50000),
  platform: text("platform").notNull().default("Website"),
  logoUrl: text("logo_url"),
  brandColor: text("brand_color").default("#6366F1"),
  brandAccent: text("brand_accent").default("#EC4899"),
  status: text("status").notNull().default("discovered"),
  heroOffer: text("hero_offer").default("Servicio Premium"),
  heroPrice: text("hero_price").default("99"),
  painPoint: text("pain_point").default("Baja conversión de leads a clientes"),
  createdAt: text("created_at").default(() => new Date().toISOString()),
});

export const funnels = sqliteTable("funnels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  funnelName: text("funnel_name").notNull(),
  templateType: text("template_type").notNull().default("lead_magnet"),
  headline: text("headline").notNull(),
  subheadline: text("subheadline").notNull(),
  ctaText: text("cta_text").notNull().default("Reservar Ahora"),
  offerBadge: text("offer_badge").default("Oferta Especial"),
  bonusOffer: text("bonus_offer").default("Consulta gratuita incluida"),
  customPrimaryColor: text("custom_primary_color").default("#6366F1"),
  slug: text("slug").notNull().unique(),
  viewCount: integer("view_count").default(0),
  createdAt: text("created_at").default(() => new Date().toISOString()),
});

export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull().default("Fundador / CEO"),
  email: text("email").notNull(),
  linkedinUrl: text("linkedin_url"),
  confidenceScore: integer("confidence_score").default(96),
  status: text("status").default("verified"),
  createdAt: text("created_at").default(() => new Date().toISOString()),
});

export const outreachCampaigns = sqliteTable("outreach_campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  contactId: integer("contact_id"),
  funnelId: integer("funnel_id"),
  emailSubject: text("email_subject").notNull(),
  emailBody: text("email_body").notNull(),
  loomScript: text("loom_script"),
  status: text("status").notNull().default("draft"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").default(() => new Date().toISOString()),
});

export const proposals = sqliteTable("proposals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  currentRev: integer("current_rev").notNull().default(45000),
  projectedExtraRev: integer("projected_extra_rev").notNull().default(22000),
  revSharePercent: integer("rev_share_percent").notNull().default(25),
  estimatedAgencyFee: integer("estimated_agency_fee").notNull().default(5500),
  adHook: text("ad_hook"),
  adCopy: text("ad_copy"),
  adPlatform: text("ad_platform").default("Meta Ads"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(() => new Date().toISOString()),
});
