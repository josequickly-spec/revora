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
    defaultPlatform: "Sitio web", defaultNiche: "Negocio local o digital", defaultOffer: "Evaluación gratuita", defaultPrice: "Consultar",
    defaultPainPoint: "El sitio recibe visitas pero no genera suficientes consultas o clientes",
    funnelType: "lead_generation", liftPercent: 25,
    funnelHeadline: (n, o) => `${o} en ${n}`,
    funnelSubheadline: (n) => `Conoce cómo ${n} puede ayudarte y solicita información sin compromiso.`,
    funnelCta: "Solicitar información", funnelBadge: "EVALUACIÓN SIN COMPROMISO", funnelBonus: "Recomendación personalizada incluida",
    emailSubject: (n) => `Preparé una oportunidad de crecimiento para ${n}`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nAnalicé la presencia digital de ${biz} y encontré oportunidades concretas para generar más consultas y clientes.\n\nPreparé una propuesta aquí:\n/funnel/${s}\n\n¿Podemos hablar 10 minutos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, analicé ${b} y encontré oportunidades para conseguir más clientes..."`,
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
    defaultPlatform: "Shopify/WooCommerce", defaultNiche: "Productos Digitales", defaultOffer: "Oferta Especial del Día", defaultPrice: "29.99",
    defaultPainPoint: "Sin embudo de captación — el tráfico no se convierte en clientes",
    funnelType: "flash_sale", liftPercent: 25,
    funnelHeadline: (n, o) => `Oferta Exclusiva: ${o} con Descuento Especial`,
    funnelSubheadline: (n) => `Productos de calidad en ${n}. Garantía y envío rápido.`,
    funnelCta: "Quiero Mi Oferta Ahora", funnelBadge: "🔥 DESCUENTO + ENVÍO GRATIS", funnelBonus: "Garantía extendida incluida",
    emailSubject: (n) => `He creado un embudo para ${n} (gratis) 🚀`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\nHe analizado ${biz} y veo que puedes aumentar tus ventas con un embudo optimizado.\n\nTe lo regalo gratis aquí:\n👉 /funnel/${s}\n\n¿Hablamos 5 minutos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede facturar un 30-50% más con un embudo dedicado..."`,
    loomDemo: (b) => `"Mira este embudo que he creado para ${b} — funciona para cualquier tienda online..."`,
    loomOffer: () => `"Te propongo Meta Ads a coste CERO. Solo cobro un % de lo que generemos extra."`,
    loomCta: () => `"¿15 minutos esta semana?"`,
    adHook: (b, o) => `Descubre ${o} en ${b}. Oferta especial disponible ahora.`,
    adCopy: (b, o) => `Aprovecha esta oferta única en ${b}. Stock limitado.`,
    adPlatform: "Meta Ads + Google Shopping",
    niches: ["Cosmética", "Ropa", "Tecnología", "Mascotas", "Alimentación", "Hogar", "Deporte", "Libros", "Arte", "Servicios"],
  },
  // Restaurant (any size)
  restaurant: {
    key: "restaurant", label: "Restaurante / Hostelería", emoji: "🍽️", color: "#DC2626", accent: "#F59E0B",
    defaultPlatform: "Google Business + Web", defaultNiche: "Cocina Tradicional", defaultOffer: "Menú del Día + Bebida", defaultPrice: "18",
    defaultPainPoint: "Dependes de reservas manuales y no tienes captación online",
    funnelType: "reservation", liftPercent: 30,
    funnelHeadline: (n, o) => `${o} en ${n} — Reserva Fácil Online`,
    funnelSubheadline: (n) => `Ambiente único en ${n}. Cocina casera con productos frescos.`,
    funnelCta: "Reservar Mesa Ahora", funnelBadge: "🍷 RESERVA + BEBIDA GRATIS", funnelBonus: "Entrada o postre incluido",
    emailSubject: (n) => `Te ayudo a llenar más mesas en ${n} (gratis) 🍽️`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\n${biz} puede recibir más reservas con un sistema online.\n\nTe lo preparo gratis:\n👉 /funnel/${s}\n\n¿Hablamos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede recibir 15-25 reservas extra por semana..."`,
    loomDemo: (b) => `"Este embudo de reservas para ${b} captura clientes directamente..."`,
    loomOffer: () => `"Instagram + Google Ads a coste CERO. Solo cobro % de reservas extra."`,
    loomCta: () => `"¿5 minutos mañana?"`,
    adHook: (b, o) => `${o} en ${b}. La mejor experiencia culinaria de la zona.`,
    adCopy: (b, o) => `Reserva tu mesa en ${b} y disfruta de ${o}. Plazas limitadas.`,
    adPlatform: "Instagram Ads + Google Ads Local",
    niches: ["Restaurante Tradicional", "Pizzería", "Sushi", "Mediterráneo", "Tapas", "Vegano", "Brunch", "Cafetería", "Bar", "Catering"],
  },
  // Gym/Fitness (any size)
  gym: {
    key: "gym", label: "Gimnasio / Fitness", emoji: "💪", color: "#059669", accent: "#F97316",
    defaultPlatform: "Web + App", defaultNiche: "Gimnasio Integral", defaultOffer: "Clase de Prueba Gratis", defaultPrice: "Gratis",
    defaultPainPoint: "Pocos socios nuevos y alta rotación",
    funnelType: "free_trial", liftPercent: 35,
    funnelHeadline: (n, o) => `${o} en ${n} — Tu Prueba Gratis`,
    funnelSubheadline: (n) => `Instalaciones modernas en ${n}. Entrenadores certificados.`,
    funnelCta: "Quiero Mi Clase Gratis", funnelBadge: "💪 PRUEBA GRATIS + ASESORÍA", funnelBonus: "Plan personalizado incluido",
    emailSubject: (n) => `Más socios para ${n} (gratis) 💪`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\n${biz} puede crecer con captación online.\n\nEmbudo gratis aquí:\n👉 /funnel/${s}\n\n¿Hablamos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede tener 20-40 socios extra al mes..."`,
    loomDemo: (b) => `"Este embudo para ${b} captura y convierte leads en socios..."`,
    loomOffer: () => `"Tráfico local con Meta Ads. Solo cobro % de altas extra."`,
    loomCta: () => `"¿10 minutos esta semana?"`,
    adHook: (b, o) => `Tu primera clase GRATIS en ${b}. Sin compromiso.`,
    adCopy: (b, o) => `Pruébame gratis en ${b}. Clase + asesoría personalizada.`,
    adPlatform: "Meta Ads + Google Ads",
    niches: ["Gimnasio", "CrossFit", "Yoga", "Pilates", "Boxeo", "Spinning", "Personal", "Funcional", "Artes Marciales", "Fuerza"],
  },
  // Professional Services
  professional: {
    key: "professional", label: "Servicios Profesionales", emoji: "👨‍💼", color: "#0891B2", accent: "#6366F1",
    defaultPlatform: "Web + LinkedIn", defaultNiche: "Abogacía", defaultOffer: "Consulta Inicial Gratis", defaultPrice: "Gratis",
    defaultPainPoint: "Dependes de referidos y networking sin captación sistemática",
    funnelType: "lead_magnet", liftPercent: 40,
    funnelHeadline: (n, o) => `${o} en ${n} — Expertos a tu Disposición`,
    funnelSubheadline: (n) => `Más de 15 años de experiencia en ${n}. Resultados garantizados.`,
    funnelCta: "Solicitar Consulta Gratuita", funnelBadge: "⚖️ CONSULTA GRATIS + EVALUACIÓN", funnelBonus: "Informe completo sin coste",
    emailSubject: (n) => `Te ayudo a conseguir más clientes en ${n} (gratis) 👨‍💼`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\n${biz} puede recibir más consultas con captación online.\n\nTe lo preparo gratis:\n👉 /funnel/${s}\n\n¿Hablamos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede recibir 10-20 consultas extra al mes..."`,
    loomDemo: (b) => `"Este embudo para ${b} captura leads cualificados..."`,
    loomOffer: () => `"Tráfico con Google + LinkedIn Ads. Solo cobro % de casos won."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Consulta gratuita con expertos de ${b}. Sin compromiso.`,
    adCopy: (b, o) => `Reserva tu ${o} en ${b}. Profesionales certificados.`,
    adPlatform: "Google Ads + LinkedIn Ads",
    niches: ["Abogacía", "Contabilidad", "Consultoría", "Diseño", "Marketing", "Programación", "Fotografía", "Traducción", "Coaching", "Consultoría RRHH"],
  },
  // Healthcare
  healthcare: {
    key: "healthcare", label: "Salud / Clínica", emoji: "🏥", color: "#0D9488", accent: "#0891B2",
    defaultPlatform: "Web + Google", defaultNiche: "Clínica Médica", defaultOffer: "Primera Consulta Gratis", defaultPrice: "Gratis",
    defaultPainPoint: "Pocos pacientes nuevos y dependencia de derivaciones",
    funnelType: "appointment", liftPercent: 35,
    funnelHeadline: (n, o) => `${o} en ${n} — Cuidamos tu Salud`,
    funnelSubheadline: (n) => `Equipo médico especializado en ${n}. Atención personalizada.`,
    funnelCta: "Pedir Cita Gratuita", funnelBadge: "🏥 CONSULTA GRATIS + VALORACIÓN", funnelBonus: "Estudio completo incluido",
    emailSubject: (n) => `Más pacientes para ${n} (gratis) 🏥`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\n${biz} puede recibir más pacientes con captación online.\n\nEmbudo gratis:\n👉 /funnel/${s}\n\n¿Hablamos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede recibir 10-20 pacientes extra al mes..."`,
    loomDemo: (b) => `"Embudo de captación para ${b} — funciona para cualquier clínica..."`,
    loomOffer: () => `"Tráfico local con Google + Meta Ads. Solo cobro % de pacientes nuevos."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Tu salud es lo más importante. ${o} en ${b}.`,
    adCopy: (b, o) => `Primera consulta gratuita en ${b}. Profesionales certificados.`,
    adPlatform: "Google Ads + Meta Ads",
    niches: ["Clínica Médica", "Dental", "Fisioterapia", "Nutrición", "Psicología", "Veterinaria", "Estética", "Podología", "Odontología", "Medicina Estética"],
  },
  // SaaS/Software
  saas: {
    key: "saas", label: "SaaS / Software", emoji: "💻", color: "#7C3AED", accent: "#06B6D4",
    defaultPlatform: "Web App", defaultNiche: "Productividad", defaultOffer: "Prueba Gratis 14 Días", defaultPrice: "49/mes",
    defaultPainPoint: "Baja tasa de conversión visitor → cliente",
    funnelType: "free_trial", liftPercent: 30,
    funnelHeadline: (n, o) => `${o} en ${n} — Automatiza tu Negocio`,
    funnelSubheadline: (n) => `Más de 1.000 equipos usan ${n}. Setup inmediato.`,
    funnelCta: "Empezar Prueba Gratis", funnelBadge: "🚀 PRUEBA GRATIS + ONBOARDING", funnelBonus: "Soporte premium incluido",
    emailSubject: (n) => `Duplicar clientes para ${n} (gratis) 💻`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\n${biz} puede crecer con embudo optimizado.\n\nTe lo preparo gratis:\n👉 /funnel/${s}\n\n¿Hablamos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede triplicar signups con embudo correcto..."`,
    loomDemo: (b) => `"Embudo para ${b} — funciona para cualquier SaaS..."`,
    loomOffer: () => `"Tráfico B2B con LinkedIn + Google Ads. Solo cobro % de MRR extra."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `La herramienta que necesitas: ${b}. Prueba gratis.`,
    adCopy: (b, o) => `Automatiza con ${b}. Prueba 14 días sin tarjeta.`,
    adPlatform: "LinkedIn Ads + Google Ads",
    niches: ["Productividad", "CRM", "Marketing", "Fintech", "EdTech", "HealthTech", "Recursos Humanos", "Analytics", "IA", "Desarrollo"],
  },
  // Real Estate
  realestate: {
    key: "realestate", label: "Inmobiliaria / Bienes Raíces", emoji: "🏠", color: "#B45309", accent: "#059669",
    defaultPlatform: "Web + Portales", defaultNiche: "Residencial", defaultOffer: "Valoración Gratuita", defaultPrice: "Gratis",
    defaultPainPoint: "Dependes de portales externos sin captación directa",
    funnelType: "lead_magnet", liftPercent: 35,
    funnelHeadline: (n, o) => `${o} en ${n} — Tu Propiedad Valorada`,
    funnelSubheadline: (n) => `${n}: Expertos en tu zona. Trato personalizado.`,
    funnelCta: "Solicitar Valoración", funnelBadge: "🏠 VALORACIÓN GRATIS + VISITA", funnelBonus: "Informe completo sin coste",
    emailSubject: (n) => `Más propietarios para ${n} (gratis) 🏠`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\n${biz} puede recibir más propietarios con embudo online.\n\nTe lo preparo gratis:\n👉 /funnel/${s}\n\n¿Hablamos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede recibir 15-25 propietarios extra al mes..."`,
    loomDemo: (b) => `"Embudo para ${b} — funciona para cualquier inmobiliaria..."`,
    loomOffer: () => `"Tráfico local con Meta + Google Ads. Solo cobro % de comisiones extra."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `¿Vendes o compras? ${b} te ayuda. Valoración gratuita.`,
    adCopy: (b, o) => `Conocer el valor real de tu propiedad en ${b}. Gratis.`,
    adPlatform: "Meta Ads + Google Ads",
    niches: ["Residencial", "Comercial", "Lujo", "Inversión", "Alquiler", "Nueva Obra", "Rural", "Turistico", "Industrial", "Oficinas"],
  },
  // Coaching/Education
  coaching: {
    key: "coaching", label: "Coaching / Educación", emoji: "🎓", color: "#E11D48", accent: "#8B5CF6",
    defaultPlatform: "Web + Redes", defaultNiche: "Desarrollo Personal", defaultOffer: "Sesión Estratégica Gratis", defaultPrice: "Gratis",
    defaultPainPoint: "Captación limitada a redes orgánicas sin escalabilidad",
    funnelType: "webinar_registration", liftPercent: 40,
    funnelHeadline: (n, o) => `${o} con ${n} — Tu Transformación`,
    funnelSubheadline: (n) => `Método probado en ${n}. Resultados garantizados.`,
    funnelCta: "Reservar Sesión Gratis", funnelBadge: "🎓 SESIÓN GRATIS + PLAN", funnelBonus: "Plan de acción personalizado",
    emailSubject: (n) => `Más clientes premium para ${n} (gratis) 🎓`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\n${biz} puede escalar con embudo de captación.\n\nTe lo preparo gratis:\n👉 /funnel/${s}\n\n¿Hablamos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede duplicar clientes premium con embudo..."`,
    loomDemo: (b) => `"Embudo para ${b} — funciona para cualquier coaching..."`,
    loomOffer: () => `"Tráfico con Meta + YouTube Ads. Solo cobro % de revenue extra."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Transforma tu vida con ${b}. Sesión gratuita.`,
    adCopy: (b, o) => `Reserva tu ${o} en ${b}. Cambia tu futuro.`,
    adPlatform: "Meta Ads + YouTube Ads",
    niches: ["Desarrollo Personal", "Negocios", "Salud", "Finanzas", "Relaciones", "Productividad", "Liderazgo", "Ventas", "Motivación", "Emprendimiento"],
  },
  // Agency/Consulting
  agency: {
    key: "agency", label: "Agencia / Consultoría", emoji: "🚀", color: "#0EA5E9", accent: "#F43F5E",
    defaultPlatform: "Web + Portfolio", defaultNiche: "Marketing Digital", defaultOffer: "Auditoría Gratuita", defaultPrice: "Gratis",
    defaultPainPoint: "Dependes de referidos sin captación sistemática",
    funnelType: "audit_offer", liftPercent: 40,
    funnelHeadline: (n, o) => `${o} por ${n} — Escala tu Negocio`,
    funnelSubheadline: (n) => `${n} impulsa resultados digitales. Audit sin compromiso.`,
    funnelCta: "Solicitar Auditoría Gratis", funnelBadge: "🚀 AUDITORÍA GRATIS + PLAN", funnelBonus: "Estrategia 90 días incluida",
    emailSubject: (n) => `Más clientes para ${n} (gratis) 🚀`,
    emailBody: (biz, c, o, s) => `Hola ${c},\n\n${biz} puede escalar con embudo de captación.\n\nTe lo preparo gratis:\n👉 /funnel/${s}\n\n¿Hablamos?\n\nSaludos,\nRevora`,
    loomHook: (c, b, o) => `"Hola ${c}, ${b} puede recibir 5-10 clientes extra al mes..."`,
    loomDemo: (b) => `"Embudo para ${b} — funciona para cualquier agencia..."`,
    loomOffer: () => `"Tráfico B2B con LinkedIn + Google Ads. Solo cobro % de retainers extra."`,
    loomCta: () => `"¿15 minutos?"`,
    adHook: (b, o) => `Tu negocio necesita resultados digitales. ${b} te ayuda. Gratis.`,
    adCopy: (b, o) => `Auditoría digital completa gratis en ${b}.`,
    adPlatform: "LinkedIn Ads + Google Ads",
    niches: ["Marketing", "Diseño", "Social Media", "SEO/SEM", "Branding", "Web", "Ads", "Consultoría", "IT", "Recursos Humanos"],
  },
};

export const INDUSTRY_LIST = Object.values(INDUSTRIES);

export function getIndustry(key: string): IndustryConfig {
  return INDUSTRIES[key] || INDUSTRIES.general;
}
