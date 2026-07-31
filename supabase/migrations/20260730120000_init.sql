-- Cimientos compartidos por todos los módulos de hubby.
-- Cada módulo nuevo repite la misma convención: user_id + RLS + índice +
-- trigger de updated_at. Es el retorno concreto de la arquitectura híbrida.

-- gen_random_uuid() vive en pgcrypto, disponible en Supabase por defecto.
create extension if not exists pgcrypto with schema extensions;

-- Mantiene updated_at sin que la aplicación tenga que acordarse.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Trigger BEFORE UPDATE: refresca updated_at. Reutilizado por cada tabla de módulo.';
