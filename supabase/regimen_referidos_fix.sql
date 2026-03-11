-- HOTFIX: get_regimen_context() with is_referred support
-- Run this in Supabase SQL Editor.
-- 
-- CHANGES vs previous version:
-- 1. Reads `is_referred` from profiles
-- 2. Referred brokers are NOT treated as "child brokers" (they sign their own regimen)
-- 3. Effective target for referred users is broker_referido / inmobiliaria_referida

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
  select p.id, p.role, p.is_active, p.account_status, p.org_id, p.is_referred
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

  -- Determine if broker child (linked to inmobiliaria) via org_id.
  -- IMPORTANT: referred brokers are NOT child brokers, they sign their own regimen.
  if me.role = 'broker' and me.org_id is not null and (me.is_referred is null or me.is_referred = false) then
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

  -- Determine effective regimen target based on role and is_referred.
  if me.role = 'inmobiliaria' then
    if me.is_referred = true then
      eff_target := 'inmobiliaria_referida';
    else
      eff_target := 'inmobiliaria';
    end if;
  elsif me.role = 'broker' then
    if me.is_referred = true then
      eff_target := 'broker_referido';
    else
      eff_target := 'broker';
    end if;
  else
    eff_target := null;
  end if;

  -- Child brokers use their parent inmobiliaria's regimen target.
  if is_child then
    eff_target := 'inmobiliaria';
  end if;

  -- Pick active regimen for the effective target.
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
    'isReferred', coalesce(me.is_referred, false),
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
