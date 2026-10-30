# Phase 10 — Suggestions par collection (cadrage)

Statut : **cadrée le 2026-10-30, en attente du feu vert pour 10.1**. Décisions : section 6 (D-51).

## 1. Objectif

Dans le détail d'une collection, proposer des titres à ajouter, calculés à partir des titres de cette collection. Une collection est une sélection thématique choisie par l'utilisateur : les recoupements entre titres sont plus forts que dans le « Pour toi » global (D-41), qui mélange tous les goûts.

Hors périmètre : sélecteur de source sur Découvrir, suggestions pour plusieurs collections à la fois, apprentissage sur l'historique, nouvelle source de données (TMDB `/similar`, mots-clés).

## 2. Principe

Réutilisation de l'action serveur `forYou` (aucune modification de l'API, aucune migration SQL) :

1. Sources = titres de la collection (films et séries), plafonnées à 15.
2. Pour chaque source, TMDB `/{type}/{id}/recommendations` (page 1) ; type de la source conservé.
3. Agrégation : score = nombre de sources qui recommandent le titre ; sources exclues des résultats.
4. Côté client : retrait des titres déjà dans la collection, filtre Tout / Films / Séries, 20 affiches.

## 3. Règles

| Sujet | Règle |
|---|---|
| Seuil | Moins de 3 titres : pas de requête, message « Ajoute au moins 3 titres pour obtenir des suggestions » |
| Plafond | 15 sources. Au-delà : mieux notés, puis favoris, puis ordre alphabétique (déterministe, même clé de cache que D-41) |
| Notes | La note et le favori viennent de Ma liste ; un titre de la collection absent de Ma liste n'a ni note ni favori (classé par ordre alphabétique) |
| Exclusions | Uniquement les titres de la collection. Un titre déjà dans Ma liste mais pas dans la collection reste proposé, avec sa pastille de statut |
| Ajout depuis une suggestion | Deux actions : « Ajouter à la collection » (ajoute aussi à Ma liste en « À regarder » si le titre n'y est pas) et « Ajouter à Ma liste » seule |
| Cache | Clé stable indépendante de l'ordre des sources ; invalidée quand la composition de la collection change ; `no-store` côté serveur (D-42) |
| Hors connexion | Section masquée avec un message ; actions refusées (D-44) |
| Limites connues | Recommandations TMDB plutôt grand public ; collection hétérogène = résultats bruités ; collection de 3 titres = scores majoritairement égaux à 1 |

## 4. Découpage

| Bloc | Contenu | Livrable |
|---|---|---|
| 10.1 | Fonctions pures `src/features/lists/suggestions.ts` : choix des sources, exclusion, clé de cache ; tests Vitest | Tests verts, aucun changement visible |
| 10.2 | Hook `useCollectionSuggestions` et section « Suggestions » dans `ListDetailPage` (états : seuil, chargement, erreur, vide, hors connexion) | Section visible dans une collection |
| 10.3 | Actions « Ajouter à la collection » et « Ajouter à Ma liste » sur chaque suggestion ; la suggestion ajoutée disparaît | Ajout testé de bout en bout |
| 10.4 | Tests, `tsc`, `oxlint`, build, clôture des fichiers de suivi | Phase terminée |

Un bloc à la fois, validation de l'utilisateur entre chaque bloc.

## 5. Points techniques

- `list_items` a une clé étrangère vers `titles(id, type)` : le titre doit être en cache (`cacheTitle`) avant l'ajout à la collection.
- Réutilisation de `getForYou`, `useAddToList`, `addToLibrary`, `PosterCard`, `QuickWatchedButton`/pastille de statut.
- Les tests dans `tests/` ne doivent pas importer de module utilisant l'alias `@/` (vérifiés par `tsconfig.api.json`) : la logique pure vit dans des fichiers sans dépendance au DOM.

## 6. Décisions de cadrage (2026-10-30)

| N° | Question | Réponse |
|---|---|---|
| 1 | Emplacement | Détail d'une collection uniquement |
| 2 | Exclusions | Seuls les titres de la collection |
| 3 | Plus de 15 titres | Échantillon fixe (notes, favoris, alphabétique) |
| 4 | Action sur une suggestion | Les deux : « Ajouter à la collection » et « Ajouter à Ma liste » |
| 5 | Seuil | 3 titres minimum, avec message explicatif |
