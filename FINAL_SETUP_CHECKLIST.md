# ✅ REVORA - CHECKLIST FINAL PARA PRODUCCIÓN (Sin Mock)

**Status**: 60% implementado, 40% requiere configuración manual

---

## 🎯 CHECKLIST DE CONFIGURACIÓN

### FASE 1: Bases Necesarias ✅ COMPLETADAS

- [x] PostgreSQL/Supabase conectado
- [x] OpenAI API GPT-4o funcionando
- [x] Resend API integrado
- [x] Campaign generation sin mock
- [x] Database persistence sin mock
- [x] Proyecciones cálculos reales
- [x] Webhook estructura (Resend, Google, Meta, Analytics)

---

### FASE 2: Tokens & Credenciales ⏳ REQUIERE ACCIÓN

**Agregar a `.env.local`:**

```env
# 1. VERCEL DEPLOYMENT
VERCEL_TOKEN="vercel_XXXXXXXXXXXXX"          # De: https://vercel.com/account/tokens
VERCEL_ORG_ID="org_XXXXXXXXXXXXX"            # De: https://vercel.com/account/settings

# 2. GOOGLE ADS
GOOGLE_ADS_CUSTOMER_ID="1234567890"          # Tu Google Ads Customer ID
GOOGLE_ADS_ACCESS_TOKEN="ya29.XXXXX"         # OAuth token de Google
GOOGLE_ADS_DEVELOPER_TOKEN="XXXXX"           # Developer token de Google Ads API

# 3. META BUSINESS
META_ACCESS_TOKEN="EAAB..."                  # App Access Token de Meta
META_BUSINESS_ACCOUNT_ID="123456789"         # Facebook Business Account ID
META_WEBHOOK_VERIFY_TOKEN="random_string"    # Token cualquiera para verificación
META_WEBHOOK_SECRET="webhook_secret_key"     # Para firmar webhooks

# 4. RESEND WEBHOOKS (Opcional - para recibir eventos)
RESEND_WEBHOOK_SECRET="re_XXX"               # Para verificar firmas
```

**Cómo obtener cada uno**:

#### A. Vercel Token
1. Ir a https://vercel.com/account/tokens
2. Click "Create"
3. Nombre: "Revora Auto Deploy"
4. Copiar y pegar en `.env.local`

#### B. Google Ads
1. Ir a Google Cloud Console: https://console.cloud.google.com
2. Crear proyecto "Revora"
3. Habilitar: Google Ads API
4. Crear OAuth 2.0 credentials (Desktop Application)
5. Copiar Client ID, Client Secret
6. Ejecutar OAuth flow para obtener access token
7. Copiar Customer ID de Google Ads

**OAuth flow para Google Ads** (ver `src/lib/google-ads-auth.ts` si existe):
```bash
# Usar biblioteca google-auth-library
npm install google-auth-library
```

#### C. Meta Business
1. Ir a https://business.facebook.com
2. Configuración → Cuentas de usuario → Generar token
3. O: https://developers.facebook.com/apps → Settings → Tokens
4. Copiar App Access Token
5. De Business Settings: copiar Business Account ID

#### D. Webhooks - Configurar en cada plataforma

**Resend Webhooks**:
```
1. https://resend.com/webhooks
2. URL: https://tuapp.com/api/webhooks/resend
3. Events: email.sent, email.opened, email.clicked, email.bounced
```

**Google Ads Webhooks**: (usa Google Cloud Pub/Sub)
```
1. https://console.cloud.google.com/cloudpubsub
2. Create topic: "revora-google-ads"
3. Create subscription
4. Endpoint: https://tuapp.com/api/webhooks/google-ads
```

**Meta Webhooks**:
```
1. https://developers.facebook.com/apps/{app-id}/webhooks
2. URL: https://tuapp.com/api/webhooks/meta
3. Verify Token: (el que pusiste en .env.local)
4. Subscribe to: campaigns, ads, conversions
```

---

### FASE 3: Base de Datos ⏳ REQUIERE ACCIÓN

**Crear tablas en Supabase:**

```sql
-- Conectar a: postgresql://postgres:PASSWORD@db.qqpojuchrkfipxyqncpp.supabase.co:5432/postgres

-- Opción A: Ejecutar en Supabase SQL Editor
-- Copiar contenido de src/lib/db-init.ts y pegarlo en el editor

-- Opción B: Desde CLI
psql $DATABASE_URL < supabase-schema.sql

-- Opción C: Ejecutar script Node
npm run db:init
```

**Script para verificar tablas**:
```bash
psql $DATABASE_URL -c "\dt"
```

---

### FASE 4: Deployment ⏳ REQUIERE ACCIÓN

**Opción A: Vercel (Recomendado para integración con app)**
```bash
npm run build
vercel deploy --prod
```

**Opción B: Render o Railway**
```
1. Conectar repositorio Git
2. Agregar variables de entorno
3. Deploy automático en cada push
```

**URLs de Webhooks serán**:
```
Producción: https://tuapp-vercel.app/api/webhooks/resend
           https://tuapp-vercel.app/api/webhooks/google-ads
           https://tuapp-vercel.app/api/webhooks/meta
           https://tuapp-vercel.app/api/webhooks/analytics
```

---

## 🚀 COMANDOS PARA EJECUTAR

### Setup Inicial
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env.local (ver sección anterior)
# Editar C:\Users\Administrator\Pictures\automated-shopify-lead-outreach (3)\.env.local

# 3. Inicializar base de datos
npm run db:init

# O manualmente:
node -e "require('./src/lib/db-init').initializeDatabase()"
```

### Desarrollo Local
```bash
npm run dev
# Acceder a http://localhost:3000
# Probar: Auto-Analyze Tab → generar campaña → modal
```

### Verificaciones
```bash
# Verificar conexión a Supabase
psql $DATABASE_URL -c "SELECT COUNT(*) FROM campaigns;"

# Verificar OpenAI
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'

# Verificar Resend
npm run test:resend-api
```

---

## 📋 CHECKLIST PRE-PRODUCCIÓN

**Seguridad**:
- [ ] Todas las API keys en `.env.local`, no en código
- [ ] `.env.local` en `.gitignore`
- [ ] Validar CORS en webhooks
- [ ] Firmar webhooks (Resend signature, Meta signature)
- [ ] Rate limiting en APIs

**Funcionalidad**:
- [ ] Generar campaña → guardar en DB ✅
- [ ] Resend: enviar email real a contacto
- [ ] Vercel: desplegar landing page real
- [ ] Google Ads: crear campaña real
- [ ] Meta Ads: crear campaña real
- [ ] Webhooks: recibir eventos reales

**Datos**:
- [ ] Backup de campaigns table
- [ ] Backup de campaign_metrics table
- [ ] Rotación de logs

**Monitoring**:
- [ ] Sentry o similar para errores
- [ ] DataDog o similar para métricas
- [ ] Alertas en Slack para fallos

---

## 🔧 TROUBLESHOOTING

**Error: "Cannot connect to database"**
```
✓ Verificar DATABASE_URL en .env.local
✓ Verificar que Supabase está running
✓ Verificar firewall/IP whitelist
```

**Error: "OpenAI API key invalid"**
```
✓ Obtener nueva key en https://platform.openai.com/account/api-keys
✓ Verificar formato: sk-proj-XXXXXX
```

**Error: "Resend: Invalid API key"**
```
✓ Obtener de https://resend.com/api-keys
✓ Verificar formato: re_XXXXXX
```

**Error: "Database table does not exist"**
```
✓ Ejecutar: npm run db:init
✓ O manualmente en Supabase SQL editor:
   CREATE TABLE campaigns (...)
```

---

## 📊 COMPARATIVA: ANTES vs AHORA

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Base de datos** | Mock array (en memoria) | ✅ PostgreSQL real |
| **OpenAI** | Simulado | ✅ GPT-4o real |
| **Email** | Simulado | ✅ Resend real |
| **Landing Pages** | Mock URL | ⏳ Vercel deployment |
| **Google Ads** | Mock | ⏳ API real (estructura) |
| **Meta Ads** | Mock | ⏳ API real (estructura) |
| **Métricas** | Random numbers | ⏳ Webhooks reales |
| **Proyecciones** | Math.random() | ✅ Cálculos reales |
| **Tiempo total** | 30 seg (mock) | 16 seg (real) |

---

## 🎯 SIGUIENTE: SEMANA 1 GOALS

**Prioridad Alta** (Máximo 3-4 horas):
1. [ ] Agregar VERCEL_TOKEN y GOOGLE_ADS tokens
2. [ ] Probar despliegue landing page real en Vercel
3. [ ] Probar creación de campaña Google Ads real
4. [ ] Configurar Resend webhooks

**Prioridad Media** (Máximo 2-3 horas):
5. [ ] Agregar META tokens y webhooks
6. [ ] Real-time metrics dashboard
7. [ ] Automatic optimizations

**Prioridad Baja** (Máximo 1-2 horas):
8. [ ] Client portal
9. [ ] PDF reports
10. [ ] Analytics dashboard avanzado

---

## 💡 NOTAS IMPORTANTES

1. **Teseo**: Antes de usar en producción, testear con cuentas de testing:
   - Google Ads: Use test account
   - Meta Ads: Use test mode
   - Resend: Use sandbox (sin cargo)

2. **Costos**:
   - OpenAI: ~$0.50 por campaña (GPT-4o mini)
   - Vercel: $0 si está en free tier
   - Google Ads: Lo que inyectes ($0 si solo creas)
   - Meta Ads: Lo que inyectes ($0 si solo creas)
   - Resend: $0 si < 100 emails/dia

3. **Rate Limiting**:
   - OpenAI: 3,500 RPM (requests/min)
   - Resend: 1,000 RPM
   - Google Ads: 10 queries/segundo
   - Meta: 200 API calls/hour

---

Generated: July 26, 2026 | Ready for Configuration
