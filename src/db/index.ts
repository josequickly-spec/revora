import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Mock data for local development without PostgreSQL
export const mockData = {
  businesses: [
    {
      id: 1,
      name: "Peluquería Luxe",
      domain: "peluquerialuxe.es",
      country: "España",
      businessType: "ecommerce",
      niche: "Servicios",
      monthlyRevenue: 2800,
      platform: "Instagram + Web",
      logoUrl: null,
      brandColor: "#EC4899",
      brandAccent: "#EC4899",
      status: "discovered",
      heroOffer: "Corte + Tratamiento Express",
      heroPrice: "25",
      painPoint: "Depende de walk-in y no tiene reservas online",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Café del Parque",
      domain: "cafedelparque.com",
      country: "México",
      businessType: "restaurant",
      niche: "Cafetería",
      monthlyRevenue: 3500,
      platform: "Instagram + Google",
      logoUrl: null,
      brandColor: "#DC2626",
      brandAccent: "#F59E0B",
      status: "discovered",
      heroOffer: "Desayuno Completo 2x1",
      heroPrice: "12",
      painPoint: "Sin sistema de reserva de mesas",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: "FlowMetrics SaaS",
      domain: "flowmetrics.io",
      country: "Estados Unidos",
      businessType: "saas",
      niche: "Productividad",
      monthlyRevenue: 180000,
      platform: "Web App",
      logoUrl: null,
      brandColor: "#7C3AED",
      brandAccent: "#06B6D4",
      status: "funnel_ready",
      heroOffer: "Prueba Gratis 14 Días",
      heroPrice: "49/mes",
      painPoint: "Baja conversión visitor→cliente",
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      name: "Nordic Glow Skincare",
      domain: "nordicglowskin.ca",
      country: "Canadá",
      businessType: "ecommerce",
      niche: "Cosmética",
      monthlyRevenue: 85000,
      platform: "Shopify Plus",
      logoUrl: null,
      brandColor: "#6366F1",
      brandAccent: "#EC4899",
      status: "contact_found",
      heroOffer: "Serum Facial Regenerador",
      heroPrice: "48",
      painPoint: "Sin embudo de ventas dedicado",
      createdAt: new Date().toISOString(),
    },
    {
      id: 5,
      name: "CrossFit Apex Box",
      domain: "crossfitapex.fitness",
      country: "Estados Unidos",
      businessType: "gym",
      niche: "CrossFit",
      monthlyRevenue: 28000,
      platform: "Web + App",
      logoUrl: null,
      brandColor: "#059669",
      brandAccent: "#F97316",
      status: "pitch_sent",
      heroOffer: "Prueba Gratis 7 Días",
      heroPrice: "89/mes",
      painPoint: "Alta rotación sin captación digital",
      createdAt: new Date().toISOString(),
    },
  ],
  funnels: [
    {
      id: 1,
      businessId: 1,
      funnelName: "Embudo para Peluquería Luxe",
      templateType: "lead_magnet",
      headline: "Oferta Exclusiva: Corte + Tratamiento Express con Descuento Especial",
      subheadline: "Productos de calidad en Peluquería Luxe. Garantía y envío rápido.",
      ctaText: "Quiero Mi Oferta Ahora",
      offerBadge: "🔥 DESCUENTO + ENVÍO GRATIS",
      bonusOffer: "Garantía extendida incluida",
      customPrimaryColor: "#EC4899",
      slug: "peluqueria-luxe-funnel",
      viewCount: 87,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      businessId: 2,
      funnelName: "Embudo para Café del Parque",
      templateType: "reservation",
      headline: "Desayuno Completo 2x1 en Café del Parque — Reserva Fácil Online",
      subheadline: "Ambiente único en Café del Parque. Cocina casera con productos frescos.",
      ctaText: "Reservar Mesa Ahora",
      offerBadge: "🍷 RESERVA + BEBIDA GRATIS",
      bonusOffer: "Entrada o postre incluido",
      customPrimaryColor: "#DC2626",
      slug: "cafe-del-parque-funnel",
      viewCount: 154,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      businessId: 3,
      funnelName: "Embudo para FlowMetrics SaaS",
      templateType: "free_trial",
      headline: "Prueba Gratis 14 Días en FlowMetrics SaaS — Automatiza tu Negocio",
      subheadline: "Más de 1.000 equipos usan FlowMetrics SaaS. Setup inmediato.",
      ctaText: "Empezar Prueba Gratis",
      offerBadge: "🚀 PRUEBA GRATIS + ONBOARDING",
      bonusOffer: "Soporte premium incluido",
      customPrimaryColor: "#7C3AED",
      slug: "flowmetrics-saas-funnel",
      viewCount: 342,
      createdAt: new Date().toISOString(),
    },
  ],
  contacts: [
    {
      id: 1,
      businessId: 1,
      name: "Marta Ruiz",
      role: "Fundador / CEO",
      email: "marta@peluquerialuxe.es",
      linkedinUrl: "https://linkedin.com/in/marta-ruiz",
      confidenceScore: 96,
      status: "verified",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      businessId: 2,
      name: "Luis Méndez",
      role: "Fundador / CEO",
      email: "luis@cafedelparque.com",
      linkedinUrl: "https://linkedin.com/in/luis-mendez",
      confidenceScore: 96,
      status: "verified",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      businessId: 3,
      name: "Ryan Mitchell",
      role: "Fundador / CEO",
      email: "ryan@flowmetrics.io",
      linkedinUrl: "https://linkedin.com/in/ryan-mitchell",
      confidenceScore: 96,
      status: "verified",
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      businessId: 4,
      name: "Marc Tremblay",
      role: "Fundador / CEO",
      email: "marc@nordicglowskin.ca",
      linkedinUrl: "https://linkedin.com/in/marc-tremblay",
      confidenceScore: 96,
      status: "verified",
      createdAt: new Date().toISOString(),
    },
    {
      id: 5,
      businessId: 5,
      name: "Jake Morrison",
      role: "Fundador / CEO",
      email: "jake@crossfitapex.fitness",
      linkedinUrl: "https://linkedin.com/in/jake-morrison",
      confidenceScore: 96,
      status: "verified",
      createdAt: new Date().toISOString(),
    },
  ],
  outreachCampaigns: [],
  proposals: [],
};

// PostgreSQL connection for production
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    const client = postgres(process.env.DATABASE_URL, { ssl: "require" });
    db = drizzle(client);
  } catch (error) {
    console.warn("PostgreSQL not available, using mock data");
    db = null;
  }
}

// Export mock DB adapter that works with both mock and real PostgreSQL
export const getDb = () => db;

// Fallback mock implementation
export const mockDb = {
  select: () => ({
    from: (table: any) => Promise.resolve([]),
  }),
  insert: (table: any) => ({
    values: (data: any) => Promise.resolve([data]),
  }),
};

// Default export for backward compatibility
export const database = db || mockDb;
