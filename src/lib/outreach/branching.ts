export type OutreachStep = 
  | "email_1" 
  | "email_2" 
  | "email_3" 
  | "email_4" 
  | "email_5" 
  | "responded" 
  | "closed";

export interface BranchingState {
  businessId: number;
  currentStep: OutreachStep;
  lastSentAt?: string;
  responded: boolean;
  nextActionDate?: string;
}

export interface FollowUpEmail {
  step: OutreachStep;
  subject: string;
  body: string;
  daysToWait: number;
}

/**
 * Decision tree for outreach sequence
 */
export function getNextStep(current: OutreachStep, hasResponded: boolean): OutreachStep {
  if (hasResponded) return "responded";

  switch (current) {
    case "email_1": return "email_2";
    case "email_2": return "email_3";
    case "email_3": return "email_4";
    case "email_4": return "email_5";
    case "email_5": return "closed";
    default: return "closed";
  }
}

export const FOLLOW_UP_TEMPLATES: Record<OutreachStep, FollowUpEmail> = {
  email_1: {
    step: "email_1",
    subject: "2 ideas para {{businessName}}",
    body: `Hola {{contactName}},

Estuve revisando {{businessName}} y encontré dos puntos que me parecieron interesantes.

1. Captación — Visitantes que abandonan sin dejar contacto tienen poca continuidad.
2. Descubrimiento de productos — Oportunidad de conectar productos principales con recomendaciones relevantes.

A partir de esto preparé una propuesta conceptual. Si te interesa verla, responde "Sí" y te envío el preview junto con un video de 90 segundos.

Saludos`,
    daysToWait: 3,
  },
  email_2: {
    step: "email_2",
    subject: "Re: 2 ideas para {{businessName}}",
    body: `Hola {{contactName}},

Te escribo por si mi correo anterior se perdió.

Preparé la propuesta específicamente a partir de los dos puntos que encontré revisando el recorrido de {{businessName}}.

Si quieres verla, te la comparto por aquí. No requiere ninguna llamada.

Saludos`,
    daysToWait: 4,
  },
  email_3: {
    step: "email_3",
    subject: "Una idea más sobre {{businessName}}",
    body: `Hola {{contactName}},

Una de las razones por las que preparé la propuesta es la oportunidad que observé en captación.

En el preview planteé una forma sencilla de conectar ese punto con el recorrido actual.

Si quieres, te envío directamente el enlace para que lo revises cuando tengas tiempo.

Saludos`,
    daysToWait: 5,
  },
  email_4: {
    step: "email_4",
    subject: "Último seguimiento sobre {{businessName}}",
    body: `Hola {{contactName}},

Quería hacer un último seguimiento sobre la propuesta que preparé para {{businessName}}.

Si mejorar este recorrido no es una prioridad ahora mismo, ningún problema.

Si sí lo es, puedo enseñarte en 15 minutos cómo plantearía la implementación.

Saludos`,
    daysToWait: 6,
  },
  email_5: {
    step: "email_5",
    subject: "Cierro esto por ahora",
    body: `Hola {{contactName}},

Cierro por aquí para no llenar tu bandeja.

Guardaré el análisis y el preview que preparé para {{businessName}}.

Si más adelante quieren explorar estas mejoras, puedo actualizar la propuesta con el estado actual del sitio.

Gracias por el tiempo.

Saludos`,
    daysToWait: 0,
  },
  responded: {
    step: "responded",
    subject: "",
    body: "",
    daysToWait: 0,
  },
  closed: {
    step: "closed",
    subject: "",
    body: "",
    daysToWait: 0,
  },
};

export function shouldSendFollowUp(state: BranchingState): boolean {
  if (state.responded) return false;
  if (!state.lastSentAt) return true;

  const last = new Date(state.lastSentAt);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  const template = FOLLOW_UP_TEMPLATES[state.currentStep];
  return daysPassed >= template.daysToWait;
}
