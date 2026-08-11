# 🔑 CÓMO OBTENER TODOS LOS TOKENS (Guía Paso a Paso)

**Tiempo total**: ~30-45 minutos  
**Dificultad**: Fácil (solo copiar-pegar)

---

## 1️⃣ VERCEL_TOKEN (Landing Page Deployment)

### Paso 1: Ir a Vercel
```
https://vercel.com/account/tokens
```

### Paso 2: Crear Token
1. Click en **"Create"** (botón azul)
2. Dale un nombre: `Revora Auto Deploy`
3. **Scopes** (permisos):
   - ✅ Full Account
   - ✅ Read-write access to production deployments
4. **Expiration**: `No expiration` (o lo que prefieras)
5. Click **"Create Token"**

### Paso 3: Copiar Token
- Aparecerá un token como: `vercel_XXXXXXXXXXXXXXXXXXXXX`
- **COPIAR INMEDIATAMENTE** (solo aparece una vez)
- No compartir con nadie

### Paso 4: Guardar en .env.local
```env
VERCEL_TOKEN="vercel_XXXXXXXXXXXXXXXXXXXXX"
VERCEL_ORG_ID="team_XXXXXXXXXXXXX"  # Tu org ID (en settings)
```

✅ **LISTO**. Ya puedes desplegar landing pages.

---

## 2️⃣ GOOGLE_ADS_TOKEN (Crear Campañas Google)

### Paso 1: Crear Proyecto en Google Cloud

```
https://console.cloud.google.com/projectcreate
```

1. Click **"Create Project"**
2. Nombre: `Revora`
3. Click **"Create"**
4. Esperar ~1 minuto a que se cree

### Paso 2: Habilitar Google Ads API

```
https://console.cloud.google.com/apis/library/googleads.googleapis.com
```

1. Buscar: `Google Ads API`
2. Click en el resultado
3. Click **"Enable"** (botón azul)
4. Esperar ~30 segundos

### Paso 3: Crear Credenciales OAuth

```
https://console.cloud.google.com/apis/credentials
```

1. Click **"+ Create Credentials"**
2. Seleccionar: **"OAuth client ID"**
3. Si te pide: configurar pantalla de consentimiento
   - Click **"Configure Consent Screen"**
   - Seleccionar: **"External"**
   - Click **"Create"**
   - Llenar:
     - **App name**: `Revora`
     - **User support email**: Tu email
     - Click **"Save and Continue"**
   - Dejar scopes por defecto
   - Click **"Save and Continue"**
   - Click **"Back to Dashboard"**

4. Volver a crear credenciales:
   ```
   https://console.cloud.google.com/apis/credentials
   ```
   - Click **"+ Create Credentials"**
   - **"OAuth client ID"**
   - **Application type**: `Desktop application`
   - **Name**: `Revora Desktop`
   - Click **"Create"**

5. Aparecerá una ventana con:
   - **Client ID**: `XXXXX.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-XXXXX`
   - Click **"Download JSON"** (guardar archivo)

### Paso 4: Obtener Access Token

Necesitarás ejecutar un OAuth flow. Para desarrollo, usa:

```bash
npm install -g google-auth-library@latest
```

O crea un script Node rápido:

```javascript
// scripts/get-google-token.js
const { google } = require('googleapis');
const fs = require('fs');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID.apps.googleusercontent.com',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000/auth/callback' // Redirect URI
);

// Generar URL de autorización
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/adwords'],
});

console.log('Abre esta URL en tu navegador:');
console.log(authUrl);
console.log('\nDespués de autorizar, copia el código de la URL');
```

Ejecución:
```bash
node scripts/get-google-token.js
# → Te da una URL
# → Abre la URL en navegador
# → Autoriza
# → Te redirige a localhost con ?code=XXXXX
# → Copia ese código
```

Luego intercambia código por token:
```javascript
// scripts/get-google-token.js (continuación)
const code = 'CODIGO_QUE_COPIASTE';
oauth2Client.getToken(code, (err, token) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Access Token:', token.access_token);
  console.log('Guarda en .env.local:');
  console.log(`GOOGLE_ADS_ACCESS_TOKEN="${token.access_token}"`);
});
```

### Paso 5: Obtener Customer ID

```
https://ads.google.com/
```

1. Ir a tu cuenta Google Ads
2. Settings → Account Settings
3. Buscar **"Customer ID"** (parecerá: `123-456-7890`)
4. Guardar en .env.local:

```env
GOOGLE_ADS_CUSTOMER_ID="123-456-7890"
GOOGLE_ADS_ACCESS_TOKEN="ya29.XXXXXXXXXXXXXXX"
```

✅ **LISTO**. Ya puedes crear campañas Google Ads.

---

## 3️⃣ META_TOKEN (Crear Campañas Meta/Facebook)

### Paso 1: Crear App en Facebook Developers

```
https://developers.facebook.com/apps/create
```

1. Click **"Create App"**
2. Nombre: `Revora`
3. Email: Tu email
4. Click **"Create App ID"**
5. Seleccionar tipo: **"Business"**
6. Click **"Create"**

### Paso 2: Generar Access Token

```
https://developers.facebook.com/tools/explorer/
```

1. Arriba a la derecha: selecciona tu app **"Revora"**
2. A la izquierda: selecciona **"Get User Access Token"**
3. Permisos necesarios:
   - ✅ `ads_management` (crear/editar campañas)
   - ✅ `ads_read` (leer métricas)
   - ✅ `business_management` (acceder a Business Account)
4. Click **"Generate Access Token"**
5. Aparecerá un token como: `EAAxxxxxxxxxxxx`
6. **COPIAR INMEDIATAMENTE**

### Paso 3: Obtener Business Account ID

```
https://business.facebook.com/settings/info
```

1. Ir a Business Settings
2. Accounts → Ad Accounts
3. Buscar tu account ID (parecerá: `123456789012345`)
4. O en Business Settings → Account Settings
5. Copiar **"Business ID"**

### Paso 4: Configurar Webhooks (Opcional)

Para recibir eventos de conversiones:

```
https://developers.facebook.com/apps/[APP_ID]/webhooks
```

1. Click **"Add Subscription"**
2. Objeto: **"app"**
3. URL de callback: `https://tuapp.com/api/webhooks/meta`
4. Verify Token: cualquier string aleatorio (ej: `revora_webhook_secret_12345`)
5. Eventos: `conversions`, `campaigns`, `ads`
6. Click **"Verify and Save"**

### Paso 5: Guardar en .env.local

```env
META_ACCESS_TOKEN="EAAxxxxxxxxxxxx"
META_BUSINESS_ACCOUNT_ID="123456789012345"
META_WEBHOOK_VERIFY_TOKEN="revora_webhook_secret_12345"
META_WEBHOOK_SECRET="webhook_secret_key_random"
```

✅ **LISTO**. Ya puedes crear campañas Meta.

---

## 4️⃣ RESEND_WEBHOOK (Recibir Eventos de Email)

### Paso 1: Ya tienes el API Key

En tu `.env.local` ya deberías tener:
```env
RESEND_API_KEY="re_XXXXXXXXXXXXX"
```

Si no lo tienes:
```
https://resend.com/api-keys
```
1. Click **"Create API Key"**
2. Nombre: `Revora`
3. Copiar y guardar

### Paso 2: Configurar Webhooks

```
https://resend.com/webhooks
```

1. Click **"Create Webhook"**
2. **URL**: `https://tuapp.com/api/webhooks/resend`
   (Cuando esté en producción en Vercel)
3. **Events** (seleccionar todos):
   - ✅ `email.sent`
   - ✅ `email.opened`
   - ✅ `email.clicked`
   - ✅ `email.bounced`
   - ✅ `email.complained`
4. Click **"Create Webhook"**
5. Copia el **"Webhook Secret"**

### Paso 3: Guardar en .env.local

```env
RESEND_API_KEY="re_XXXXXXXXXXXXX"
RESEND_WEBHOOK_SECRET="re_webhook_XXXXX"
```

✅ **LISTO**. Ya recibirás eventos de email.

---

## 📝 TEMPLATE: .env.local COMPLETO

Copia esto y reemplaza con tus valores:

```env
# Base de datos (ya lo tienes)
DATABASE_URL="postgresql://postgres:PASSWORD@db.qqpojuchrkfipxyqncpp.supabase.co:5432/postgres"

# OpenAI (ya lo tienes)
OPENAI_API_KEY="sk-proj-XXXXXXXXXXXXX"

# Autenticación integrada
AUTH_JWT_SECRET="RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"
AUTH_ENCRYPTION_KEY="DIFFERENT_RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"

# Resend (ya lo tienes)
RESEND_API_KEY="re_XXXXXXXXXXXXX"
RESEND_WEBHOOK_SECRET="re_webhook_XXXXX"

# Hunter.io (ya lo tienes)
HUNTER_API_KEY="XXXXXXXXXXXXX"

# ============================================
# NUEVOS: Agregar estos
# ============================================

# Vercel (para desplegar landing pages)
VERCEL_TOKEN="vercel_XXXXXXXXXXXXXXXXXXXXX"
VERCEL_ORG_ID="team_XXXXXXXXXXXXX"

# Google Ads (para crear campañas)
GOOGLE_ADS_CUSTOMER_ID="123-456-7890"
GOOGLE_ADS_ACCESS_TOKEN="ya29.XXXXXXXXXXXXXXX"
GOOGLE_ADS_DEVELOPER_TOKEN="XXXXXXXXXXXXX"

# Meta / Facebook (para crear campañas)
META_ACCESS_TOKEN="EAAxxxxxxxxxxxx"
META_BUSINESS_ACCOUNT_ID="123456789012345"
META_WEBHOOK_VERIFY_TOKEN="revora_webhook_secret_12345"
META_WEBHOOK_SECRET="webhook_secret_key_random"

# Environment
NODE_ENV=development
```

---

## ✅ CHECKLIST: Verificar Todo Funciona

### 1. Vercel
```bash
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects
# Debe retornar lista de proyectos (no error 401)
```

### 2. Google Ads
```bash
curl -H "Authorization: Bearer $GOOGLE_ADS_ACCESS_TOKEN" \
  https://googleads.googleapis.com/v15/customers/$GOOGLE_ADS_CUSTOMER_ID/googleAds:search \
  -d '{"query":"SELECT customer.id FROM customer LIMIT 1"}'
# Debe retornar datos (no error 401)
```

### 3. Meta
```bash
curl "https://graph.instagram.com/v18.0/me?access_token=$META_ACCESS_TOKEN"
# Debe retornar tu info de usuario (no error 401)
```

### 4. Resend
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@resend.dev",
    "to": "tuemailprueba@gmail.com",
    "subject": "Test",
    "html": "<p>Funciona!</p>"
  }'
# Debe retornar success (no error 401)
```

---

## 🚨 PROBLEMAS COMUNES

### ❌ "Invalid token" para Vercel
```
Solución:
1. Ir a https://vercel.com/account/tokens
2. Crear nuevo token
3. Verificar que NO esté expirado
```

### ❌ "Invalid OAuth scope" para Google Ads
```
Solución:
1. Ir a https://myaccount.google.com/permissions
2. Revocar acceso a Revora
3. Repetir flujo OAuth desde cero
```

### ❌ "Invalid access token" para Meta
```
Solución:
1. Ir a https://developers.facebook.com/tools/explorer/
2. Generar nuevo token
3. Asegurar que tiene scope: ads_management
```

### ❌ Webhook no recibe eventos
```
Solución:
1. Verificar URL está correcta y pública (no localhost)
2. Verificar firewall permite incoming webhooks
3. Verificar logs del servidor para errores
4. Enviar test webhook desde plataforma (Resend, Meta, etc.)
```

---

## 🎯 ORDEN DE EJECUCIÓN RECOMENDADO

### 5 minutos
```bash
1. Obtener VERCEL_TOKEN
2. Obtener RESEND_WEBHOOK_SECRET
3. Guardar en .env.local
4. Testear: npm run dev
```

### 15 minutos
```bash
5. Obtener GOOGLE_ADS_TOKEN (más complicado, OAuth)
6. Obtener GOOGLE_ADS_CUSTOMER_ID
7. Guardar en .env.local
8. Testear conexión
```

### 10 minutos
```bash
9. Obtener META_ACCESS_TOKEN
10. Obtener META_BUSINESS_ACCOUNT_ID
11. Guardar en .env.local
12. Testear conexión
```

### 5 minutos
```bash
13. Revisar .env.local completo
14. npm run dev
15. Probar generar campaña
```

---

## 💡 TIPS

1. **Guarda los valores en un archivo seguro** (Bitwarden, 1Password, etc.)
2. **Usa tokens con expiration "No expiration"** para evitar problemas
3. **Usa cuentas de testing** antes de usar en producción:
   - Google Ads: Test account
   - Meta: Test mode
   - Vercel: Free tier
   - Resend: Sandbox (sin cobros)
4. **No compartas los tokens con nadie**
5. **Los webhooks solo funcionan en production** (localhost no recibe)

---

## 📞 SOPORTE

Si algo falla:
1. Copiar el error exacto
2. Ir a plataforma oficial (Google, Meta, Vercel, Resend)
3. Buscar error en documentación
4. O crear issue en GitHub del proyecto

---

**Estimated total time: 30-45 minutes**  
**Difficulty: 2/10 (mostly copy-paste)**

¡Ahora tienes TODOS los tokens necesarios para REVORA!

---

Generated: July 26, 2026 | Complete Token Setup Guide
