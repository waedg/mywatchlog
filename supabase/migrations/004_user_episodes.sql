-- 004 : suivi épisode par épisode (phase 3).
-- titles : nombre d'épisodes par saison (jsonb) et série terminée, pour les compteurs
-- des cartes sans appeler TMDB. user_episodes : uniquement les épisodes vus.

alter table public.titles
  add column season_counts jsonb,
  add column is_ended boolean;

create table public.user_episodes (
  user_id uuid not null references auth.users (id) on delete cascade,
  title_id bigint not null,
  title_type text not null default 'tv' check (title_type = 'tv'),
  season_number integer not null check (season_number >= 0),
  episode_number integer not null check (episode_number >= 1),
  watched_at timestamptz not null default now(),
  primary key (user_id, title_id, season_number, episode_number),
  foreign key (title_id, title_type) references public.titles (id, type)
);

alter table public.user_episodes enable row level security;

create policy user_episodes_own on public.user_episodes
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.is_allowed()))
  with check (user_id = (select auth.uid()) and (select public.is_allowed()));
