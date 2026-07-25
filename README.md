# Revora — Revenue OS para Agencias

Plataforma universal de adquisición de clientes para cualquier negocio. Automatiza embudos, contactos, outreach y modelos de revenue-share.

**Status:** ✅ Desarrollo Local | 🚀 Listo para Producción

## 🚀 Quick Start Local (Sin BD externa)

### 1. Clonar e instalar dependencias

```bash
cd "C:\Users\Administrator\Pictures\automated-shopify-lead-outreach (3)"
npm install
```

### 2. Inicializar base de datos (SQLite local)

```bash
npm run init
```

Esto crea `data.db` en la raíz del proyecto.

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

---

## 📦 Stack

- **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4
- **Base de datos:** SQLite (better-sqlite3) — archivo local `data.db`
- **ORM:** Drizzle ORM
- **Autenticación:** Ninguna (desarrollo local)

---

## 📂 Estructura

```
src/
├── app/
│   ├── page.tsx           # Dashboard principal (5 pestañas)
│   ├── layout.tsx         # Metadata y layout
│   ├── funnel/[slug]/     # Página pública del embudo
│   ├── api/               # Rutas API
│   │   ├── businesses/    # CRUD negocios
│   │   ├── funnels/       # CRUD embudos
│   │   ├── contacts/      # CRUD contactos
│   │   ├── outreach/      # Envío de emails (simulado)
│   │   ├── proposals/     # CRUD propuestas
│   │   └── health/        # Health check
│   └── globals.css
├── db/
│   ├── index.ts           # Conexión a SQLite
│   └── schema.ts          # Esquema Drizzle
├── lib/
│   └── industries.ts      # Config de 9 industrias
└── ...
```

---

## 🎯 Funcionalidades (5 Pasos)

### 1. **Descubrir** (Discover)
- Explora negocios por industria, país, ingresos
- Seed data con 12 negocios pre-cargados

### 2. **Embudo** (Funnels)
- Genera embudo personalizado por sector
- Preview en vivo del funnel
- Link compartible en `/funnel/{slug}`

### 3. **Contacto** (Contacts)
- Email verificado del decisor
- Score de confianza
- LinkedIn profile

### 4. **Outreach** (Pitch)
- Email hiperpersonalizado
- Guión Loom de 90 segundos
- Copiar/Enviar simulado

### 5. **Rev-Share** (Calculator)
- Cálculo de facturación extra
- Comisión variable (15-40%)
- Propuesta de ads por industria

**Bonus:** CRM tipo Kanban con 5 stages.

---

## 🛠️ Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run init` | Crea las tablas SQLite en `data.db` |
| `npm run dev` | Inicia servidor en `http://localhost:3000` |
| `npm run build` | Build para producción |
| `npm start` | Ejecuta build de producción |
| `npm run lint` | Lint con ESLint |
| `npm run typecheck` | TypeScript check |

---

## 📊 Base de Datos

Todas las tablas están en **SQLite** (`data.db`):

- **businesses** — Negocios descubiertos
- **funnels** — Embudos por negocio
- **contacts** — Contactos verificados
- **outreach_campaigns** — Emails enviados
- **proposals** — Propuestas de revenue-share

Datos de seed se crean automáticamente en `/api/businesses` (primera solicitud).

---

## 🔐 Seguridad (Local)

En desarrollo local:
- ✅ Sin autenticación (acceso libre a `localhost:3000`)
- ✅ Sin email real (botón "Enviar Simulado")
- ✅ SQLite en archivo local (no expuesto)

**Para producción necesitas:**
- [ ] Autenticación (NextAuth, Clerk, etc.)
- [ ] Email real (Resend, SendGrid, etc.)
- [ ] HTTPS
- [ ] Base de datos remota (si necesario)

---

## 🔐 Producción Real (PostgreSQL + Auth + Email)

Para llevar a producción con servicios REALES, sigue **SETUP_PRODUCCION.md**

### Resumen Producción

| Componente | Local | Producción |
|---|---|---|
| **BD** | Mock en memoria | PostgreSQL (Supabase) |
| **Auth** | Ninguna | Clerk (Gratis hasta 10k users) |
| **Email** | Simulado | Resend ($0 dev, $20/mes) |
| **Hosting** | localhost:3000 | Vercel (Gratis hobby plan) |
| **Costo Mes 1** | $0 | $0 |
| **Costo Escalado** | — | ~$45/mes |

### Archivos de Producción

- `SETUP_PRODUCCION.md` — Guía paso a paso completa
- `.env.example` — Variables de entorno requeridas
- `src/middleware.ts` — Autenticación con Clerk
- `src/lib/email.ts` — Servicio de email con Resend

## 📝 Notas de Desarrollo

- Los emails de seed data son ficticios — usa tus propios contactos en producción
- La BD local usa mock en memoria — datos se pierden al reiniciar
- Outreach es simulado sin `.env` configurado — necesita Resend API Key
- Sin autenticación en desarrollo — Clerk se agrega en producción

---

## 🚀 Deploy a Producción

### Vercel (recomendado)

```bash
npm install -g vercel
vercel
```

Luego configura en Vercel Dashboard:
- Base de datos remota (Supabase, Railway, etc.)
- Integración de email real

### Variables de entorno requeridas

Para producción, agrega a `.env.local`:

```
DATABASE_URL=postgresql://...  # Si usas Postgres
NEXTAUTH_SECRET=...             # Para auth
RESEND_API_KEY=...              # Para email
```

---

## 📧 Próximas Integraciones

- [ ] NextAuth con GitHub/Google
- [ ] Resend o SendGrid para email real
- [ ] Hunter.io para validación de contactos
- [ ] Stripe para facturación
- [ ] Analytics dashboard

---

## 📄 Licencia

Desarrollo local. Uso privado.

---

**¿Preguntas?** Revisa el código en `src/app/page.tsx` — es autodocumentado.
