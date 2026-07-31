-- Supermercado deja de ser una lista de compras y pasa a ser un inventario
-- persistente de la casa: cada producto se agrega una sola vez y lo que está
-- inactivo -lo que se terminó- ES la lista de compras.

alter table public.grocery_items
  add column active boolean not null default true;

-- done = true significaba "ya lo compré", o sea que lo tenés en casa.
update public.grocery_items set active = done;

alter table public.grocery_items
  drop column done,
  drop column quantity;

-- Un producto no se repite. Se normaliza a minúsculas y sin espacios sobrantes
-- para que "Leche", "leche" y " Leche " sean el mismo producto.
-- No se normalizan los acentos: eso requeriría un wrapper IMMUTABLE sobre
-- unaccent. El buscador de la app sí ignora acentos, que es donde realmente se
-- evita crear el duplicado; este índice es la red de seguridad.
create unique index grocery_items_user_name_uniq
  on public.grocery_items (user_id, lower(trim(name)));

-- El acceso cambió: primero lo que falta, después el resto, alfabético.
drop index if exists grocery_items_user_created_idx;

create index grocery_items_user_active_name_idx
  on public.grocery_items (user_id, active, lower(trim(name)));
