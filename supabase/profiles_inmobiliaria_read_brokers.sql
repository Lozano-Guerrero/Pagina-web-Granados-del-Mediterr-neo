-- Supabase: Permitir que inmobiliarias lean brokers "hijos" (misma org_id) SIN recursión de policies
-- Pega este script en Supabase SQL Editor.
--
-- Problema que corrige:
-- "infinite recursion detected in policy for relation \"profiles\""
-- ocurre cuando una policy de profiles vuelve a consultar profiles dentro de su USING.
--
-- Solución:
-- 1) Crear una función SECURITY DEFINER que lee el org_id del usuario actual con row_security=off
-- 2) Policy que compara org_id de la fila vs org_id del caller (sin subquery a profiles dentro del USING)

-- 0) Elimina la policy recursiva si existe
drop policy if exists "inmobiliaria read brokers in org" on public.profiles;

-- 1) Función helper (no recursiva)
create or replace function public.get_inmobiliaria_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p.org_id
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'inmobiliaria'
    and p.is_active = true
  limit 1;
$$;

-- 2) Policy: inmobiliaria puede leer brokers de su org_id
create policy "inmobiliaria read brokers in org"
on public.profiles
for select
using (
  profiles.role = 'broker'
  and profiles.org_id = public.get_inmobiliaria_org_id()
);

