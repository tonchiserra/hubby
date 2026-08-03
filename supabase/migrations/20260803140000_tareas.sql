-- Módulo: tareas.
-- Sigue la convención de módulo definida en el init: user_id con default
-- auth.uid(), RLS con política de dueño, índice por acceso y trigger de
-- updated_at.
--
-- Lo propio de este módulo es el reinicio: una lista puede tener una fecha en
-- la que todo lo hecho vuelve a pendiente. Las cuentas del mes son el caso que
-- lo motiva -alquiler, servicios-: son siempre las mismas tareas y volver a
-- escribirlas cada mes es el trabajo que la app tiene que sacarse de encima.
--
-- La regla se guarda declarativa -cada cuánto y qué día- y no como la fecha del
-- próximo reinicio. Una fecha futura hay que ir moviéndola, y si nadie la mueve
-- queda vencida para siempre; esta app no tiene proceso de fondo que lo haga.
-- Con la regla, en cada lectura se puede preguntar "¿pasó un 1 desde la última
-- vez que reinicié?" y la respuesta es correcta aunque la app no se abra en
-- tres meses.

create table public.task_lists (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,

  name          text not null check (length(trim(name)) between 1 and 80),

  -- Cada cuánto vuelve todo a pendiente.
  reset_kind    text not null default 'nunca'
                check (reset_kind in ('nunca', 'semanal', 'mensual', 'anual')),

  -- Qué día. Semanal: 0 = domingo … 6 = sábado, igual que extract(dow).
  -- Mensual y anual: día del mes. Si el mes no llega a ese día -31 en febrero-
  -- la app lo recorta al último, así que 31 significa "fin de mes".
  reset_day     smallint,
  -- Solo anual: 1 = enero … 12 = diciembre.
  reset_month   smallint,

  -- Las combinaciones imposibles se rechazan acá y no solo en el formulario:
  -- una lista 'mensual' sin día no se puede reiniciar nunca, y sería un dato
  -- roto que no avisa.
  constraint task_lists_reinicio_coherente check (
    case reset_kind
      when 'nunca'   then reset_day is null and reset_month is null
      when 'semanal' then reset_day between 0 and 6 and reset_month is null
      when 'mensual' then reset_day between 1 and 31 and reset_month is null
      when 'anual'   then reset_day between 1 and 31 and reset_month between 1 and 12
    end
  ),

  -- Última vez que se aplicó el reinicio, en fecha local. Es lo que evita que
  -- se aplique dos veces el mismo día, y lo que permite recuperar los que se
  -- pasaron mientras la app no se abría.
  --
  -- La app lo manda explícito al crear la lista: current_date es la fecha del
  -- servidor -UTC en Supabase- y a la noche va un día adelantada respecto de
  -- acá. Queda como default nada más que para que la columna no admita nulos.
  last_reset_on date not null default current_date,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Dos listas con el mismo nombre no se distinguen. Se normaliza igual que en
-- los otros módulos: minúsculas y sin espacios sobrantes.
create unique index task_lists_user_name_uniq
  on public.task_lists (user_id, lower(trim(name)));

-- La pantalla las lee todas, en el orden en que se crearon.
create index task_lists_user_created_idx
  on public.task_lists (user_id, created_at);

create trigger task_lists_set_updated_at
  before update on public.task_lists
  for each row execute function public.set_updated_at();

alter table public.task_lists enable row level security;

create policy "task_lists_owner"
  on public.task_lists
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,

  -- En cascada a propósito: una tarea sin lista no tiene dónde vivir ni cómo
  -- llegar a la pantalla, que se recorre siempre por lista.
  list_id     uuid not null references public.task_lists (id) on delete cascade,

  title       text not null check (length(trim(title)) between 1 and 200),

  -- El estado que el reinicio devuelve a false. Sin historial: la app responde
  -- "¿qué falta hacer ahora?", no "¿cuándo pagaste el alquiler de marzo?".
  done        boolean not null default false,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- La misma tarea no se anota dos veces en la misma lista. El alcance es la
-- lista y no el usuario: "pagar expensas" puede estar en la lista del mes y en
-- la de mudanza sin que sea un error.
create unique index tasks_list_title_uniq
  on public.tasks (list_id, lower(trim(title)));

-- Se leen por lista, en el orden en que se escribieron.
create index tasks_list_created_idx
  on public.tasks (list_id, created_at);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

create policy "tasks_owner"
  on public.tasks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
