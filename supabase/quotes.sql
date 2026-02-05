-- Supabase: Quotes / Cotizaciones
-- Pega este script en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.quotes (
  id text primary key,
  created_at timestamptz not null default now(),

  broker_id uuid not null references auth.users(id) on delete cascade,
  broker_name_snapshot text not null,

  lead_id uuid null references public.leads(id) on delete set null,
  lead_name_snapshot text not null,

  lot_number text null,
  lot_typology text null,

  payment_method text not null check (payment_method in ('ANUALIDADES_40', 'MSI_44')),
  mensualidades_num int not null,
  mensualidad_monto numeric not null,

  enganche_monto numeric null,
  anualidad_monto numeric null,
  pago_escritura_monto numeric null,

  precio_m2 numeric not null,
  tamano_m2 numeric not null,
  costo_base numeric not null,
  descuento numeric not null,
  costo_final numeric not null,

  regimen_name_snapshot text not null default 'PENDIENTE_DEFINIR',

  pdf_path text null
);

create index if not exists quotes_broker_id_idx on public.quotes (broker_id, created_at desc);
create index if not exists quotes_lead_id_idx on public.quotes (lead_id);
create index if not exists quotes_lot_number_idx on public.quotes (lot_number);

alter table public.quotes enable row level security;

-- Admin: manage all
drop policy if exists "admin manage quotes" on public.quotes;
create policy "admin manage quotes"
on public.quotes
for all
using (public.is_admin())
with check (public.is_admin());

-- Users: read own quotes
drop policy if exists "read own quotes" on public.quotes;
create policy "read own quotes"
on public.quotes
for select
using (broker_id = auth.uid());

-- Users: insert own quotes (registrar cotización desde el cotizador)
drop policy if exists "insert own quote" on public.quotes;
create policy "insert own quote"
on public.quotes
for insert
with check (
  broker_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and coalesce(p.account_status, 'active') <> 'deactivated'
  )
);

