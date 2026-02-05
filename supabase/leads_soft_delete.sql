-- Supabase: Leads soft delete
-- Pega este script en Supabase SQL Editor.
-- Objetivo: permitir "Eliminar" sin borrar físicamente.

alter table public.leads
  add column if not exists is_deleted boolean not null default false;

alter table public.leads
  add column if not exists deleted_at timestamptz null;

alter table public.leads
  add column if not exists deleted_by_user_id uuid null references auth.users(id) on delete set null;

create index if not exists leads_is_deleted_idx on public.leads (is_deleted);

