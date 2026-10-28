-- 003 : ajout du statut « abandonné » (dropped) — B-002.

alter table public.user_titles drop constraint user_titles_status_check;
alter table public.user_titles
  add constraint user_titles_status_check
  check (status in ('to_watch', 'watching', 'watched', 'dropped'));
