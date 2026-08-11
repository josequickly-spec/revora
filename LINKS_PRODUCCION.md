# 🔗 Links y Guía Visual para Producción

## 1️⃣ Base de Datos PostgreSQL

### Supabase (Recomendado - GRATIS)

**Link:** https://supabase.com

1. Haz clic "Start your project"
2. Sign up con GitHub
3. Crea nuevo proyecto
4. Espera ~2 minutos
5. Ve a **Settings → Database**
6. Copia la URL bajo "Connection string"

```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

**Pega en `.env.local`:**
```env
DATABASE_URL="postgresql://postgres:TUPASSWORD@[HOST]:5432/postgres"
```

---

## 2️⃣ Autenticación

La aplicación utiliza autenticación integrada. Configura dos secretos aleatorios diferentes, de al menos 32 caracteres:

```env
AUTH_JWT_SECRET="RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"
AUTH_ENCRYPTION_KEY="DIFFERENT_RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"
```

---

## 3️⃣ Email

### Resend (Recomendado - GRATIS para desarrollo)

**Link:** https://resend.com

1. Sign up con GitHub
2. Ve a **API Keys** en sidebar
3. Crea nueva API key (o usa la default)
4. Copia la clave (empieza con `re_`)

**Pega en `.env.local`:**
```env
RESEND_API_KEY="re_abc123xyz789..."
```

**Nota:** Resend permite 100 emails/día gratis. En producción: $20/mes para límites altos.

---

## 4️⃣ Hosting

### Vercel (Recomendado - GRATIS hobby plan)

**Link:** https://vercel.com

1. Sign up con GitHub
2. Conecta tu repo
3. En "Environment Variables" agrega las 4 claves
4. Click "Deploy"

---

## 🔐 Tu archivo `.env.local` debe verse así:

```env
# Base de Datos
DATABASE_URL="postgresql://postgres:TuPasswordAqui@db.supabase.co:5432/postgres"

# Autenticación integrada
AUTH_JWT_SECRET="RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"
AUTH_ENCRYPTION_KEY="DIFFERENT_RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"

# Email (Resend)
RESEND_API_KEY="re_abc123xyz789uvw012"

# Environment
NODE_ENV="development"
```

---

## 📋 Orden de Configuración

```
1. Crea Supabase DB → Copia DATABASE_URL
2. Crea Clerk app → Copia CLERK_* keys
3. Crea Resend account → Copia RESEND_API_KEY
4. Pega todo en .env.local
5. npm install
6. npm run init (crea tablas)
7. npm run dev (testa local)
8. Pushea a GitHub
9. Deploy en Vercel
10. Agrega env vars en Vercel Dashboard
```

---

## ✅ Verificar que Funciona

### En Local (localhost:3000)

```bash
npm run dev
```

Abre http://localhost:3000

- ¿Ves los 5 negocios? → BD real ✅
- ¿Puedes crear uno nuevo? → BD real ✅
- ¿El email se envía (o simula)? → Resend configurado ✅

### En Vercel (tu-app.vercel.app)

- ¿Carga la app? → Hosting funcionando ✅
- ¿Puedes crear negocios? → Variables de entorno correctas ✅
- ¿Email se envía? → Resend en producción ✅

---

## 💡 Tips

1. **No hagas commit de `.env.local`** — está en `.gitignore`
2. **Variables en Vercel son diferentes a local** — agrégalas en Vercel Dashboard
3. **Resend: Verifica el email en test@resend.dev ANTES de producción**
4. **Clerk: Los usuarios se crean automáticamente en primer login**
5. **Supabase: Habilita SSL si te da error (está por defecto)**

---

## 🆘 Problemas Comunes

| Problema | Solución |
|---|---|
| "DATABASE_URL is missing" | Verifica `.env.local` en raíz, reinicia `npm run dev` |
| "Clerk not configured" | Verifica keys en `.env.local`, no uses comillas simples |
| Email no se envía | Verifica `RESEND_API_KEY`, chequea spam folder |
| BD vacía en producción | Verifica `DATABASE_URL` en Vercel, ejecuta `npm run init` |
| 404 en Vercel | Verifica que Push a GitHub incluye todos los archivos |

---

## 📞 Soporte Official

- **Supabase:** https://supabase.com/docs
- **Clerk:** https://clerk.com/docs
- **Resend:** https://resend.com/docs
- **Vercel:** https://vercel.com/docs/framework/next-js

---

## 🎉 Una Vez Configurado

Tu app tiene:

✅ PostgreSQL real en Supabase
✅ Autenticación con Clerk
✅ Email con Resend
✅ Hosting automático en Vercel
✅ SSL/HTTPS gratis
✅ CI/CD automático (cada push deploya)
✅ Costo: $0/mes inicialmente

**¡Listo para escalar!** 🚀
