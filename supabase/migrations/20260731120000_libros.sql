-- Módulo: libros.
-- Sigue la convención de módulo definida en el init: user_id con default
-- auth.uid(), RLS con política de dueño, índice por acceso y trigger de
-- updated_at.

create table public.books (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,

  title       text not null check (length(trim(title)) between 1 and 300),
  author      text check (author is null or length(trim(author)) <= 200),
  year        smallint check (year is null or year between 1 and 2200),

  -- Portada de Open Library. Se guarda la URL y no el binario: son imágenes
  -- públicas y estables, y no tiene sentido gastar storage de la capa gratuita.
  cover_url   text,
  /** Identificador de Open Library, para no duplicar el mismo libro. */
  olid        text,

  status      text not null default 'quiero'
              check (status in ('quiero', 'leyendo', 'leido')),
  format      text not null default 'libro'
              check (format in ('libro', 'audiolibro')),

  -- De 0 a 5 con medios. numeric es decimal exacto en Postgres, así que
  -- comparar 4.5 no tiene los problemas de la coma flotante.
  rating      numeric(2,1) check (
                rating is null
                or (rating >= 0 and rating <= 5 and (rating * 2) % 1 = 0)
              ),

  -- El año en que se leyó, no la fecha: nadie se acuerda del día.
  read_year   smallint check (read_year is null or read_year between 1900 and 2200),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Un mismo libro no se carga dos veces. Se normaliza igual que en el
-- supermercado: minúsculas y sin espacios sobrantes.
create unique index books_user_title_uniq
  on public.books (user_id, lower(trim(title)));

-- La lista se lee agrupada por estado y ordenada por título.
create index books_user_status_title_idx
  on public.books (user_id, status, lower(trim(title)));

-- El panel cuenta los leídos del año en curso.
create index books_user_read_year_idx
  on public.books (user_id, read_year) where read_year is not null;

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

alter table public.books enable row level security;

create policy "books_owner"
  on public.books
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
