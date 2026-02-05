# Setup HighLevel (Leads) + Supabase Edge Function

Este proyecto registra leads en HighLevel desde el portal de brokers/inmobiliarias usando la Edge Function `lead-register`.

## 1) IDs y Token necesarios (HighLevel)

Necesitas 4 valores:

- `HIGHLEVEL_PRIVATE_TOKEN`: Private Integration Token (HighLevel / LeadConnector).
- `HIGHLEVEL_LOCATION_ID`: ID del “Location” (sub-account) donde se crearán los contactos/oportunidades.
- `HIGHLEVEL_PIPELINE_ID`: ID del pipeline del embudo donde se registrará la oportunidad.
- `HIGHLEVEL_STAGE_ID`: ID del stage dentro del pipeline.

Además (Vigencias / cambio de estado):

- `HIGHLEVEL_STAGE_ID_REUNION`: stage cuando el lead pasa a “Reunión agendada”.
- `HIGHLEVEL_STAGE_ID_EXPIRADO`: stage cuando el lead expira.
- `HIGHLEVEL_STAGE_ID_CERRADO`: stage cuando se marca “Venta cerrada”.

Dónde encontrarlos (guía rápida):

1. **Location ID**
   - Entra al sub-account (Location).
   - Normalmente el `locationId` aparece en la URL o en settings del sub-account.
2. **Pipeline ID / Stage ID**
   - Dentro del sub-account: sección **Opportunities / Pipelines**.
   - Abre el pipeline donde quieres meter los leads.
   - El `pipelineId` y `stageId` se obtienen desde la configuración del pipeline (a veces visibles en la URL o mediante API).

## 2) Crear la tabla `public.leads` en Supabase

En Supabase (SQL Editor), ejecuta:

- `supabase/schema.sql` (si no lo has hecho)
- `supabase/profiles_public_id.sql` (agrega `profiles.public_id` y actualiza el trigger)
- `supabase/leads.sql` (tabla + índices + RLS)
- `supabase/leads_vigencias.sql` (columnas de vigencia/estado)

## 3) Guardar secrets en Supabase (PowerShell)

IMPORTANTE:

- **No** hardcodees tokens/IDs en el repo.
- **No** uses nombres `SUPABASE_*` para estos secrets.

En PowerShell (en el repo o donde tengas Supabase CLI):

```powershell
npx -y supabase secrets set HIGHLEVEL_PRIVATE_TOKEN="TU_TOKEN_PRIVADO"
npx -y supabase secrets set HIGHLEVEL_LOCATION_ID="TU_LOCATION_ID"
npx -y supabase secrets set HIGHLEVEL_PIPELINE_ID="TU_PIPELINE_ID"
npx -y supabase secrets set HIGHLEVEL_STAGE_ID="TU_STAGE_ID"
npx -y supabase secrets set HIGHLEVEL_STAGE_ID_REUNION="TU_STAGE_REUNION"
npx -y supabase secrets set HIGHLEVEL_STAGE_ID_EXPIRADO="TU_STAGE_EXPIRADO"
npx -y supabase secrets set HIGHLEVEL_STAGE_ID_CERRADO="TU_STAGE_CERRADO"
```

Verifica:

```powershell
npx -y supabase secrets list
```

## 4) Deploy de la Edge Function

```powershell
npx -y supabase functions deploy lead-register --use-api --no-verify-jwt
npx -y supabase functions deploy lead-mark-meeting --use-api --no-verify-jwt
npx -y supabase functions deploy lead-close --use-api --no-verify-jwt
npx -y supabase functions deploy lead-expire --use-api --no-verify-jwt
```

Nota:

- En este proyecto desactivamos `verify_jwt` a nivel gateway porque en algunos entornos Supabase devuelve `Invalid JWT` aun con sesión válida.
- La función **sigue validando** el token internamente usando `supabase.auth.getUser(token)` antes de ejecutar cualquier acción con service role.

## 5) Probar en la app

1. Inicia sesión con un usuario broker o inmobiliaria (Supabase Auth).
2. Entra al panel: `/brokers/dashboard`
3. Abre **Registrar Leads**: `/brokers/leads`
4. Registra un lead:
   - Si ya existía en HighLevel → `EXISTS`
   - Si se creó → `CREATED`
   - Si falla → `ERROR` (y se guarda `hl_error` en la tabla `public.leads`)
