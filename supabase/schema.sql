-- Supabase Schema (Organizations + Profiles + RLS + Trigger)
-- Pega este script en Supabase SQL Editor.

-- Requerido para gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Tablas
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  email text,
  role text not null default 'broker' check (role in ('admin', 'subadmin', 'broker', 'inmobiliaria')),
  org_id uuid null references public.organizations(id),
  public_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 1.1) public_id: columna + unicidad + NOT NULL
alter table public.profiles
  add column if not exists public_id text;

create unique index if not exists profiles_public_id_key
  on public.profiles (public_id);

-- Helper para generar IDs únicos (BRK-XXXXXX / INM-XXXXXX / ADM-XXXXXX)
create or replace function public.generate_public_id(prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    -- Usamos md5(random()) para no depender de funciones de extensiones en el search_path.
    candidate := prefix || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (
      select 1
      from public.profiles p
      where p.public_id = candidate
    );
  end loop;
  return candidate;
end;
$$;

-- Backfill para perfiles existentes (si se corre el script más de 1 vez)
update public.profiles
set public_id = public.generate_public_id(
  case
    when role = 'admin' then 'ADM-'
    when role = 'subadmin' then 'SUB-'
    when role = 'inmobiliaria' then 'INM-'
    when role = 'broker' then 'BRK-'
    else 'USR-'
  end
)
where public_id is null;

alter table public.profiles
  alter column public_id set not null;

-- 2) Helper: is_admin()
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

-- 3) RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "admin manage profiles" on public.profiles;
create policy "admin manage profiles"
on public.profiles
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own organization" on public.organizations;
create policy "read own organization"
on public.organizations
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organizations.id
  )
);

drop policy if exists "admin manage organizations" on public.organizations;
create policy "admin manage organizations"
on public.organizations
for all
using (public.is_admin())
with check (public.is_admin());

-- 4) Trigger: crear profile cuando se crea usuario (auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, public_id)
  values (new.id, new.email, 'broker', public.generate_public_id('BRK-'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
