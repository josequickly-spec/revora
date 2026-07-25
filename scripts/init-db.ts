import Database from "better-sqlite3";
import path from "path";
import { businesses, funnels, contacts, outreachCampaigns, proposals } from "../src/db/schema";

const dbPath = path.join(process.cwd(), "data.db");
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma("foreign_keys = ON");

// Create tables manually (SQLite doesn't need migrations like PG)
const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    country TEXT NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'ecommerce',
    niche TEXT NOT NULL,
    monthly_revenue INTEGER NOT NULL DEFAULT 50000,
    platform TEXT NOT NULL DEFAULT 'Website',
    logo_url TEXT,
    brand_color TEXT DEFAULT '#6366F1',
    brand_accent TEXT DEFAULT '#EC4899',
    status TEXT NOT NULL DEFAULT 'discovered',
    hero_offer TEXT DEFAULT 'Servicio Premium',
    hero_price TEXT DEFAULT '99',
    pain_point TEXT DEFAULT 'Baja conversión de leads a clientes',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS funnels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    funnel_name TEXT NOT NULL,
    template_type TEXT NOT NULL DEFAULT 'lead_magnet',
    headline TEXT NOT NULL,
    subheadline TEXT NOT NULL,
    cta_text TEXT NOT NULL DEFAULT 'Reservar Ahora',
    offer_badge TEXT DEFAULT 'Oferta Especial',
    bonus_offer TEXT DEFAULT 'Consulta gratuita incluida',
    custom_primary_color TEXT DEFAULT '#6366F1',
    slug TEXT NOT NULL UNIQUE,
    view_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Fundador / CEO',
    email TEXT NOT NULL,
    linkedin_url TEXT,
    confidence_score INTEGER DEFAULT 96,
    status TEXT DEFAULT 'verified',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    contact_id INTEGER,
    funnel_id INTEGER,
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    loom_script TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    sent_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    current_rev INTEGER NOT NULL DEFAULT 45000,
    projected_extra_rev INTEGER NOT NULL DEFAULT 22000,
    rev_share_percent INTEGER NOT NULL DEFAULT 25,
    estimated_agency_fee INTEGER NOT NULL DEFAULT 5500,
    ad_hook TEXT,
    ad_copy TEXT,
    ad_platform TEXT DEFAULT 'Meta Ads',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

try {
  sqlite.exec(createTablesSQL);
  console.log("✅ Base de datos inicializada en ./data.db");
  sqlite.close();
  process.exit(0);
} catch (error) {
  console.error("❌ Error inicializando BD:", error);
  process.exit(1);
}
