import { Pool } from "pg";

const globalForPg = globalThis as unknown as { revoraPool?: Pool };

export const pool =
  globalForPg.revoraPool ||
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForPg.revoraPool = pool;

export const businessSelect = `id::int AS id, name, domain, country,
  business_type AS "businessType", niche, monthly_revenue AS "monthlyRevenue",
  average_order_value AS "averageOrderValue", conversion_rate AS "conversionRate",
  monthly_ad_spend AS "monthlyAdSpend",
  platform, logo_url AS "logoUrl", brand_color AS "brandColor",
  brand_accent AS "brandAccent", status, hero_offer AS "heroOffer",
  hero_price AS "heroPrice", pain_point AS "painPoint", created_at AS "createdAt"`;

export const contactSelect = `id::int AS id, business_id::int AS "businessId", name, role, email,
  linkedin_url AS "linkedinUrl", confidence_score AS "confidenceScore",
  status, created_at AS "createdAt"`;

export const funnelSelect = `id::int AS id, business_id::int AS "businessId", funnel_name AS "funnelName",
  template_type AS "templateType", headline, subheadline, cta_text AS "ctaText",
  offer_badge AS "offerBadge", bonus_offer AS "bonusOffer",
  custom_primary_color AS "customPrimaryColor", slug,
  content_json AS "contentJson", view_count AS "viewCount", created_at AS "createdAt"`;
