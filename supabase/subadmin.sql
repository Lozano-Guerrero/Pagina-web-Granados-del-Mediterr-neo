-- Supabase: Rol subadmin + helpers + RLS (staff)
-- Pega este script en Supabase SQL Editor.
--
-- Objetivo:
-- - Agregar role='subadmin' en public.profiles
-- - Crear helpers: is_subadmin(), is_staff()
-- - Permitir que subadmin use el panel /admin (lecturas y acciones),
--   pero SIN poder leer el perfil del usuario admin (role='admin')

-- 1) Permitir role=subadmin (check constraint)
do $$
declare
  c record;
begin
  -- Drop any CHECK constraint that references the `role` column (name can vary).
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', c.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'subadmin', 'broker', 'inmobiliaria'));

-- 2) Helpers (evitan recursión de RLS con row_security=off)
create or replace function public.is_subadmin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'subadmin'
      and p.is_active = true
      and coalesce(p.account_status, 'active') <> 'deactivated'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'subadmin')
      and p.is_active = true
      and coalesce(p.account_status, 'active') <> 'deactivated'
  );
$$;

-- 3) Profiles: subadmin puede leer todo excepto el usuario admin
alter table public.profiles enable row level security;

drop policy if exists "subadmin read profiles" on public.profiles;
create policy "subadmin read profiles"
on public.profiles
for select
using (
  public.is_subadmin()
  and profiles.role <> 'admin'
);

-- 4) Organizations: staff manage (incluye select para panel admin)
alter table public.organizations enable row level security;

drop policy if exists "staff manage organizations" on public.organizations;
create policy "staff manage organizations"
on public.organizations
for all
using (public.is_staff())
with check (public.is_staff());

-- 5) Leads: staff manage (panel admin elimina/actualiza)
alter table public.leads enable row level security;

drop policy if exists "staff manage leads" on public.leads;
create policy "staff manage leads"
on public.leads
for all
using (public.is_staff())
with check (public.is_staff());

-- 6) Quotes: staff manage (historial admin)
alter table public.quotes enable row level security;

drop policy if exists "staff manage quotes" on public.quotes;
create policy "staff manage quotes"
on public.quotes
for all
using (public.is_staff())
with check (public.is_staff());

-- 7) Regímenes: staff manage (subir/activar/descargar historial)
alter table public.regimens_master enable row level security;
alter table public.regimens_signed enable row level security;

drop policy if exists "staff manage regimens_master" on public.regimens_master;
create policy "staff manage regimens_master"
on public.regimens_master
for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "staff manage regimens_signed" on public.regimens_signed;
create policy "staff manage regimens_signed"
on public.regimens_signed
for all
using (public.is_staff())
with check (public.is_staff());
