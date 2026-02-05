-- Supabase: Profiles public_id (identificador corto)
-- Pega este script en Supabase SQL Editor.
--
-- Objetivo:
-- - Agregar `public_id` a `public.profiles`
-- - Generar un ID corto por rol (BRK-XXXXXX / INM-XXXXXX / ADM-XXXXXX / SUB-XXXXXX)
-- - Backfill para usuarios existentes
-- - Asegurar unicidad y NOT NULL
-- - Actualizar el trigger `handle_new_user` para que siempre cree `public_id`

create extension if not exists pgcrypto;

-- 1) Columna
alter table public.profiles
  add column if not exists public_id text;

-- 2) Helper para generar IDs únicos
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

-- 3) Backfill para usuarios existentes (solo donde esté null)
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

-- 4) Unicidad + NOT NULL
create unique index if not exists profiles_public_id_key
  on public.profiles (public_id);

alter table public.profiles
  alter column public_id set not null;

-- 5) Trigger: crear profile cuando se crea usuario (auth.users)
-- Nota: el rol por defecto es broker, por eso el prefijo BRK-.
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
