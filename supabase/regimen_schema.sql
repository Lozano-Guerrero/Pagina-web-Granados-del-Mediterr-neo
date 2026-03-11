-- Supabase: Regimen (master PDFs + signed PDFs) + account_status
-- Pega este script en Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 0) FIX: is_admin() sin recursión de RLS (importante para evitar "infinite recursion detected ...").
-- Si ya existe, lo reemplaza con una versión segura.
create or replace function public.is_admin()
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
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

-- 1) Estado de cuenta (separa "desactivado" manual vs "inactivo" por régimen pendiente)
alter table public.profiles
  add column if not exists account_status text not null default 'active'
  check (account_status in ('active', 'inactive', 'deactivated'));

-- Backfill: si ya estaban desactivados por is_active=false, marcarlos como deactivated.
update public.profiles
set account_status = 'deactivated'
where is_active = false and account_status <> 'deactivated';

-- 2) Regímenes master (versionados)
create table if not exists public.regimens_master (
  id uuid primary key default gen_random_uuid(),
  target text not null check (target in ('broker', 'inmobiliaria', 'broker_referido', 'inmobiliaria_referida')),
  version int not null,
  display_name text not null,
  file_name text not null,
  storage_bucket text not null default 'regimens_master',
  storage_path text not null,
  is_active boolean not null default false,
  created_by_user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz null
);

create unique index if not exists regimens_master_target_version_key
  on public.regimens_master (target, version);

create index if not exists regimens_master_active_idx
  on public.regimens_master (target, is_active);

-- 3) Regímenes firmados por usuario
create table if not exists public.regimens_signed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  regimen_id uuid not null references public.regimens_master(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null default 'regimens_signed',
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists regimens_signed_user_idx
  on public.regimens_signed (user_id, created_at desc);

create index if not exists regimens_signed_regimen_idx
  on public.regimens_signed (regimen_id);

-- 4) RLS
alter table public.regimens_master enable row level security;
alter table public.regimens_signed enable row level security;

-- Admin manage regimens
drop policy if exists "admin manage regimens_master" on public.regimens_master;
create policy "admin manage regimens_master"
on public.regimens_master
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manage regimens_signed" on public.regimens_signed;
create policy "admin manage regimens_signed"
on public.regimens_signed
for all
using (public.is_admin())
with check (public.is_admin());

-- Users can read their own signed rows (optional, for UI)
drop policy if exists "read own regimens_signed" on public.regimens_signed;
create policy "read own regimens_signed"
on public.regimens_signed
for select
using (auth.uid() = user_id);

-- 5) Helper: contexto de régimen para UI/bloqueo de leads
-- Evita recursión de RLS: usamos SECURITY DEFINER con row_security=off.
create or replace function public.get_regimen_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare
  me record;
  parent_inmo_id uuid := null;
  parent_inmo_status text := null;
  is_child boolean := false;
  eff_target text := null;
  active_reg record;
  can_register boolean := true;
  block_reason text := null;
  regimen_name text := null;
begin
  select p.id, p.role, p.is_active, p.account_status, p.org_id
  into me
  from public.profiles p
  where p.id = auth.uid()
  limit 1;

  if me.id is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  -- Manual deactivation still wins.
  if me.is_active = false or me.account_status = 'deactivated' then
    return jsonb_build_object(
      'ok', true,
      'role', me.role,
      'isChildBroker', false,
      'canSeeModule', false,
      'canRegisterLeads', false,
      'blockReason', 'Usuario desactivado.',
      'regimenName', null,
      'accountStatus', me.account_status
    );
  end if;

  -- Determine if broker child (linked to inmobiliaria) via org_id having an inmobiliaria rep.
  if me.role = 'broker' and me.org_id is not null then
    select p.id, p.account_status
    into parent_inmo_id, parent_inmo_status
    from public.profiles p
    where p.role = 'inmobiliaria'
      and p.org_id = me.org_id
      and p.is_active = true
    limit 1;

    if parent_inmo_id is not null then
      is_child := true;
    end if;
  end if;

  if me.role = 'inmobiliaria' then
    eff_target := 'inmobiliaria';
  elsif me.role = 'broker' then
    eff_target := 'broker';
  else
    eff_target := null;
  end if;

  -- Pick active regimen for the effective target.
  if is_child then
    eff_target := 'inmobiliaria';
  end if;

  select r.id, r.display_name
  into active_reg
  from public.regimens_master r
  where r.target = eff_target
    and r.is_active = true
  order by r.version desc
  limit 1;

  regimen_name := active_reg.display_name;

  -- Block rules
  if is_child then
    if parent_inmo_status = 'inactive' then
      can_register := false;
      block_reason := 'Tu representante debe enviar el nuevo régimen firmado para continuar con el registro de leads.';
    end if;
  else
    if me.account_status = 'inactive' then
      can_register := false;
      block_reason := 'Debes enviar el nuevo régimen firmado para continuar.';
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'role', me.role,
    'isChildBroker', is_child,
    'canSeeModule', (not is_child) and (me.role in ('broker','inmobiliaria')),
    'canRegisterLeads', can_register,
    'blockReason', block_reason,
    'regimenName', regimen_name,
    'target', eff_target,
    'activeRegimenId', active_reg.id,
    'accountStatus', me.account_status,
    'parentAccountStatus', parent_inmo_status,
    'parentInmoId', parent_inmo_id
  );
end;
$$;
