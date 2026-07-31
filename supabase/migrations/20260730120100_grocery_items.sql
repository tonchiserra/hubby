-- Módulo: lista del súper.
-- Primera tabla que sigue la convención de módulo definida en el init.

create table public.grocery_items (
  id          uuid primary key default gen_random_uuid(),
  -- default auth.uid() evita mandar user_id en cada insert desde el cliente.
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (length(trim(name)) between 1 and 120),
  quantity    integer not null default 1 check (quantity > 0),
  done        boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- La lista se lee siempre filtrando por dueño y ordenando por fecha: este
-- índice cubre exactamente ese acceso.
create index grocery_items_user_created_idx
  on public.grocery_items (user_id, created_at desc);

create trigger grocery_items_set_updated_at
  before update on public.grocery_items
  for each row execute function public.set_updated_at();

alter table public.grocery_items enable row level security;

-- Política única de dueño. `using` filtra lo que se puede leer/actualizar/borrar;
-- `with check` impide insertar o mover filas a nombre de otro usuario.
create policy "grocery_items_owner"
  on public.grocery_items
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
