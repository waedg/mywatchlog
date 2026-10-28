-- 005 : indique si l'utilisateur possède une copie du titre (fichier vidéo local ou sur NAS).
-- Prépare la future lecture de fichiers depuis un NAS (B-049).

alter table public.user_titles add column has_copy boolean not null default false;
