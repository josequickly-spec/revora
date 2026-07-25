import { NextResponse } from "next/server";
import { mockData } from "@/db";
import { getIndustry } from "@/lib/industries";

const SEED_BUSINESSES = [
  // Micro businesses (<5k)
  { name: "Peluquería Luxe", domain: "peluquerialuxe.es", country: "España", businessType: "ecommerce", niche: "Servicios", monthlyRevenue: 2800, platform: "Instagram + Web", brandColor: "#EC4899", heroOffer: "Corte + Tratamiento Express", heroPrice: "25", painPoint: "Depende de walk-in y no tiene reservas online", contactName: "Marta Ruiz" },
  { name: "Café del Parque", domain: "cafedelparque.com", country: "México", businessType: "restaurant", niche: "Cafetería", monthlyRevenue: 3500, platform: "Instagram + Google", brandColor: "#DC2626", heroOffer: "Desayuno Completo 2x1", heroPrice: "12", painPoint: "Sin sistema de reserva de mesas", contactName: "Luis Méndez" },
  { name: "Yoga Flow Studio", domain: "yogaflow.cl", country: "Chile", businessType: "gym", niche: "Yoga", monthlyRevenue: 1800, platform: "Instagram + WhatsApp", brandColor: "#059669", heroOffer: "Clase Gratis + Meditación", heroPrice: "Gratis", painPoint: "Pocos alumnos y dependencia de redes orgánicas", contactName: "Claudia Silva" },
  // Small businesses (5k-25k)
  { name: "TechReparaciones", domain: "techreparaciones.mx", country: "México", businessType: "professional", niche: "Reparación Móviles", monthlyRevenue: 12000, platform: "Web + Google", brandColor: "#0891B2", heroOffer: "Reparación Express 24h", heroPrice: "Gratis diagnóstico", painPoint: "Sin captación online de clientes", contactName: "Roberto Chen" },
  { name: "Clínica Dental Sonríe", domain: "sonriedental.com", country: "España", businessType: "healthcare", niche: "Dental", monthlyRevenue: 18000, platform: "Google + Web", brandColor: "#0D9488", heroOffer: "Ortodoncia Invisible", heroPrice: "1.200", painPoint: "Depende de derivaciones médicas", contactName: "Dra. Elena Vázquez" },
  { name: "Marketing Boost", domain: "marketingboost.ar", country: "Argentina", businessType: "agency", niche: "Social Media", monthlyRevenue: 15000, platform: "Web + Portfolio", brandColor: "#0EA5E9", heroOffer: "Gestión de Redes 15 días", heroPrice: "Gratis", painPoint: "Captación solo por referidos", contactName: "Sofía Martínez" },
  // Medium businesses (25k-100k)
  { name: "Nordic Glow Skincare", domain: "nordicglowskin.ca", country: "Canadá", businessType: "ecommerce", niche: "Cosmética", monthlyRevenue: 85000, platform: "Shopify Plus", brandColor: "#6366F1", heroOffer: "Serum Facial Regenerador", heroPrice: "48", painPoint: "Sin embudo de ventas dedicado", contactName: "Marc Tremblay" },
  { name: "Trattoria Bella Roma", domain: "trattoriabellaroma.es", country: "España", businessType: "restaurant", niche: "Restaurante Gourmet", monthlyRevenue: 42000, platform: "Google Business + Web", brandColor: "#DC2626", heroOffer: "Menú Degustación 7 Platos", heroPrice: "65", painPoint: "Depende solo de walk-in", contactName: "Elena Rossi" },
  { name: "CrossFit Apex Box", domain: "crossfitapex.fitness", country: "Estados Unidos", businessType: "gym", niche: "CrossFit", monthlyRevenue: 28000, platform: "Web + App", brandColor: "#059669", heroOffer: "Prueba Gratis 7 Días", heroPrice: "89/mes", painPoint: "Alta rotación sin captación digital", contactName: "Jake Morrison" },
  // Large businesses (100k+)
  { name: "FlowMetrics SaaS", domain: "flowmetrics.io", country: "Estados Unidos", businessType: "saas", niche: "Productividad", monthlyRevenue: 180000, platform: "Web App", brandColor: "#7C3AED", heroOffer: "Prueba Gratis 14 Días", heroPrice: "49/mes", painPoint: "Baja conversión visitor→cliente", contactName: "Ryan Mitchell" },
  { name: "Finca & Hogar Premium", domain: "fincayhogar.com", country: "España", businessType: "realestate", niche: "Inmobiliaria Residencial", monthlyRevenue: 65000, platform: "Web + Portales", brandColor: "#B45309", heroOffer: "Valoración Gratuita", heroPrice: "Comisión 3-5%", painPoint: "Dependencia de portales externos", contactName: "Carlos Mendoza" },
  { name: "Mentoría Impact Pro", domain: "impactpro.coach", country: "México", businessType: "coaching", niche: "Business Coaching", monthlyRevenue: 35000, platform: "Web + Redes", brandColor: "#E11D48", heroOffer: "Sesión Estratégica Gratis", heroPrice: "2.500", painPoint: "Captación no escalable", contactName: "Alejandra Ruiz" },
  { name: "StudioNova Creativo", domain: "studionova.agency", country: "Argentina", businessType: "agency", niche: "Marketing Digital", monthlyRevenue: 52000, platform: "Web + Portfolio", brandColor: "#0EA5E9", heroOffer: "Auditoría Digital Gratis", heroPrice: "1.500", painPoint: "Solo referidos", contactName: "Martín Vega" },
  // Enterprise (500k+)
  { name: "GlobalTech Solutions", domain: "globaltech.com", country: "Estados Unidos", businessType: "saas", niche: "Enterprise Software", monthlyRevenue: 850000, platform: "Web App", brandColor: "#4F46E5", heroOffer: "Demo Personalizada", heroPrice: "Custom", painPoint: "Competencia feroz sin diferenciación", contactName: "Sarah Johnson" },
];

export async function GET() {
  try {
    // Return mock data directly
    return NextResponse.json({ success: true, businesses: mockData.businesses });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ind = getIndustry(body.businessType || "ecommerce");

    const newBiz = {
      id: Math.max(...mockData.businesses.map(b => b.id)) + 1,
      name: body.name || "Nuevo Negocio",
      domain: body.domain || `${body.name?.toLowerCase().replace(/\s+/g, "")||"negocio"}.com`,
      country: body.country || "España",
      businessType: body.businessType || "ecommerce",
      niche: body.niche || ind.defaultNiche,
      monthlyRevenue: parseInt(body.monthlyRevenue) || 10000,
      platform: body.platform || ind.defaultPlatform,
      logoUrl: null,
      brandColor: body.brandColor || ind.color,
      brandAccent: ind.accent,
      status: "discovered",
      heroOffer: body.heroOffer || ind.defaultOffer,
      heroPrice: body.heroPrice || ind.defaultPrice,
      painPoint: body.painPoint || ind.defaultPainPoint,
      createdAt: new Date().toISOString(),
    };

    mockData.businesses.push(newBiz);

    const slug = newBiz.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);
    const newFunnel = {
      id: Math.max(...mockData.funnels.map(f => f.id || 0)) + 1,
      businessId: newBiz.id,
      funnelName: `Embudo para ${newBiz.name}`,
      templateType: ind.funnelType,
      headline: ind.funnelHeadline(newBiz.name, newBiz.heroOffer),
      subheadline: ind.funnelSubheadline(newBiz.name),
      ctaText: ind.funnelCta,
      offerBadge: ind.funnelBadge,
      bonusOffer: ind.funnelBonus,
      customPrimaryColor: newBiz.brandColor || ind.color,
      slug,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };
    mockData.funnels.push(newFunnel);

    const newContact = {
      id: Math.max(...mockData.contacts.map(c => c.id)) + 1,
      businessId: newBiz.id,
      name: body.contactName || "Director",
      role: "Fundador / Director",
      email: `info@${newBiz.domain}`,
      linkedinUrl: null,
      confidenceScore: 95,
      status: "verified",
      createdAt: new Date().toISOString(),
    };
    mockData.contacts.push(newContact);

    return NextResponse.json({ success: true, business: newBiz, funnel: newFunnel, contact: newContact });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
