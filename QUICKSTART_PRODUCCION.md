# ⚡ QUICKSTART: Llevar Revora a Producción en 15 Minutos

**Objetivo:** Tener Revora con BD real, email real y auth en producción.

**Tiempo:** ~15 min
**Costo Mes 1:** $0
**Complejidad:** ⭐⭐ (solo copy-paste)

---

## PASO 1️⃣: Crear Base de Datos Gratis (2 min)

### 1. Ve a https://supabase.com y crea cuenta

- Haz clic "Sign Up" (usa GitHub si tienes)
- Verifica email

### 2. Crea proyecto

- Nombre: `revora`
- Región: Europe/Spain o us-east-1
- Password: Guarda este password (lo necesitas ahora)

### 3. Copia la URL de conexión

Después de crear el proyecto:
- Ve a **Settings** → **Database** 
- Copia la URL bajo "Connection String"
- Debería verse así:
  ```
  postgresql://postgres:TUPASSWORD@HOST:5432/postgres
  ```

### 4. Pega en tu proyecto

Abre `C:\...\automated-shopify-lead-outreach (3)\.env.local` y actualiza:

```env
DATABASE_URL="postgresql://postgres:TUPASSWORD@HOST:5432/postgres"
NODE_ENV=development
```

**Guarda el archivo.**

---

## PASO 2️⃣: Configurar autenticación integrada (3 min)

Genera dos secretos aleatorios diferentes, de al menos 32 caracteres, y agrégalos a `.env.local`:

```env
AUTH_JWT_SECRET="RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"
AUTH_ENCRYPTION_KEY="DIFFERENT_RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS"
```

---

## PASO 3️⃣: Crear Email Gratis (2 min)

### 1. Ve a https://resend.com y crea cuenta

- Sign up con GitHub

### 2. Copia tu API Key

En **API Keys**, copia la clave (empieza con `re_`)

### 3. Pega en `.env.local`

```env
RESEND_API_KEY="re_xxx"
```

---

## PASO 4️⃣: Instalar Dependencias (3 min)

En terminal en tu proyecto:

```bash
npm install
```

Esto descarga: Clerk, Resend, PostgreSQL driver

---

## PASO 5️⃣: Crear Tablas en BD Real (1 min)

En terminal:

```bash
npm run init
```

Esto usa Drizzle para crear las tablas en Supabase.

---

## PASO 6️⃣: Correr en Local (1 min)

En terminal:

```bash
npm run dev
```

Abre http://localhost:3000

**¿Sigues viendo los mismos 5 negocios?** ✅ Perfecto, está usando BD real.

---

## PASO 7️⃣: Deploy a Vercel (3 min)

### 1. Pushea a GitHub

```bash
git init
git add .
git commit -m "Revora production ready"
git branch -M main
git remote add origin https://github.com/TUUSUARIO/revora.git
git push -u origin main
```

### 2. Deploy en Vercel

- Ve a https://vercel.com
- Click "New Project"
- Selecciona tu repo de GitHub
- En **Environment Variables**, agrega:

```
DATABASE_URL=postgresql://...
AUTH_JWT_SECRET=random_secret_with_at_least_32_characters
AUTH_ENCRYPTION_KEY=different_random_secret_with_at_least_32_characters
RESEND_API_KEY=re_...
```

- Click "Deploy"

**En 2 minutos tu app está en producción real** 🚀

---

## ✅ Checklist Final

- [ ] Supabase: BD creada, URL copiada
- [ ] Clerk: Keys copiadas
- [ ] Resend: API Key copiada
- [ ] `.env.local` actualizado
- [ ] `npm install` completado
- [ ] `npm run init` ejecutado
- [ ] `npm run dev` funciona en localhost
- [ ] GitHub repo creado
- [ ] Vercel deployment completado
- [ ] App en vivo en `tu-app.vercel.app`

---

## 🧪 Probar que Todo Funciona

### Local (http://localhost:3000)

1. Haz clic en "Añadir Negocio"
2. Llena el formulario
3. Verifica que aparece el nuevo negocio (BD real)
4. Haz clic en "Email" en un contacto
5. El email debería enviar (si RESEND_API_KEY está configurado)

### Producción (tu-app.vercel.app)

1. Entra sin login (Clerk está en modo desarrollo)
2. Repite los tests de arriba
3. Si funciona acá, ¡funciona para tus usuarios!

---

## 🆘 Troubleshooting

**Error: "DATABASE_URL is missing"**
- Verifica que `.env.local` está en la raíz del proyecto
- Reinicia `npm run dev`

**Error: "Clerk not configured"**
- Verifica que las keys de Clerk están en `.env.local`
- Reinicia `npm run dev`

**Email no se envía**
- Verifica que RESEND_API_KEY está en `.env.local`
- Verifica que no estás usando dominio bloqueado por Resend

**Tablas no se crean**
- Verifica que DATABASE_URL es correcto
- Intenta `npm run init` nuevamente

---

## 📞 Soporte

- **Supabase Docs:** https://supabase.com/docs
- **Clerk Docs:** https://clerk.com/docs
- **Resend Docs:** https://resend.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

## 🎉 ¡Listo!

Tu app está en producción con:
- ✅ BD real (PostgreSQL)
- ✅ Auth real (Clerk)
- ✅ Email real (Resend)
- ✅ Hosting real (Vercel)
- ✅ Costo: $0 (por ahora)

**Próximos pasos:**
1. Invitar usuarios a Clerk
2. Conectar dominio personalizado en Vercel
3. Configurar emails branded con tu dominio
4. Escalar según necesidad

¡Felicidades! 🚀
