-- Orden manual de la biblioteca: se arrastra y se suelta, así que el orden lo
-- decide el usuario y hay que persistirlo.

alter table public.books
  add column position integer not null default 0;

-- Semilla: se respeta el orden que ya se veía -año descendente, después la
-- última edición- para que la lista no se mezcle al aplicar esto.
with ordenados as (
  select id, row_number() over (
    partition by user_id
    order by read_year desc nulls last, updated_at desc
  ) as fila
  from public.books
)
update public.books b
set position = o.fila
from ordenados o
where b.id = o.id;

create index books_user_position_idx on public.books (user_id, position);

/**
 * Reordena en una sola ida y vuelta: recibe los ids en el orden nuevo y asigna
 * la posición por índice del arreglo.
 *
 * Va como función y no como una serie de updates desde la app por dos razones:
 * es atómico -no queda un orden a medias si algo falla- y es una sola request
 * en vez de una por libro.
 *
 * SECURITY INVOKER a propósito: corre con los permisos de quien llama, así que
 * RLS sigue aplicando y nadie puede reordenar libros ajenos.
 */
create or replace function public.reorder_books(ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.books b
  set position = nuevo.orden
  from (
    select unnest(ids) as id, generate_subscripts(ids, 1) as orden
  ) as nuevo
  where b.id = nuevo.id;
$$;
