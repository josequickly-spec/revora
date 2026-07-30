# Guía: Llevar Revora a Producción Real

## 🎯 Stack Producción Recomendado

| Componente | Servicio | Costo | Setup |
|---|---|---|---|
| **BD PostgreSQL** | Supabase | **Gratis** (hasta 500MB) | 2 min |
| **Autenticación** | Integrada | **Incluida** | 3 min |
| **Email Real** | Resend | **Gratis dev**, $20/mes prod | 3 min |
| **Hosting** | Vercel | **Gratis** (hobby) | 2 min |
| **Total Mes 1** | — | **$0** | — |

---

## PASO 1: Base de Datos PostgreSQL Real (Supabase)

### 1.1 Crear proyecto en Supabase

1. Ve a https://supabase.com
2. Click "Sign Up" (usa GitHub)
3. Crea org y proyecto (región: Europe/us-east-1)
4. Espera 2 min a que se provisione

### 1.2 Obtener conexión

En tu proyecto Supabase:
- Navega a **Settings > Database** 
- Copia la URL de conexión (debajo de "Connection String"):
  ```
  postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
  ```

### 1.3 Actualizar `.env.local`

Reemplaza en `C:\...\automated-shopify-lead-outreach (3)\.env.local`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres"
NODE_ENV=development
```

### 1.4 Ejecutar migraciones (crear tablas)

En tu proyecto local:

```bash
npm run init
```

Esto usa Drizzle para crear las tablas en Supabase.

---

## PASO 2: Autenticación integrada

Genera dos secretos aleatorios diferentes, de al menos 32 caracteres, y agrégalos a `.env.local`:

```env
DATABASE_URL="postgresql://..."
AUTH_JWT_SECRET="RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"
AUTH_ENCRYPTION_KEY="DIFFERENT_RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"
NODE_ENV=development
```

---

## PASO 3: Email Real (Resend)

### 3.1 Crear cuenta en Resend

1. Ve a https://resend.com
2. Sign up (GitHub)
3. Copia tu **API Key**

### 3.2 Instalar Resend

```bash
npm install resend
```

### 3.3 Agregar API Key

En `.env.local`:

```env
RESEND_API_KEY="re_..."
```

### 3.4 Crear servicio de email

Crea `src/lib/email.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOutreachEmail(
  to: string,
  subject: string,
  body: string,
  fromEmail: string = "noreply@turevora.com"
) {
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
    });
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
```

### 3.5 Usar en API

Actualiza `src/app/api/outreach/route.ts`:

```typescript
import { sendOutreachEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Enviar email real
    await sendOutreachEmail(
      body.email,
      body.emailSubject,
      body.emailBody
    );

    // Guardar en BD
    const campaign = {
      id: Math.max(...mockData.outreachCampaigns.map(c => c.id || 0)) + 1,
      businessId: body.businessId,
      email: body.email,
      status: "sent",
      sentAt: new Date().toISOString(),
    };
    mockData.outreachCampaigns.push(campaign);

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## PASO 4: Conectar BD Real a Rutas API

### 4.1 Cambiar `src/db/index.ts` a PostgreSQL real

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL as string);
export const db = drizzle(client);
```

### 4.2 Instalar driver PostgreSQL

```bash
npm install postgres
```

### 4.3 Actualizar rutas API para usar BD real

Ejemplo `src/app/api/businesses/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, funnels, contacts } from "@/db/schema";

export async function GET() {
  try {
    const data = await db.select().from(businesses);
    return NextResponse.json({ success: true, businesses: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ind = getIndustry(body.businessType || "ecommerce");

    const [newBiz] = await db.insert(businesses).values({
      name: body.name,
      domain: body.domain,
      country: body.country,
      businessType: body.businessType,
      niche: body.niche,
      monthlyRevenue: body.monthlyRevenue,
      brandColor: body.brandColor || ind.color,
      heroOffer: body.heroOffer,
      heroPrice: body.heroPrice,
    }).returning();

    return NextResponse.json({ success: true, business: newBiz });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## PASO 5: Deploy en Vercel

### 5.1 Pushear código a GitHub

```bash
git init
git add .
git commit -m "Revora v1 - Production ready"
git branch -M main
git remote add origin https://github.com/tuusuario/revora.git
git push -u origin main
```

### 5.2 Deploy en Vercel

1. Ve a https://vercel.com
2. Click "New Project"
3. Conecta tu repo GitHub
4. En "Environment Variables" agrega:
   ```
   DATABASE_URL=postgresql://...
   AUTH_JWT_SECRET=random_secret_with_at_least_32_characters
   AUTH_ENCRYPTION_KEY=different_random_secret_with_at_least_32_characters
   RESEND_API_KEY=re_...
   ```
5. Click "Deploy"

**Listo en 2 minutos — tu app está en producción real.**

---

## PASO 6: Validar Contactos Reales (Hunter.io - Opcional)

Si quieres emails verificados automáticamente:

### 6.1 API de Hunter

```bash
npm install axios
```

### 6.2 En `src/lib/hunter.ts`:

```typescript
import axios from "axios";

export async function verifyEmail(email: string, domain: string) {
  try {
    const res = await axios.get("https://api.hunter.io/v2/email-verifier", {
      params: {
        domain: domain,
        email: email,
        domain_search: true,
      },
      headers: {
        "Authorization": `Bearer ${process.env.HUNTER_API_KEY}`,
      },
    });
    return res.data.data.result === "deliverable";
  } catch (error) {
    return false;
  }
}
```

---

## CHECKLIST PRODUCCIÓN

- [ ] Supabase: Base de datos creada y conectada
- [ ] Clerk: Auth configurada en `.env.local`
- [ ] Resend: API Key agregada
- [ ] `npm install postgres`
- [ ] `db/index.ts` actualizado para PostgreSQL real
- [ ] Rutas API actualizadas para usar BD real
- [ ] GitHub repo creado
- [ ] Vercel deploy completado
- [ ] Variables de entorno en Vercel Dashboard
- [ ] Test: Crear negocio, enviar email, login funciona

---

## URLs Útiles

- **Supabase Dashboard:** https://app.supabase.com
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Resend Dashboard:** https://app.resend.com
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## Costo Mensual (cuando creces)

| Servicio | Gratis | Uso Típico | 10k Users |
|---|---|---|---|
| Supabase | 500MB | $25/mes | $100+/mes |
| Clerk | 10k users | Gratis | $200+/mes |
| Resend | Dev gratis | $20/mes | $100+/mes |
| Vercel | Gratis | Gratis | $50+/mes |
| **TOTAL** | **$0** | **~$45** | **~$400** |

---

## ¿Necesitas ayuda con algo específico?

- ¿Quieres que configure Supabase ahora?
- ¿Que agreguemos Clerk?
- ¿Que hagamos el primer deploy a Vercel?

Dime y lo hacemos paso a paso. 🚀
