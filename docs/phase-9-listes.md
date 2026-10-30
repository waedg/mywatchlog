# Phase 9 — Listes personnalisées (cadrage)

Statut : **cadrage uniquement, aucun développement** (2026-10-30). Décisions à valider : section 7.

## 1. Objectif

Créer des listes nommées pour grouper des films et des séries (par exemple « À voir en famille », « Classiques », « Soirées d'hiver »), les renommer et les supprimer. Une liste est privée, rattachée au compte, et synchronisée sur tous les appareils.

Hors périmètre : partage ou liste publique, ordre manuel par glisser-déposer, listes intelligentes (filtres automatiques), import / export, listes collaboratives.

## 2. Fonctionnalités

| Fonctionnalité | Règle proposée |
|---|---|
| Créer une liste | Nom obligatoire, 1 à 60 caractères après suppression des espaces autour |
| Renommer | Même validation ; renommage immédiat sur tous les appareils |
| Supprimer | Confirmation ; supprime la liste et ses appartenances, **jamais** les titres de « Ma liste » |
| Ajouter / retirer un titre | Un titre peut figurer dans plusieurs listes ; l'ajout est sans doublon dans une même liste |
| Afficher une liste | Grille d'affiches (comme Ma liste), filtre Tout / Films / Séries, tri par date d'ajout ou par titre |
| Aperçu des listes | Cartes avec le nom, le nombre de titres et une mosaïque de 4 affiches |
| Hors connexion | Lecture seule, comme Ma liste ; écriture refusée avec le message dédié (D-44) |

## 3. Modèle de données (migration 006)

```sql
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index lists_user_name_unique on public.lists (user_id, lower(btrim(name)));

create table public.list_items (
  list_id uuid not null references public.lists(id) on delete cascade,
  title_id bigint not null,
  title_type text not null,
  added_at timestamptz not null default now(),
  primary key (list_id, title_id, title_type),
  foreign key (title_id, title_type) references public.titles(id, type)
);
```

Politiques RLS, sur le modèle de `user_titles` (D-04) :

```sql
create policy lists_own on public.lists for all to authenticated
  using (user_id = auth.uid() and public.is_allowed())
  with check (user_id = auth.uid() and public.is_allowed());

create policy list_items_own on public.list_items for all to authenticated
  using (public.is_allowed() and exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (public.is_allowed() and exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid()));
```

Points de vigilance : la clé composite `(id, type)` des titres (D-10) ; le trigger ou la requête qui met `updated_at` à jour au renommage ; l'index sur `list_items (title_id, title_type)` pour afficher les listes d'un titre ; les contrôles du conseiller de sécurité Supabase après la migration.

La migration est appliquée sur Supabase et versionnée dans `supabase/migrations/`, comme les cinq précédentes. Les types TypeScript sont régénérés.

## 4. Interface

| Écran | Contenu |
|---|---|
| Ma liste, onglets « Statuts / Listes » | Évite une sixième entrée dans la barre du bas, déjà pleine à 5 entrées. Route `/library/lists` |
| Aperçu des listes | Cartes, bouton « Nouvelle liste » (champ de saisie en ligne), compteur |
| Détail d'une liste | Titre de la liste avec renommer (crayon) et supprimer (confirmation), grille d'affiches, retrait d'un titre par une pastille, filtre de type, tri. Route `/library/lists/:id` |
| Fiche d'un titre | Section « Listes » : cases à cocher des listes, avec création d'une liste sur place |

## 5. Découpage proposé

| Bloc | Contenu | Testable par l'utilisateur |
|---|---|---|
| 9.1 | Migration 006, RLS, types, vérification du conseiller de sécurité | Non (base) |
| 9.2 | Couche données : requêtes et hooks (créer, renommer, supprimer, ajouter, retirer), validation du nom, persistance hors-ligne en lecture, tests | Non (tests) |
| 9.3 | Onglet « Listes » dans Ma liste : aperçu, création, renommage, suppression | Oui |
| 9.4 | Détail d'une liste : grille, retrait, filtre, tri | Oui |
| 9.5 | Fiche : section « Listes » pour ajouter ou retirer le titre | Oui |
| 9.6 (option) | Ajout depuis Ma liste ou Découvrir (menu sur les cartes) ; sélecteur « Ajouter des titres » dans une liste | Oui |

Chaque bloc est livré séparément, avec ton test entre deux.

## 6. Risques

| Risque | Réponse |
|---|---|
| Règles d'accès mal écrites : lecture ou modification des listes d'un autre compte | RLS stricte, test avec un second compte ou une requête simulée, conseiller de sécurité |
| Suppression d'une liste qui emporte des titres de « Ma liste » | Aucun lien entre `list_items` et `user_titles` : la suppression d'une liste ne touche que `list_items` |
| Titre ajouté à une liste mais absent de la table `titles` | L'ajout enregistre d'abord le titre dans `titles`, comme `addToLibrary` |
| Nom en double ou espaces parasites | Index unique insensible à la casse, avec message d'erreur clair |
| Liste très grande | Limites proposées : 50 listes et 500 titres par liste, contrôlées dans l'application |
| Barre du bas déjà pleine sur mobile | Onglets dans Ma liste plutôt qu'une nouvelle entrée |

## 7. Questions ouvertes

1. **Contenu des listes :** un titre d'une liste doit-il être dans « Ma liste » ? Option A : oui, retirer un titre de Ma liste le retire des listes. Option B (recommandée) : non, une liste peut contenir n'importe quel titre TMDB, indépendamment de Ma liste.
2. **Un titre dans plusieurs listes :** oui (recommandé) ou une seule liste par titre ?
3. **Noms en double :** interdits, insensible à la casse (recommandé), ou autorisés ?
4. **Navigation :** onglets « Statuts / Listes » dans Ma liste (recommandé), ou une entrée dans la barre de navigation ?
5. **Ajout de titres :** fiche seule (9.5), ou aussi depuis les cartes et un sélecteur dans la liste (9.6) ?
6. **Ordre dans une liste :** tri par date d'ajout ou par titre au choix (recommandé), ou ordre manuel ?
7. **Limites :** 50 listes et 500 titres par liste vous conviennent-ils ?
