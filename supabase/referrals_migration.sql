-- Migration para añadir Referidos a Profiles y Regimens

-- 1) Añadir referred_by y is_referred a profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_referred boolean NOT NULL DEFAULT false;

-- 2) Actualizar la restricción en regimens_master para admitir referidos
ALTER TABLE public.regimens_master DROP CONSTRAINT IF EXISTS regimens_master_target_check;
ALTER TABLE public.regimens_master ADD CONSTRAINT regimens_master_target_check CHECK (target IN ('broker', 'inmobiliaria', 'broker_referido', 'inmobiliaria_referida'));

-- 3) Actualizar la función get_regimen_context() para que consuma el target correcto si el usuario es referido
CREATE OR REPLACE FUNCTION public.get_regimen_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  me record;
  parent_inmo_id uuid := null;
  parent_inmo_status text := null;
  is_child boolean := false;
  eff_target text := null;
  active_reg record;
  can_register boolean := true;
  block_reason text := null;
  regimen_name text := null;
BEGIN
  SELECT p.id, p.role, p.is_active, p.account_status, p.org_id, p.is_referred
  INTO me
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;

  IF me.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'profile_not_found');
  END IF;

  -- Manual deactivation still wins.
  IF me.is_active = false OR me.account_status = 'deactivated' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'role', me.role,
      'isChildBroker', false,
      'canSeeModule', false,
      'canRegisterLeads', false,
      'blockReason', 'Usuario desactivado.',
      'regimenName', null,
      'accountStatus', me.account_status
    );
  END IF;

  -- Determine if broker child (linked to inmobiliaria) via org_id having an inmobiliaria rep.
  IF me.role = 'broker' AND me.org_id IS NOT NULL THEN
    SELECT p.id, p.account_status
    INTO parent_inmo_id, parent_inmo_status
    FROM public.profiles p
    WHERE p.role = 'inmobiliaria'
      AND p.org_id = me.org_id
      AND p.is_active = true
    LIMIT 1;

    IF parent_inmo_id IS NOT NULL THEN
      is_child := true;
    END IF;
  END IF;

  IF me.role = 'inmobiliaria' THEN
    IF me.is_referred THEN
      eff_target := 'inmobiliaria_referida';
    ELSE
      eff_target := 'inmobiliaria';
    END IF;
  ELSIF me.role = 'broker' THEN
    IF me.is_referred THEN
      eff_target := 'broker_referido';
    ELSE
      eff_target := 'broker';
    END IF;
  ELSE
    eff_target := null;
  END IF;

  -- Pick active regimen for the effective target.
  IF is_child AND NOT me.is_referred THEN
    -- If child broker of an inmobiliaria and not referred, use inmobiliaria target
    -- Wait, if a broker is referred by someone, they shouldn't be a child but let's be safe.
    -- Assuming a referred broker acts independently regarding its regimen target.
    eff_target := 'inmobiliaria';
  END IF;

  SELECT r.id, r.display_name
  INTO active_reg
  FROM public.regimens_master r
  WHERE r.target = eff_target
    AND r.is_active = true
  ORDER BY r.version DESC
  LIMIT 1;

  regimen_name := active_reg.display_name;

  -- Block rules
  IF is_child AND NOT me.is_referred THEN
    IF parent_inmo_status = 'inactive' THEN
      can_register := false;
      block_reason := 'Tu representante debe enviar el nuevo régimen firmado para continuar con el registro de leads.';
    END IF;
  ELSE
    IF me.account_status = 'inactive' THEN
      can_register := false;
      block_reason := 'Debes enviar el nuevo régimen firmado para continuar.';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'role', me.role,
    'isChildBroker', is_child,
    'canSeeModule', (NOT is_child OR me.is_referred) AND (me.role IN ('broker','inmobiliaria')),
    'canRegisterLeads', can_register,
    'blockReason', block_reason,
    'regimenName', regimen_name,
    'target', eff_target,
    'activeRegimenId', active_reg.id,
    'accountStatus', me.account_status,
    'parentAccountStatus', parent_inmo_status,
    'parentInmoId', parent_inmo_id
  );
END;
$$;
