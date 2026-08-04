-- Rendimiento y seguridad sobre lo que ya hay. Nada de esto cambia lo que la
-- app muestra: son las mismas cuentas, hechas en menos viajes, y las mismas
-- reglas de acceso, evaluadas una vez por consulta en vez de una vez por fila.

-- ---------------------------------------------------------------------------
-- 1. Los contadores del panel, en una sola ida y vuelta.
-- ---------------------------------------------------------------------------

/**
 * Devuelve numeros crudos, no resumenes. Que significa cada numero -si el
 * modulo reclama atencion, que dice la linea de estado- lo siguen decidiendo
 * los build*Summary en TypeScript, que se prueban sin base de datos.
 *
 * Antes el panel hacia nueve consultas a PostgREST para pintar cuatro
 * tarjetas. Tareas queda afuera a proposito: su resumen tiene que aplicar los
 * reinicios vencidos y esa logica vive en TS.
 *
 * SECURITY INVOKER: corre con los permisos de quien llama, asi que RLS sigue
 * aplicando y nadie ve los contadores de otro.
 */
create or replace function public.panel_resumen()
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  with
  super_faltan as (
    select name
    from public.grocery_items
    where active = false
    order by name
    limit 3
  ),
  super_conteo as (
    select
      count(*) filter (where active = false) as faltan,
      count(*) as total
    from public.grocery_items
  ),
  libros_leyendo as (
    select title
    from public.books
    where status = 'leyendo'
    order by title
    limit 3
  ),
  libros_conteo as (
    select
      -- El anio se toma en la zona de la app y no en UTC, que es donde corre
      -- el servidor. El 31 de diciembre a la noche, en UTC ya es el anio que
      -- viene y los libros terminados dejarian de contar antes de tiempo.
      count(*) filter (
        where status = 'leido'
          and read_year = extract(
                year from (now() at time zone 'America/Argentina/Buenos_Aires')
              )::smallint
      ) as leidos_anio,
      count(*) as total
    from public.books
  ),
  deseos_proximos as (
    select title, price, created_at
    from public.wishes
    where status = 'proximo'
    order by created_at desc
    limit 3
  ),
  deseos_conteo as (
    select
      count(*) filter (where status = 'proximo') as proximos,
      count(*) filter (where status in ('quiero', 'proximo')) as pendientes,
      count(*) as total
    from public.wishes
  )
  select json_build_object(
    'grocery', json_build_object(
      -- coalesce a '[]' porque json_agg sobre cero filas devuelve null, y del
      -- otro lado se espera un arreglo siempre.
      'missing_names', coalesce(
        (select json_agg(name order by name) from super_faltan), '[]'::json
      ),
      'missing_count', (select faltan from super_conteo),
      'total',         (select total  from super_conteo)
    ),
    'books', json_build_object(
      'leyendo', coalesce(
        (select json_agg(title order by title) from libros_leyendo), '[]'::json
      ),
      'leidos_anio', (select leidos_anio from libros_conteo),
      'total',       (select total       from libros_conteo)
    ),
    'wishes', json_build_object(
      'proximos', coalesce(
        (
          select json_agg(
                   json_build_object('title', title, 'price', price)
                   order by created_at desc
                 )
          from deseos_proximos
        ),
        '[]'::json
      ),
      'proximos_count',   (select proximos   from deseos_conteo),
      'pendientes_count', (select pendientes from deseos_conteo),
      'total',            (select total      from deseos_conteo)
    )
  );
$$;

comment on function public.panel_resumen is
  'Contadores crudos del panel. Sin reglas: esas viven en los build*Summary.';

-- ---------------------------------------------------------------------------
-- 2. Marcar varios reinicios de una.
-- ---------------------------------------------------------------------------

/**
 * Cada lista guarda la fecha que le tocaba, no la de hoy, asi que las marcas
 * son distintas entre si y no se pueden resolver con un update plano. Antes se
 * mandaba un update por lista.
 *
 * Mismo patron que reorder_books: los dos arreglos vienen alineados por
 * posicion y unnest de dos argumentos los recorre en paralelo.
 */
create or replace function public.marcar_reinicios(ids uuid[], marcas date[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.task_lists l
  set last_reset_on = nuevo.marca
  from unnest(ids, marcas) as nuevo(id, marca)
  where l.id = nuevo.id;
$$;

comment on function public.marcar_reinicios is
  'Marca el reinicio aplicado de varias listas, cada una con la fecha que le tocaba.';

-- ---------------------------------------------------------------------------
-- 3. Politicas: auth.uid() una vez por consulta, no una por fila.
-- ---------------------------------------------------------------------------

-- Envuelto en (select ...) Postgres lo evalua como InitPlan, una sola vez.
-- Sin el parentesis se llama por cada fila examinada.

drop policy "grocery_items_owner" on public.grocery_items;
create policy "grocery_items_owner"
  on public.grocery_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "books_owner" on public.books;
create policy "books_owner"
  on public.books for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "wishes_owner" on public.wishes;
create policy "wishes_owner"
  on public.wishes for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "task_lists_owner" on public.task_lists;
create policy "task_lists_owner"
  on public.task_lists for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/**
 * tasks lleva ademas la comprobacion de que list_id sea de una lista tuya.
 *
 * La foreign key solo garantiza que la lista exista, y addTask recibe el
 * list_id del cliente: sin esto se puede insertar una tarea propia colgando de
 * la lista de otro. Queda huerfana e invisible para los dos, pero es una fila
 * que no deberia poder escribirse.
 *
 * Va solo en `with check` y no en `using`: es una condicion de escritura, y
 * meterla en `using` encareceria todas las lecturas para cubrir un caso que
 * solo ocurre al insertar o mover una fila.
 */
drop policy "tasks_owner" on public.tasks;
create policy "tasks_owner"
  on public.tasks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.task_lists l
      where l.id = list_id
        and l.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 4. El trigger de updated_at no necesita privilegios elevados.
-- ---------------------------------------------------------------------------

-- Setear una columna de la fila que se esta escribiendo lo puede hacer quien
-- ya tiene permiso de escribirla. SECURITY DEFINER solo agregaba superficie.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. El indice del super, alineado con el orden que la consulta pide.
-- ---------------------------------------------------------------------------

-- Estaba sobre lower(trim(name)) pero las consultas ordenan por name pelado,
-- asi que el indice no servia para el orden y Postgres ordenaba en memoria.
-- El indice unico sobre lower(trim(name)) sigue existiendo aparte: ese es el
-- que evita duplicados y no es este.
--
-- Se indexa (user_id, active, name) y no (user_id, name): la consulta que se
-- beneficia es la del panel, que filtra por active y corta en tres. La lectura
-- de la pantalla se trae el inventario entero, asi que ningun indice le evita
-- leer todas las filas.
drop index if exists public.grocery_items_user_active_name_idx;

create index grocery_items_user_active_name_idx
  on public.grocery_items (user_id, active, name);
