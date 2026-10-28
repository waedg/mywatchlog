-- 001 : liste d'autorisation, cache de titres, suivi par utilisateur
-- Appliquée le 2026-10-28 sur le projet Supabase `mywatchlog`.
-- L'adresse autorisée est insérée à part (hors dépôt) :
--   insert into public.allowed_emails (email) values ('<adresse Google>');

create table public.allowed_emails (email text primary key);
alter table public.allowed_emails enable row level security;
-- aucune policy : table inaccessible depuis le client

create function public.is_allowed() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.is_allowed() from public, anon;
grant execute on function public.is_allowed() to authenticated;

create table public.titles (
  id bigint primary key,
  type text not null check (type in ('movie','tv')),
  imdb_id text,
  title text not null,
  year int,
  poster_path text,
  updated_at timestamptz not null default now()
);
alter table public.titles enable row level security;
create policy titles_read on public.titles for select to authenticated
  using (public.is_allowed());
create policy titles_insert on public.titles for insert to authenticated
  with check (public.is_allowed());
create policy titles_update on public.titles for update to authenticated
  using (public.is_allowed()) with check (public.is_allowed());

create table public.user_titles (
  user_id uuid not null references auth.users on delete cascade,
  title_id bigint not null references public.titles(id),
  status text not null default 'to_watch'
    check (status in ('to_watch','watching','watched')),
  rating numeric(3,1) check (rating between 0 and 10),
  is_favorite boolean not null default false,
  watched_at date,
  primary key (user_id, title_id)
);
alter table public.user_titles enable row level security;
create policy user_titles_own on public.user_titles for all to authenticated
  using (user_id = auth.uid() and public.is_allowed())
  with check (user_id = auth.uid() and public.is_allowed());
