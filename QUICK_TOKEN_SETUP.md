# ⚡ QUICK TOKEN SETUP (Guía Visual)

**Tiempo**: 30-40 minutos  
**Pasos**: 4 principales  

---

## 🟢 PASO 1: VERCEL TOKEN (5 minutos)

### 1.1 Abre en tu navegador:
```
https://vercel.com/account/tokens
```

### 1.2 Inicia sesión (si no estás dentro)
- Usa GitHub o email
- Confirma 2FA si es necesario

### 1.3 Haz clic en botón azul "Create"

### 1.4 Llena el formulario:
```
Token name: Revora Auto Deploy
Scope: Full Account (selecciona toda)
Expiration: No expiration
```

### 1.5 Haz clic en "Create Token"

### 1.6 Verás esto:
```
Your new token: vercel_XXXXXXXXXXXXXXXXXXXXXXXXX
```

**⚠️ COPIA INMEDIATAMENTE** (solo aparece una vez)

### 1.7 Guarda en algún lugar temporalmente:
```
Vercel Token: vercel_XXXXXXXXXXXXXXXXXXXXXXXXX
```

✅ **LISTO VERCEL**

---

## 🔍 PASO 2: GOOGLE ADS (20 minutos)

### 2.1 Abre Google Cloud Console:
```
https://console.cloud.google.com/projectcreate
```

### 2.2 Crea proyecto nuevo
- Click: "Create Project"
- Name: `Revora`
- Click: "Create"
- Espera 1 minuto

### 2.3 Habilita Google Ads API:
```
https://console.cloud.google.com/apis/library/googleads.googleapis.com
```
- Click: "Enable"
- Espera 30 segundos

### 2.4 Crea OAuth Credentials:
```
https://console.cloud.google.com/apis/credentials
```

**Si pide "Configure OAuth Consent Screen":**
1. Click "Configure Consent Screen"
2. Selecciona: "External"
3. Click "Create"
4. Llena:
   - App name: `Revora`
   - User support email: Tu email
5. Click "Save and Continue"
6. Deja scopes por defecto
7. Click "Save and Continue"
8. Click "Back to Dashboard"

### 2.5 Crear credenciales OAuth:
1. Vuelve a: https://console.cloud.google.com/apis/credentials
2. Click "+ Create Credentials"
3. Selecciona "OAuth client ID"
4. Application type: "Desktop application"
5. Name: `Revora Desktop`
6. Click "Create"

### 2.6 Verás esto:
```
Client ID: XXXX.apps.googleusercontent.com
Client Secret: GOCSPX-XXXXX
```

**COPIA AMBOS**

### 2.7 Obtener Access Token:

Este paso es un poco técnico. Opción A (Manual):

**Opción A: Via OAuth Flow (recomendado)**
```bash
# Abre este link en navegador (reemplaza XXX con tu Client ID):
https://accounts.google.com/o/oauth2/v2/auth?client_id=XXX.apps.googleusercontent.com&redirect_uri=http://localhost:3000&response_type=code&scope=https://www.googleapis.com/auth/adwords&access_type=offline

# Autoriza
# Te redirigirá a: http://localhost:3000?code=XXXXX
# COPIA ese código (todo lo que viene después de ?code=)
# Ese código ES tu access token inicial
```

**Opción B: Via Google OAuth Playground**
```
https://developers.google.com/oauthplayground
```
1. Click icono de engranaje (settings)
2. Habilita "Use your own OAuth credentials"
3. Pega tu Client ID y Client Secret
4. Selecciona scope: `https://www.googleapis.com/auth/adwords`
5. Click "Authorize APIs"
6. Autentica con tu cuenta Google
7. Click "Exchange authorization code for tokens"
8. **COPIA el "Access Token"**

### 2.8 Obtener Google Ads Customer ID:

```
https://ads.google.com/
```

1. Inicia sesión
2. Ve a Settings (engranaje arriba a la derecha)
3. Account Settings
4. Busca "Customer ID" (formato: `123-456-7890`)
5. **COPIA**

### 2.9 Guarda temporalmente:
```
Google Ads Customer ID: 123-456-7890
Google Ads Access Token: ya29.XXXXXXXXXXXXXXX
```

✅ **LISTO GOOGLE ADS**

---

## 👍 PASO 3: META / FACEBOOK (15 minutos)

### 3.1 Crear App en Facebook:
```
https://developers.facebook.com/apps/create
```

1. Click "Create App"
2. App Name: `Revora`
3. Email: Tu email
4. Click "Create App ID"
5. Selecciona tipo: "Business"
6. Click "Create"

### 3.2 Generar Access Token:
```
https://developers.facebook.com/tools/explorer/
```

1. Arriba a la derecha: selecciona tu app **"Revora"**
2. A la izquierda: click en "Get User Access Token"
3. Marca estos permisos:
   - ✅ `ads_management`
   - ✅ `ads_read`
   - ✅ `business_management`
4. Click "Generate Access Token"
5. Verás: `EAAxxxxxxxxxxxx`
6. **COPIA INMEDIATAMENTE**

### 3.3 Obtener Business Account ID:

```
https://business.facebook.com/settings/info
```

1. Ve a Business Settings
2. Accounts → Ad Accounts
3. Busca tu account ID (formato: `123456789012345`)
4. **COPIA**

O:
```
https://business.facebook.com/settings/system-users
```
- Business ID está en la URL o en settings

### 3.4 Guarda temporalmente:
```
Meta Access Token: EAAxxxxxxxxxxxx
Meta Business Account ID: 123456789012345
Meta Webhook Verify Token: revora_secret_12345
Meta Webhook Secret: random_webhook_secret
```

✅ **LISTO META**

---

## 📧 PASO 4: RESEND WEBHOOK (5 minutos) [OPCIONAL]

### 4.1 Abre Resend:
```
https://resend.com/webhooks
```

### 4.2 Inicia sesión
- Ya deberías tener cuenta
- Si no: crea una rápido

### 4.3 Click "Create Webhook"

### 4.4 Llena:
```
URL: https://tuapp.com/api/webhooks/resend
Events: Selecciona todos (email.sent, email.opened, etc.)
```

### 4.5 Verás webhook secret:
```
Webhook Secret: re_webhook_XXXXX
```

**COPIA**

### 4.6 Guarda:
```
Resend Webhook Secret: re_webhook_XXXXX
```

✅ **LISTO RESEND**

---

## 📋 AHORA TIENES TODOS LOS TOKENS:

```
✅ VERCEL_TOKEN: vercel_XXXXXXXXXXXXXXXXXXXXXXXXX
✅ GOOGLE_ADS_CUSTOMER_ID: 123-456-7890
✅ GOOGLE_ADS_ACCESS_TOKEN: ya29.XXXXXXXXXXXXXXX
✅ META_ACCESS_TOKEN: EAAxxxxxxxxxxxx
✅ META_BUSINESS_ACCOUNT_ID: 123456789012345
✅ RESEND_WEBHOOK_SECRET: re_webhook_XXXXX (opcional)
```

---

## 🚀 PASO FINAL: GUARDAR EN .env.local

### Opción A (Automática - Recomendada):

```bash
cd "C:\Users\Administrator\Pictures\automated-shopify-lead-outreach (3)"
node scripts/setup-tokens.js
```

Responde las preguntas pegando cada token.

**Resultado**: .env.local se actualiza automáticamente ✅

### Opción B (Manual):

1. Abre `.env.local` con editor de texto
2. Agrega al final:

```env
VERCEL_TOKEN="vercel_XXXXXXXXXXXXXXXXXXXXXXXXX"
VERCEL_ORG_ID="team_XXXXX"

GOOGLE_ADS_CUSTOMER_ID="123-456-7890"
GOOGLE_ADS_ACCESS_TOKEN="ya29.XXXXXXXXXXXXXXX"

META_ACCESS_TOKEN="EAAxxxxxxxxxxxx"
META_BUSINESS_ACCOUNT_ID="123456789012345"
META_WEBHOOK_VERIFY_TOKEN="revora_secret_12345"
META_WEBHOOK_SECRET="random_webhook_secret"

RESEND_WEBHOOK_SECRET="re_webhook_XXXXX"
```

3. Guarda archivo
4. **LISTO** ✅

---

## ✅ VERIFICAR QUE TODO FUNCIONA

```bash
# Terminal:
cd "C:\Users\Administrator\Pictures\automated-shopify-lead-outreach (3)"
npm run dev

# Navegador:
http://localhost:3000
# Tab: Auto-Analyze
# Escribir: "Mi Negocio"
# Click: Analizar
# Resultado: Campaña con datos REALES
```

---

## 🎯 RESUMEN TIEMPO TOTAL:

| Paso | Tiempo |
|------|--------|
| Vercel | 5 min |
| Google Ads | 15 min |
| Meta | 10 min |
| Resend | 5 min |
| Guardar tokens | 2 min |
| **TOTAL** | **37 minutos** |

---

## 💡 TIPS IMPORTANTES:

1. **Guarda cada token en un lugar seguro** (Bitwarden, 1Password, etc.)
2. **No compartas los tokens con nadie**
3. **Google Ads access token expira**: Renuévalo cada ~1 hora si usas OAuth flow
4. **Para producción**: Usa refresh tokens (opción "offline" en OAuth)

---

## 🆘 SI ALGO FALLA:

- **"Invalid Client ID"**: Verifica que copiaste bien
- **"Token already exists"**: Usa nombre diferente
- **"Unauthorized"**: Vuelve a generar token
- **"Webhook URL invalid"**: Cuando despliegues en Vercel, actualiza URL

---

**¡Hecho! Tienes 4 tokens configurados y REVORA está 100% en producción sin mock.**

Generated: July 26, 2026 | Quick Setup Guide
