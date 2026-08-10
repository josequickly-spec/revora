/**
 * Scrapling Configuration and Types
 * Integrates web scraping capabilities across the platform
 */

export type ScraperType =
  | "business-discovery"      // Descubrir negocios de directorios
  | "funnel-analysis"         // Analizar landing pages
  | "competitor-monitoring"   // Rastrear competidores
  | "data-enrichment"         // Enriquecer datos de empresas
  | "proposal-generation"     // Scrapear datos para propuestas
  | "contact-extraction"      // Extraer contactos
  | "shopify-audit"           // Auditoría exclusiva de tiendas Shopify
  | "apify-google-maps-leads" // Google Maps leads con email via Apify
  | "apify-linkedin-companies" // LinkedIn company intel via Apify
  | "apify-facebook-ads"      // Facebook Ad Library spy via Apify
  | "apify-instagram-profiles" // Instagram profile intel via Apify
  | "apify-contact-scraper"   // Website contact extraction via Apify
  | "apify-social-leads"      // Social media lead analyzer via Apify
  | "apify-google-maps-reviews" // Google Maps reviews via Apify
  | "apify-tiktok-profiles"     // TikTok profile scraper via Apify
  | "apify-linkedin-emails"     // LinkedIn email finder via Apify
  | "apify-linkedin-people-search" // LinkedIn people search via Apify
  | "apify-facebook-page-details"  // Facebook page contact details via Apify
  | "apify-facebook-ad-leads"   // Facebook advertiser leads via Apify
  | "apify-all-social-emails"   // All social media email scraper via Apify
  | "apify-trustpilot-reviews"  // Trustpilot reviews via Apify
  | "apify-similarweb"          // SimilarWeb traffic analytics via Apify
  | "apify-youtube-channels"    // YouTube channel + emails via Apify
  | "apify-twitter-profiles";   // Twitter/X profile scraper via Apify

export interface ScrapingJob {
  id: string;
  type: ScraperType;
  businessId?: number;
  businessDomain?: string;
  url?: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  results?: Record<string, any>;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ScrapingResult {
  type: ScraperType;
  url: string;
  data: {
    // Business Discovery
    businessName?: string;
    businessType?: string;
    industry?: string;
    contactEmails?: string[];
    phoneNumbers?: string[];
    address?: string;
    socialMediaLinks?: Record<string, string>;

    // Funnel Analysis
    headlines?: string[];
    subheadlines?: string[];
    ctaText?: string[];
    offerBadges?: string[];
    heroImages?: string[];
    pageLayout?: Record<string, any>;

    // Competitor Monitoring
    pricingInfo?: Record<string, any>;
    competitorFeatures?: string[];
    marketPosition?: string;

    // Data Enrichment
    companySize?: string;
    foundedYear?: number;
    revenue?: string;
    technologies?: string[];
    socialProfiles?: Record<string, string>;
    reviews?: Array<{ source: string; rating: number; summary: string }>;

    // Contact Information
    employees?: Array<{ name: string; title: string; email?: string; linkedin?: string }>;
    decisionMakers?: Array<{ name: string; title: string; email?: string }>;
  };
  metadata: {
    scrapedAt: Date;
    pageTitle?: string;
    pageDescription?: string;
    statusCode?: number;
    responseTime?: number;
  };
}

export interface ScrapingConfig {
  // Proxy settings
  useProxy: boolean;
  proxyRotation: boolean;
  proxyList?: string[];

  // Anti-bot handling
  handleCloudflare: boolean;
  handleTurnstile: boolean;
  headless: boolean;
  stealth: boolean;
  networkIdle: boolean;

  // Rate limiting
  requestsPerSecond: number;
  delayBetweenRequests: number; // ms
  randomDelay: boolean;

  // Adaptive scraping
  adaptive: boolean;
  autoSave: boolean;

  // Timeouts
  pageLoadTimeout: number; // ms
  navigationTimeout: number; // ms

  // Retry policy
  maxRetries: number;
  retryDelay: number; // ms
}

// Default configuration for production
export const defaultScrapingConfig: ScrapingConfig = {
  useProxy: true,
  proxyRotation: true,
  handleCloudflare: true,
  handleTurnstile: true,
  headless: true,
  stealth: true,
  networkIdle: true,
  requestsPerSecond: 2,
  delayBetweenRequests: 500,
  randomDelay: true,
  adaptive: true,
  autoSave: true,
  pageLoadTimeout: 30000,
  navigationTimeout: 20000,
  maxRetries: 3,
  retryDelay: 2000,
};

// Development configuration (less strict)
export const devScrapingConfig: ScrapingConfig = {
  useProxy: false,
  proxyRotation: false,
  handleCloudflare: false,
  handleTurnstile: false,
  headless: true,
  stealth: false,
  networkIdle: false,
  requestsPerSecond: 10,
  delayBetweenRequests: 100,
  randomDelay: false,
  adaptive: true,
  autoSave: true,
  pageLoadTimeout: 15000,
  navigationTimeout: 10000,
  maxRetries: 1,
  retryDelay: 500,
};
