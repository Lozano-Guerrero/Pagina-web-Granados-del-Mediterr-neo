-- Solución RLS para el sistema de Referidos
-- Pegar y ejecutar en el SQL Editor de Supabase

-- 1. Permitir que los Brokers e Inmobiliarias puedan ver los perfiles que ellos mismos han referido
create policy "read referred profiles"
on public.profiles
for select
using (auth.uid() = referred_by);

-- 2. Permitir que los Brokers e Inmobiliarias puedan ver los leads creados por sus referidos (o sus brokers)
drop policy if exists "read leads from referred users" on public.leads;
create policy "read leads from referred users"
on public.leads
for select
using (
  exists (
    select 1
    from public.profiles p
    where (p.id = leads.created_by_user_id or p.id = leads.inmobiliaria_id)
      and p.referred_by = auth.uid()
  )
);
