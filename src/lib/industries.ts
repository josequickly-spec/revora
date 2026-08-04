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
  loomDemo: (bizName: string) => string;
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
    key: "general", label: "Otro / Cualquier negocio", emoji: "🏢", color: "#2563EB", accent: "#14B8A6",
    defaultPlatform: "Sitio web", defaultNiche: "Negocio local o digital", defaultOffer: "Oferta por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de conversión pendiente de confirmar con auditoría",
    funnelType: "lead_generation", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} en ${n}`,
    funnelSubheadline: (n) => `Conoce cómo ${n} puede ayudarte y solicita información sin compromiso.`,
    funnelCta: "Solicitar información", funnelBadge: "PROPUESTA CONCEPTUAL", funnelBonus: "Siguiente paso por confirmar",
    emailSubject: (n) => `Preparé una oportunidad de crecimiento para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la información pública disponible de ${biz} y preparé una propuesta conceptual para evaluar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, revisé la información pública de ${b} y preparé una propuesta conceptual para comentarla contigo."`,
    loomDemo: (b) => `"Esta propuesta está creada específicamente para el modelo de negocio de ${b}..."`,
    loomOffer: () => `"Implementamos y medimos la captación; la propuesta se adapta al resultado real del negocio."`,
    loomCta: () => `"¿Podemos revisarlo durante 10 minutos esta semana?"`,
    adHook: (b, o) => `${o} con ${b}. Solicita información hoy.`,
    adCopy: (b, o) => `Descubre cómo ${b} puede ayudarte. ${o} sin compromiso.`,
    adPlatform: "Google Ads + Meta Ads",
    niches: ["Automoción / Concesionario", "Belleza / Peluquería / Spa", "Construcción / Contratista", "Limpieza", "Servicios para el hogar", "Comercio minorista", "Turismo / Hotel", "Fabricación", "Reparaciones / Taller", "Finanzas / Seguros", "Educación / Academia", "Logística / Transporte", "Otro"],
  },
  // E-commerce (any size)
  ecommerce: {
    key: "ecommerce", label: "E-Commerce / Tienda Online", emoji: "🛒", color: "#6366F1", accent: "#EC4899",
    defaultPlatform: "Shopify/WooCommerce", defaultNiche: "Comercio electrónico", defaultOffer: "Oferta por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de conversión pendiente de confirmar con auditoría",
    funnelType: "flash_sale", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} en ${n}`,
    funnelSubheadline: (n) => `Explora la propuesta de ${n} y confirma disponibilidad, precio y condiciones.`,
    funnelCta: "Ver opciones", funnelBadge: "OFERTA SUJETA A CONFIRMACIÓN", funnelBonus: "Beneficio por confirmar",
    emailSubject: (n) => `Propuesta conceptual para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, preparé una propuesta conceptual para revisar el recorrido de compra de ${b}."`,
    loomDemo: (b) => `"Mira este embudo que he creado para ${b} — funciona para cualquier tienda online..."`,
    loomOffer: () => `"La inversión, el alcance y el modelo comercial se definirían con datos verificados y aprobación del cliente."`,
    loomCta: () => `"¿15 minutos esta semana?"`,
    adHook: (b, o) => `Descubre ${o} en ${b}. Oferta especial disponible ahora.`,
    adCopy: (b, o) => `${o} en ${b}. Confirma precio, disponibilidad y condiciones antes de publicar.`,
    adPlatform: "Meta Ads + Google Shopping",
    niches: ["Cosmética", "Ropa", "Tecnología", "Mascotas", "Alimentación", "Hogar", "Deporte", "Libros", "Arte", "Servicios"],
  },
  // Restaurant (any size)
  restaurant: {
    key: "restaurant", label: "Restaurante / Hostelería", emoji: "🍽️", color: "#DC2626", accent: "#F59E0B",
    defaultPlatform: "Google Business + Web", defaultNiche: "Restaurante", defaultOffer: "Oferta por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de reservas pendiente de confirmar con auditoría",
    funnelType: "reservation", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} en ${n} — Reserva Fácil Online`,
    funnelSubheadline: (n) => `Ambiente único en ${n}. Cocina casera con productos frescos.`,
    funnelCta: "Consultar disponibilidad", funnelBadge: "CONDICIONES POR CONFIRMAR", funnelBonus: "Beneficio por confirmar",
    emailSubject: (n) => `Propuesta de reservas para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, revisé el recorrido público de reservas de ${b} y preparé una propuesta conceptual."`,
    loomDemo: (b) => `"Este embudo de reservas para ${b} captura clientes directamente..."`,
    loomOffer: () => `"La inversión y el modelo comercial se definirían después de verificar reservas e inversión actuales."`,
    loomCta: () => `"¿5 minutos mañana?"`,
    adHook: (b, o) => `${o} en ${b}. Consulta los detalles directamente.`,
    adCopy: (b, o) => `Consulta disponibilidad para ${o} en ${b}.`,
    adPlatform: "Instagram Ads + Google Ads Local",
    niches: ["Restaurante Tradicional", "Pizzería", "Sushi", "Mediterráneo", "Tapas", "Vegano", "Brunch", "Cafetería", "Bar", "Catering"],
  },
  // Gym/Fitness (any size)
  gym: {
    key: "gym", label: "Gimnasio / Fitness", emoji: "💪", color: "#059669", accent: "#F97316",
    defaultPlatform: "Web + App", defaultNiche: "Gimnasio", defaultOffer: "Oferta por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de captación pendiente de confirmar con auditoría",
    funnelType: "free_trial", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} en ${n}`,
    funnelSubheadline: (n) => `Conoce la propuesta de ${n} y confirma servicios, equipo y condiciones.`,
    funnelCta: "Solicitar información", funnelBadge: "OFERTA POR CONFIRMAR", funnelBonus: "Beneficio por confirmar",
    emailSubject: (n) => `Propuesta de captación para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, preparé una propuesta conceptual para revisar la captación de ${b}."`,
    loomDemo: (b) => `"Este embudo para ${b} captura y convierte leads en socios..."`,
    loomOffer: () => `"Cualquier inversión o compensación se definiría con métricas verificadas y aprobación previa."`,
    loomCta: () => `"¿10 minutos esta semana?"`,
    adHook: (b, o) => `${o} en ${b}. Consulta condiciones.`,
    adCopy: (b, o) => `Conoce ${b} y solicita información sobre ${o}.`,
    adPlatform: "Meta Ads + Google Ads",
    niches: ["Gimnasio", "CrossFit", "Yoga", "Pilates", "Boxeo", "Spinning", "Personal", "Funcional", "Artes Marciales", "Fuerza"],
  },
  // Professional Services
  professional: {
    key: "professional", label: "Servicios Profesionales", emoji: "👨‍💼", color: "#0891B2", accent: "#6366F1",
    defaultPlatform: "Web + LinkedIn", defaultNiche: "Servicios profesionales", defaultOffer: "Oferta por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de captación pendiente de confirmar con auditoría",
    funnelType: "lead_magnet", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} en ${n} — Expertos a tu Disposición`,
    funnelSubheadline: (n) => `Conoce los servicios de ${n} y confirma experiencia, alcance y condiciones directamente.`,
    funnelCta: "Solicitar información", funnelBadge: "SERVICIOS POR CONFIRMAR", funnelBonus: "Siguiente paso por confirmar",
    emailSubject: (n) => `Propuesta comercial para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, revisé la presencia pública de ${b} y preparé una propuesta conceptual."`,
    loomDemo: (b) => `"Este embudo para ${b} captura leads cualificados..."`,
    loomOffer: () => `"Canales, inversión y compensación se definirían después de verificar el proceso comercial actual."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Consulta gratuita con expertos de ${b}. Sin compromiso.`,
    adCopy: (b, o) => `Solicita información sobre ${o} en ${b}. Confirma credenciales y condiciones directamente.`,
    adPlatform: "Google Ads + LinkedIn Ads",
    niches: ["Abogacía", "Contabilidad", "Consultoría", "Diseño", "Marketing", "Programación", "Fotografía", "Traducción", "Coaching", "Consultoría RRHH"],
  },
  // Healthcare
  healthcare: {
    key: "healthcare", label: "Salud / Clínica", emoji: "🏥", color: "#0D9488", accent: "#0891B2",
    defaultPlatform: "Web + Google", defaultNiche: "Clínica", defaultOffer: "Servicio por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de citas pendiente de confirmar con auditoría",
    funnelType: "appointment", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} en ${n} — Cuidamos tu Salud`,
    funnelSubheadline: (n) => `Equipo médico especializado en ${n}. Atención personalizada.`,
    funnelCta: "Solicitar información", funnelBadge: "SERVICIO POR CONFIRMAR", funnelBonus: "Siguiente paso por confirmar",
    emailSubject: (n) => `Propuesta de experiencia digital para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, revisé el recorrido público de citas de ${b} y preparé una propuesta conceptual."`,
    loomDemo: (b) => `"Embudo de captación para ${b} — funciona para cualquier clínica..."`,
    loomOffer: () => `"Cualquier campaña requeriría confirmar servicios, cumplimiento, inversión y métricas actuales."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Tu salud es lo más importante. ${o} en ${b}.`,
    adCopy: (b, o) => `Solicita información sobre ${o} en ${b}. Confirma servicios y credenciales directamente.`,
    adPlatform: "Google Ads + Meta Ads",
    niches: ["Clínica Médica", "Dental", "Fisioterapia", "Nutrición", "Psicología", "Veterinaria", "Estética", "Podología", "Odontología", "Medicina Estética"],
  },
  // SaaS/Software
  saas: {
    key: "saas", label: "SaaS / Software", emoji: "💻", color: "#7C3AED", accent: "#06B6D4",
    defaultPlatform: "Web App", defaultNiche: "Software", defaultOffer: "Plan por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de activación pendiente de confirmar con auditoría",
    funnelType: "free_trial", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} en ${n} — Automatiza tu Negocio`,
    funnelSubheadline: (n) => `Conoce ${n} y confirma funciones, usuarios, implementación y condiciones.`,
    funnelCta: "Ver información", funnelBadge: "PLAN POR CONFIRMAR", funnelBonus: "Beneficio por confirmar",
    emailSubject: (n) => `Propuesta de conversión para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, revisé el recorrido público de activación de ${b} y preparé una propuesta conceptual."`,
    loomDemo: (b) => `"Embudo para ${b} — funciona para cualquier SaaS..."`,
    loomOffer: () => `"Canales, inversión y modelo comercial se definirían con métricas verificadas de adquisición y activación."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Conoce ${b}: ${o}.`,
    adCopy: (b, o) => `Consulta funciones, precio y condiciones de ${o} en ${b}.`,
    adPlatform: "LinkedIn Ads + Google Ads",
    niches: ["Productividad", "CRM", "Marketing", "Fintech", "EdTech", "HealthTech", "Recursos Humanos", "Analytics", "IA", "Desarrollo"],
  },
  // Real Estate
  realestate: {
    key: "realestate", label: "Inmobiliaria / Bienes Raíces", emoji: "🏠", color: "#B45309", accent: "#059669",
    defaultPlatform: "Web + Portales", defaultNiche: "Inmobiliaria", defaultOffer: "Servicio por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de captación pendiente de confirmar con auditoría",
    funnelType: "lead_magnet", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} en ${n} — Tu Propiedad Valorada`,
    funnelSubheadline: (n) => `${n}: Expertos en tu zona. Trato personalizado.`,
    funnelCta: "Solicitar información", funnelBadge: "SERVICIO POR CONFIRMAR", funnelBonus: "Siguiente paso por confirmar",
    emailSubject: (n) => `Propuesta de captación para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, revisé el recorrido público de ${b} y preparé una propuesta conceptual."`,
    loomDemo: (b) => `"Embudo para ${b} — funciona para cualquier inmobiliaria..."`,
    loomOffer: () => `"Canales, inversión y modelo comercial se definirían con métricas verificadas y aprobación previa."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `¿Vendes o compras? ${b} te ayuda. Valoración gratuita.`,
    adCopy: (b, o) => `Solicita información sobre ${o} en ${b}. Confirma alcance y condiciones directamente.`,
    adPlatform: "Meta Ads + Google Ads",
    niches: ["Residencial", "Comercial", "Lujo", "Inversión", "Alquiler", "Nueva Obra", "Rural", "Turistico", "Industrial", "Oficinas"],
  },
  // Coaching/Education
  coaching: {
    key: "coaching", label: "Coaching / Educación", emoji: "🎓", color: "#E11D48", accent: "#8B5CF6",
    defaultPlatform: "Web + Redes", defaultNiche: "Formación", defaultOffer: "Oferta por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de captación pendiente de confirmar con auditoría",
    funnelType: "webinar_registration", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} con ${n} — Tu Transformación`,
    funnelSubheadline: (n) => `Conoce la propuesta de ${n} y confirma metodología, experiencia y condiciones.`,
    funnelCta: "Solicitar información", funnelBadge: "OFERTA POR CONFIRMAR", funnelBonus: "Siguiente paso por confirmar",
    emailSubject: (n) => `Propuesta comercial para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, revisé la presencia pública de ${b} y preparé una propuesta conceptual."`,
    loomDemo: (b) => `"Embudo para ${b} — funciona para cualquier coaching..."`,
    loomOffer: () => `"Canales, inversión y compensación se definirían con datos verificados y aprobación previa."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Transforma tu vida con ${b}. Sesión gratuita.`,
    adCopy: (b, o) => `Reserva tu ${o} en ${b}. Cambia tu futuro.`,
    adPlatform: "Meta Ads + YouTube Ads",
    niches: ["Desarrollo Personal", "Negocios", "Salud", "Finanzas", "Relaciones", "Productividad", "Liderazgo", "Ventas", "Motivación", "Emprendimiento"],
  },
  // Agency/Consulting
  agency: {
    key: "agency", label: "Agencia / Consultoría", emoji: "🚀", color: "#0EA5E9", accent: "#F43F5E",
    defaultPlatform: "Web + Portfolio", defaultNiche: "Agencia", defaultOffer: "Servicio por confirmar", defaultPrice: "Consultar",
    defaultPainPoint: "Oportunidad de captación pendiente de confirmar con auditoría",
    funnelType: "audit_offer", liftPercent: 0,
    funnelHeadline: (n, o) => `${o} por ${n} — Escala tu Negocio`,
    funnelSubheadline: (n) => `Conoce los servicios de ${n} y confirma alcance, experiencia y condiciones.`,
    funnelCta: "Solicitar información", funnelBadge: "SERVICIO POR CONFIRMAR", funnelBonus: "Siguiente paso por confirmar",
    emailSubject: (n) => `Propuesta comercial para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nRevisé la presencia digital pública de ${biz} y preparé una propuesta conceptual para simplificar el recorrido comercial.\n\nPuedes revisarla aquí:\n/funnel/${s}\n\n¿Te parece útil comentarla durante 15 minutos?\n\nSaludos,\nEcoScale Partner`,
    loomHook: (c, b, o) => `"Hola ${c}, revisé la presencia pública de ${b} y preparé una propuesta conceptual."`,
    loomDemo: (b) => `"Embudo para ${b} — funciona para cualquier agencia..."`,
    loomOffer: () => `"Canales, inversión y compensación se definirían con métricas verificadas y aprobación previa."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Conoce ${b}: ${o}.`,
    adCopy: (b, o) => `Solicita información sobre ${o} en ${b}. Confirma alcance y condiciones.`,
    adPlatform: "LinkedIn Ads + Google Ads",
    niches: ["Marketing", "Diseño", "Social Media", "SEO/SEM", "Branding", "Web", "Ads", "Consultoría", "IT", "Recursos Humanos"],
  },
};

export const INDUSTRY_LIST = Object.values(INDUSTRIES);

export function getIndustry(key: string): IndustryConfig {
  return INDUSTRIES[key] || INDUSTRIES.general;
}
