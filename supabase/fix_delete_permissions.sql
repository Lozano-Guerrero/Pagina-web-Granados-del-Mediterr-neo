-- RLS Permissions Fix: Deletion and Updates for Brokers/Inmobiliarias
-- Paste this in your Supabase SQL Editor

-- 1) Permissions for LEADS
-- Allow users to UPDATE their own leads
drop policy if exists "update own leads" on public.leads;
create policy "update own leads"
on public.leads
for update
using (created_by_user_id = auth.uid())
with check (created_by_user_id = auth.uid());

-- Allow users to DELETE their own leads
drop policy if exists "delete own leads" on public.leads;
create policy "delete own leads"
on public.leads
for delete
using (created_by_user_id = auth.uid());


-- 2) Permissions for QUOTES (Cotizaciones)
-- Allow users to DELETE their own quotes
drop policy if exists "delete own quotes" on public.quotes;
create policy "delete own quotes"
on public.quotes
for delete
using (broker_id = auth.uid());

-- Optional: Allow users to UPDATE their own quotes (if needed in the future)
drop policy if exists "update own quotes" on public.quotes;
create policy "update own quotes"
on public.quotes
for update
using (broker_id = auth.uid())
with check (broker_id = auth.uid());
