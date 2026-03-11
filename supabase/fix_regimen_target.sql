-- Ejecutar esto en el SQL Editor de Supabase:

ALTER TABLE public.regimens_master DROP CONSTRAINT regimens_master_target_check;

ALTER TABLE public.regimens_master ADD CONSTRAINT regimens_master_target_check CHECK (target in ('broker', 'inmobiliaria', 'broker_referido', 'inmobiliaria_referida'));
