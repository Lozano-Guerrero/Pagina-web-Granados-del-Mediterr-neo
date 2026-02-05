-- Supabase: Leads -> esquema + regimen
-- Pega este script en Supabase SQL Editor.
-- Objetivo:
-- - Agregar `esquema` (obligatorio) y `regimen` (obligatorio, solo lectura por ahora)
-- - Backfill para leads existentes
-- - Restringir valores de esquema

alter table public.leads
  add column if not exists esquema text;

alter table public.leads
  add column if not exists regimen text;

-- Backfill (para registros existentes)
update public.leads
set esquema = coalesce(esquema, 'prospector')
where esquema is null;

update public.leads
set regimen = coalesce(regimen, 'PENDIENTE_DEFINIR')
where regimen is null;

-- NOT NULL (después del backfill)
alter table public.leads
  alter column esquema set not null;

alter table public.leads
  alter column regimen set not null;

-- Defaults para nuevos registros
alter table public.leads
  alter column esquema set default 'prospector';

alter table public.leads
  alter column regimen set default 'PENDIENTE_DEFINIR';

-- Constraint: solo 3 valores permitidos (normalizados a minúsculas)
alter table public.leads
  drop constraint if exists leads_esquema_check;

alter table public.leads
  add constraint leads_esquema_check
  check (esquema in ('referidor', 'prospector', 'cerrador'));

