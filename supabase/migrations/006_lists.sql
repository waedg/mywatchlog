-- 006 : listes personnalisées (phase 9, D-49).
-- Une liste est privée (une par compte) et peut contenir n'importe quel titre de la table `titles`,
-- indépendamment de `user_titles` (« Ma liste ») : supprimer une liste ne touche jamais à Ma liste.

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nom unique par compte, sans distinction de majuscules ni d'espaces autour.
create unique index lists_user_name_unique on public.lists (user_id, lower(btrim(name)));

create table public.list_items (
  list_id uuid not null references public.lists (id) on delete cascade,
  title_id bigint not null,
  title_type text not null check (title_type in ('movie', 'tv')),
  added_at timestamptz not null default now(),
  primary key (list_id, title_id, title_type),
  foreign key (title_id, title_type) references public.titles (id, type)
);

-- Retrouver les listes d'un titre (section « Listes » de la fiche).
create index list_items_title_idx on public.list_items (title_id, title_type);

-- Limites (défense en profondeur ; l'application les contrôle aussi) : 50 listes par compte, 500 titres par liste.
create function public.lists_before_write() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  if tg_op = 'INSERT' then
    if (select count(*) from public.lists where user_id = new.user_id) >= 50 then
      raise exception 'list_limit_reached' using errcode = 'check_violation';
    end if;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger lists_before_write before insert or update on public.lists
  for each row execute function public.lists_before_write();

create function public.list_items_before_insert() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.list_items where list_id = new.list_id) >= 500 then
    raise exception 'list_items_limit_reached' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger list_items_before_insert before insert on public.list_items
  for each row execute function public.list_items_before_insert();

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

create policy lists_own on public.lists for all to authenticated
  using (user_id = (select auth.uid()) and public.is_allowed())
  with check (user_id = (select auth.uid()) and public.is_allowed());

create policy list_items_own on public.list_items for all to authenticated
  using (
    public.is_allowed()
    and exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
  )
  with check (
    public.is_allowed()
    and exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
  );
