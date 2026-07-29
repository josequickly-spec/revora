# 🚀 Deploy a GitHub + Vercel (5 minutos)

## PASO 1: Crear Repo en GitHub (2 min)

### 1. Ve a https://github.com/new

### 2. Llena el formulario:
- **Repository name:** `revora`
- **Description:** "Revenue OS for Agencies - Universal lead acquisition platform"
- **Public** ✓
- Click "Create repository"

### 3. Copia la URL que aparece (debería ser algo como):
```
https://github.com/TUUSUARIO/revora.git
```

---

## PASO 2: Push a GitHub (2 min)

Abre **PowerShell** en tu proyecto y copia-pega esto:

```powershell
cd "C:\Users\Administrator\Pictures\automated-shopify-lead-outreach (3)"
git branch -M main
git remote add origin https://github.com/TUUSUARIO/revora.git
git push -u origin main
```

**Reemplaza `TUUSUARIO` con tu usuario real de GitHub.**

Si te pide usuario/password:
- Usuario: tu usuario de GitHub
- Password: Tu **Personal Access Token** (crea uno en https://github.com/settings/tokens si no tienes)

---

## PASO 3: Deploy en Vercel (3 min)

### 1. Ve a https://vercel.com

### 2. Click "New Project"

### 3. Selecciona tu repo `revora` de GitHub (si no aparece, connéctalo primero)

### 4. Click "Import"

### 5. **IMPORTANTE - Agrega Environment Variables:**

En la sección "Environment Variables", agrega estas 4 exactas:

```
Name: DATABASE_URL
Value: postgresql://postgres:[ROTATED_PASSWORD]@[SUPABASE_HOST]:5432/postgres

Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: [CLERK_PUBLISHABLE_KEY]

Name: CLERK_SECRET_KEY
Value: [ROTATED_CLERK_SECRET_KEY]

Name: RESEND_API_KEY
Value: [OBTÉN TU CLAVE EN https://resend.com/api-keys]
```

### 6. Click "Deploy"

---

## ✅ ¡Listo!

En ~2 minutos Vercel deployará tu app y te dará una URL como:

```
https://revora.vercel.app
```

Esa es tu app en PRODUCCIÓN con:
- ✅ BD Real (PostgreSQL)
- ✅ Auth Real (Clerk)
- ✅ Email Real (Resend)
- ✅ Hosting Real (Vercel)
- ✅ SSL/HTTPS
- ✅ CI/CD automático

---

## 🧪 Test en Producción

1. Abre tu URL en Vercel
2. Haz clic "Añadir Negocio"
3. Llena datos
4. Verifica que aparece en la lista

Si funciona → **¡Todo está en PRODUCCIÓN REAL!** 🎉

---

## 📝 Nota: Variables de Entorno

Las variables están guardadas en:
- **Local:** `.env.local` (para desarrollo)
- **Producción:** Vercel Dashboard (seguro, encriptado)

No se commitean al repo, así que tus credenciales están seguras.

---

## 🆘 Si algo falla

**GitHub push falla:**
- Verifica tu usuario y password (o Personal Access Token)
- Verifica que copiaste bien la URL del repo

**Vercel deploy falla:**
- Verifica que las 4 variables de entorno están exactas
- Verifica que el repo en GitHub está correcto

---

**¿Necesitas ayuda con algún paso? Pregunta aquí.** 👇
