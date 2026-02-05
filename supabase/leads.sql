-- Supabase: Leads (Brokers/Inmobiliarias) + RLS
-- Pega este script en Supabase SQL Editor (después de ejecutar `supabase/schema.sql`).

-- Requerido para gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Tabla
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  created_by_user_id uuid not null references auth.users(id),
  created_by_role text not null check (created_by_role in ('admin', 'broker', 'inmobiliaria')),

  inmobiliaria_id uuid null references auth.users(id) on delete set null,
  inmobiliaria_name text null,

  lead_first_name text not null,
  lead_last_name text not null,
  lead_email text null,
  lead_phone text null,
  lead_phone_digits text null,

  esquema text not null default 'prospector' check (esquema in ('referidor', 'prospector', 'cerrador')),
  regimen text not null default 'PENDIENTE_DEFINIR',

  hl_status text not null check (hl_status in ('CREATED', 'EXISTS', 'ERROR')),
  hl_contact_id text null,
  hl_opportunity_id text null,
  hl_existing_since timestamptz null,
  hl_match_type text null check (hl_match_type in ('phone', 'email') or hl_match_type is null),
  hl_error text null,

  lot_number text null,
  lot_type text null,
  lot_area_m2 numeric null,
  lot_price_per_m2 numeric null
);

-- 2) Índices
create index if not exists leads_created_by_user_id_idx on public.leads (created_by_user_id);
create index if not exists leads_inmobiliaria_id_idx on public.leads (inmobiliaria_id);
create index if not exists leads_lead_email_idx on public.leads (lead_email);
create index if not exists leads_lead_phone_idx on public.leads (lead_phone);
create index if not exists leads_lead_phone_digits_idx on public.leads (lead_phone_digits);

-- 3) RLS
alter table public.leads enable row level security;

-- Admin: manage all
drop policy if exists "admin manage leads" on public.leads;
create policy "admin manage leads"
on public.leads
for all
using (public.is_admin())
with check (public.is_admin());

-- Broker/Inmobiliaria: read own leads
drop policy if exists "read own leads" on public.leads;
create policy "read own leads"
on public.leads
for select
using (created_by_user_id = auth.uid());

-- Inmobiliaria: read leads de su organización (hijos + propios si inmobiliaria_id = auth.uid())
drop policy if exists "inmobiliaria read org leads" on public.leads;
create policy "inmobiliaria read org leads"
on public.leads
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'inmobiliaria'
      and p.is_active = true
  )
  and inmobiliaria_id = auth.uid()
);

-- Insert: usuarios activos pueden insertar sus propios leads (opcional; Edge Function con service role lo bypass-ea)
drop policy if exists "insert own lead" on public.leads;
create policy "insert own lead"
on public.leads
for insert
with check (
  created_by_user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in ('admin', 'broker', 'inmobiliaria')
  )
);
