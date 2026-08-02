-- Módulo: deseos.
-- Sigue la convención de módulo definida en el init: user_id con default
-- auth.uid(), RLS con política de dueño, índice por acceso y trigger de
-- updated_at.

create table public.wishes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,

  title       text not null check (length(trim(title)) between 1 and 200),

  -- numeric y no float: es decimal exacto, así que sumar precios no arrastra
  -- error de coma flotante. La escala de 2 deja los centavos por si el deseo
  -- es barato, y la precisión de 12 admite hasta diez dígitos enteros.
  -- Sin moneda: la lista es de una persona y se asume la suya.
  price       numeric(12,2) check (price is null or price >= 0),

  -- Dónde comprarlo. Solo http(s): otro esquema no va a abrir desde el
  -- navegador, así que se rechaza en la base y no solo en el formulario.
  url         text check (
                url is null
                or (url ~* '^https?://' and length(url) <= 2000)
              ),

  -- 'quiero' es la pila de algún día y no reclama nada; 'proximo' es lo que
  -- decidiste comprar y es lo único que le pesa al panel.
  status      text not null default 'quiero'
              check (status in ('quiero', 'proximo', 'comprado')),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- El mismo deseo no se anota dos veces. Se normaliza igual que en los otros
-- módulos: minúsculas y sin espacios sobrantes.
create unique index wishes_user_title_uniq
  on public.wishes (user_id, lower(trim(title)));

-- El panel pide los 'proximo' más recientes y cuenta por estado.
create index wishes_user_status_idx
  on public.wishes (user_id, status, created_at desc);

create trigger wishes_set_updated_at
  before update on public.wishes
  for each row execute function public.set_updated_at();

alter table public.wishes enable row level security;

create policy "wishes_owner"
  on public.wishes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
