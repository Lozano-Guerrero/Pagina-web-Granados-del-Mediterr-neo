# Setup: Modulo De Regimen (Supabase)

Este modulo implementa:

- Regimen versionado por tipo: `broker` e `inmobiliaria`.
- PDFs privados en Supabase Storage (solo con signed URLs).
- Bloqueo de **registro de leads** cuando el usuario esta `INACTIVO` por regimen pendiente.
- Brokers hijos (ligados a una inmobiliaria) **no** ven modulo de regimen y **no** pueden descargar/subir regimen.

## 1) SQL (Supabase SQL Editor)

Ejecuta (si aun no lo hiciste):

- `supabase/schema.sql`
- `supabase/leads.sql` (o tus migraciones de leads)
- `supabase/leads_soft_delete.sql` (si usas eliminar leads)
- `supabase/leads_esquema_regimen.sql` (si no esta aplicado)

Luego ejecuta:

- `supabase/regimen_schema.sql`

## 2) Storage Buckets (Supabase Dashboard)

En **Storage** crea dos buckets **privados** (NO public):

- `regimens_master`
- `regimens_signed`

## 3) Secrets (Edge Functions)

En terminal (PowerShell) dentro del proyecto:

```powershell
npx -y supabase secrets set SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
```

Nota:
- No hardcodear keys en el repo.
- Evitar nombres que empiecen con `SUPABASE_` para secrets propios.

## 4) Deploy de Edge Functions

Nota importante (JWT / API Keys):

- Si tu `VITE_SUPABASE_ANON_KEY` es una key nueva tipo `sb_publishable_...`, debes desplegar estas Edge Functions con `--no-verify-jwt` para evitar `Invalid JWT (HTTP 401)` en el gateway.
- Si usas la key **anon legacy** (la que empieza con `eyJ...`), puedes desplegar sin `--no-verify-jwt`.

```powershell
npx -y supabase functions deploy regimen-admin-start-upload --use-api --no-verify-jwt
npx -y supabase functions deploy regimen-admin-activate --use-api --no-verify-jwt
npx -y supabase functions deploy regimen-user-start-upload --use-api --no-verify-jwt
npx -y supabase functions deploy regimen-user-submit --use-api --no-verify-jwt
npx -y supabase functions deploy regimen-download-url --use-api --no-verify-jwt

# Actualizaciones (si ya estaban deployadas)
npx -y supabase functions deploy lead-register --use-api --no-verify-jwt
npx -y supabase functions deploy manage-user --use-api --no-verify-jwt
```

## 5) QA rapido

1. Admin: entra a `/admin` y en "Regimen actual" sube un PDF y confirma.
2. Verifica en `public.regimens_master` que el nuevo regimen quedo `is_active=true`.
3. Verifica que usuarios objetivo quedaron `account_status='inactive'`:
   - Brokers independientes: `role='broker' AND org_id IS NULL`
   - Inmobiliarias: `role='inmobiliaria'`
4. Inmobiliaria/Broker independiente:
   - Debe ver modulo regimen en su panel.
   - Debe poder descargar master.
   - Debe poder subir firmado y quedar `account_status='active'`.
5. Broker hijo:
   - No ve modulo regimen.
   - No puede descargar/subir regimen aunque intente forzar llamadas.
6. Registro de leads:
   - Si `account_status='inactive'`, debe bloquear registro (UI y servidor).
   - Los leads nuevos guardan `regimen` con el nombre activo del momento (congelado).
