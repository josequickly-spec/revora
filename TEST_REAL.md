# 🧪 Test Real de Revora (BD + Auth + Email)

**Objetivo:** Probar que TODO funciona REAL con Supabase, Clerk y Resend.

---

## ✅ Lo Que Está Configurado

| Componente | Status | Detalles |
|---|---|---|
| **Supabase** | ✅ Conectado | postgresql://postgres:... |
| **Clerk** | ✅ Configurado | pk_test_... + sk_test_... |
| **Resend** | ✅ Listo | [CONFIGURADO EN .env.local] |
| **Servidor** | ✅ Corriendo | npm run dev (localhost:3000) |

---

## 🧪 TEST 1: Ver Datos en BD Real

### Paso 1: Verifica en Supabase Dashboard

1. Ve a https://app.supabase.com
2. Selecciona proyecto `revora`
3. Ve a **Database → Tables**
4. Verifica que existen las 5 tablas:
   - `businesses` ✓
   - `funnels` ✓
   - `contacts` ✓
   - `outreach_campaigns` ✓
   - `proposals` ✓

### Paso 2: Verifica que están vacías (aún)

- Haz clic en `businesses`
- Si dice "No rows", significa BD está limpia ✓

### Resultado Esperado
✅ 5 tablas creadas, vacías (listos para llenar)

---

## 🧪 TEST 2: Crear Negocio Nuevo

### Paso 1: Abre http://localhost:3000

- Espera 3-5 segundos a que cargue

### Paso 2: Haz clic "Añadir Negocio"

- Llena:
  - Nombre: `Test Negocio Real`
  - Dominio: `test-real.com`
  - Tipo: E-Commerce
  - Facturación: 50000
  - Oferta: `Test Offer`

### Paso 3: Click "Añadir y Generar"

- Espera 2 segundos
- Verifica que aparece en la lista

### Resultado Esperado
✅ Negocio aparece en dashboard (datos de BD real)

---

## 🧪 TEST 3: Verifica en Supabase Dashboard

### Paso 1: Ve a https://app.supabase.com

### Paso 2: Database → Tables → `businesses`

### Resultado Esperado
✅ Ves el negocio "Test Negocio Real" que acabas de crear
✅ BD Real funcionando ✓

---

## 🧪 TEST 4: Prueba Email (Resend)

### Paso 1: En la app, haz clic en un contacto

### Paso 2: Click en botón "Email"

### Paso 3: Click "Enviar Email"

### Resultado Esperado (Sin Clerk configurado)
⚠️ Email se simula (no se envía real aún)

**Por qué?** Sin auth real, simulamos. En Vercel + Clerk, se envía REAL.

---

## 🧪 TEST 5: Verifica Auth (Clerk)

Cuando despliegues en Vercel + Clerk:

1. Intenta acceder a `/api/businesses` SIN login
2. Debería redirigir a Clerk login ✓

---

## ✅ Checklist Final

- [ ] Supabase: 5 tablas existen
- [ ] Negocio test: Se crea en BD real
- [ ] Dashboard: Muestra negocio nuevo
- [ ] Supabase: Negocio aparece en tabla
- [ ] Email: Se simula (funciona en Vercel)
- [ ] API: Devuelve datos JSON

---

## 🔍 Debugging Si Algo Falla

**Si negocio no aparece en dashboard:**
```bash
# Verifica conexión a BD
curl -s http://localhost:3000/api/businesses
```

Si ves JSON con datos → BD conectada ✓

**Si Supabase dice "no rows":**
- Recarga la página
- Verifica que creaste en BD correcta (revora)
- Limpia cache del navegador (Ctrl+Shift+Delete)

**Si servidor no inicia:**
```bash
# Verifica .env.local
cat .env.local
# Debe tener: DATABASE_URL, NEXT_PUBLIC_CLERK_*, RESEND_API_KEY
```

---

## 🎯 Resumen

Tu Revora REAL está:
- ✅ Conectada a PostgreSQL (Supabase)
- ✅ Lista para autenticación (Clerk)
- ✅ Pronta para email (Resend)
- ✅ Corriendo en localhost

**Próximo paso:** Deployar en Vercel (ver `DEPLOY_GITHUB_VERCEL.md`)

Cuando esté en Vercel:
- ✅ Auth real (login con email)
- ✅ Email real (se envía a buzón)
- ✅ BD persistente (datos forever)
- ✅ URL pública (compartible)

---

**¿Todos los tests pasaron? → Lista para GitHub + Vercel 🚀**
