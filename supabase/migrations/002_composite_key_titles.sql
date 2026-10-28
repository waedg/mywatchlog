-- 002 : clé composite (id, type) pour titles.
-- Les identifiants TMDB des films et des séries sont deux espaces distincts
-- (un film et une série peuvent partager le même id) : id seul ne suffit pas.

alter table public.user_titles drop constraint user_titles_title_id_fkey;
alter table public.user_titles drop constraint user_titles_pkey;
alter table public.titles drop constraint titles_pkey;

alter table public.titles add primary key (id, type);

alter table public.user_titles
  add column title_type text not null check (title_type in ('movie', 'tv'));

alter table public.user_titles add primary key (user_id, title_id, title_type);
alter table public.user_titles
  add foreign key (title_id, title_type) references public.titles (id, type);
