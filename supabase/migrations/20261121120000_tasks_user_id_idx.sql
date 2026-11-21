-- El advisor de rendimiento del proyecto nuevo (São Paulo, 2026-11-21) marcó
-- la única clave foránea sin índice: tasks.user_id -> auth.users. La usa el
-- `on delete cascade` al borrar un usuario y la política de dueño de tasks,
-- que compara user_id en cada fila. El resto de las tablas ya lo tenía
-- cubierto como primera columna de su índice de pantalla.
create index if not exists tasks_user_id_idx on public.tasks (user_id);
