-- Supabase: Leads - Vigencias + Estados (VIGENTE/REUNION/EXPIRADO/CERRADO)
-- Pega este script en Supabase SQL Editor DESPUÉS de ejecutar `supabase/leads.sql`.

-- 1) Columnas nuevas (congelan valores de vigencia al momento de crear el lead)
alter table public.leads
  add column if not exists lead_state text not null default 'VIGENTE',
  add column if not exists initial_days integer not null default 0,
  add column if not exists meeting_days integer not null default 0,
  add column if not exists expires_at timestamptz not null default now(),
  add column if not exists meeting_set_at timestamptz null,
  add column if not exists closed_at timestamptz null,
  add column if not exists expired_at timestamptz null;

-- 2) Constraint (best-effort, evita valores inválidos)
do $$
begin
  alter table public.leads
    add constraint leads_lead_state_check
    check (lead_state in ('VIGENTE', 'REUNION', 'EXPIRADO', 'CERRADO'));
exception
  when duplicate_object then null;
end $$;

-- 3) Índices útiles
create index if not exists leads_expires_at_idx on public.leads (expires_at);
create index if not exists leads_lead_state_idx on public.leads (lead_state);

