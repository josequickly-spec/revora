import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { businesses } from "./schema";

// Add this column to the outreachCampaigns table
export const outreachCampaigns = sqliteTable("outreach_campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  contactId: integer("contact_id"),
  funnelId: integer("funnel_id"),
  emailSubject: text("email_subject").notNull(),
  emailBody: text("email_body").notNull(),
  loomScript: text("loom_script"),
  insightsJson: text("insights_json"), // ← NEW: stores the 2 approved insights
  status: text("status").notNull().default("draft"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
