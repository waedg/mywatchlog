# MyWatchlog : backlog, décisions à prendre et bugs

Types : `DEC` décision à prendre, `TODO` tâche, `BUG` anomalie, `VERIF` point à vérifier.
Priorités : P1 bloquant la phase en cours, P2 avant la fin de la phase cible, P3 plus tard.
Statuts : `Ouvert`, `En cours`, `Résolu`, `Abandonné`.

## Décisions à prendre

| ID | Type | Sujet | Phase cible | Prio | Statut |
|---|---|---|---|---|---|
| B-001 | DEC | Restreindre la connexion à l'adresse Google du propriétaire (liste d'autorisation ou inscriptions désactivées) | 1 | P1 | Résolu (D-17) |
| B-002 | DEC | Ajouter un statut « abandonné » (`dropped`) en plus de à voir / en cours / vu | 2 | P2 | Ouvert |
| B-003 | DEC | Gestion des épisodes spéciaux (saison 0) et des saisons annoncées sans date | 3 | P2 | Ouvert |
| B-004 | DEC | Fuseau horaire d'affichage des sorties (Europe/Paris) et gestion des dates TMDB | 5 | P3 | Ouvert |
| B-005 | DEC | Stratégie de tests (unitaires, e2e) et niveau de couverture attendu | 1 | P3 | Résolu (D-20) |
| B-006 | DEC | Bibliothèque de composants UI : Tailwind seul écarté (D-21), choisir une bibliothèque moderne | 1 | P1 | Résolu (D-22) |
| B-026 | DEC | Bloquer la création de compte non autorisé (hook « Before User Created » Supabase) | 2 | P3 | Ouvert |
| B-027 | VERIF | Conseil Supabase « is_allowed() exécutable par authenticated » : voulu (utilisé par les policies RLS, ne renvoie que l'état de l'appelant). Réévaluer un déplacement vers un schéma privé | 2 | P3 | Accepté |

## Points à vérifier

| ID | Type | Sujet | Phase cible | Prio | Statut |
|---|---|---|---|---|---|
| B-010 | VERIF | Limites de débit de l'API TMDB (page « Rate Limiting » non lue) | 1 | P2 | Ouvert |
| B-011 | VERIF | Mention d'attribution obligatoire pour les données « où regarder » (JustWatch) | 5 | P2 | Ouvert |
| B-012 | VERIF | Politique de mise en pause des projets Supabase gratuits (délai d'inactivité) | 0 | P2 | Ouvert |
| B-013 | VERIF | Disponibilité de l'identifiant IMDb via `external_ids` pour films et séries | 1 | P3 | Ouvert |
| B-014 | VERIF | Fiabilité des notifications push d'une PWA sur Android | 6 | P3 | Ouvert |

## Tâches

| ID | Type | Sujet | Phase cible | Prio | Statut |
|---|---|---|---|---|---|
| B-020 | TODO | Créer le dépôt GitHub public `mywatchlog` (action utilisateur) | 0 | P1 | Résolu |
| B-021 | TODO | Rattacher le dépôt à la session et commiter les fichiers de cadrage | 0 | P1 | Résolu |
| B-022 | TODO | Créer le projet Vercel relié au dépôt | 0 | P1 | Résolu |
| B-023 | TODO | Ajouter une page « À propos » avec mention et logo TMDB | 4 | P2 | Ouvert |
| B-024 | TODO | Renseigner l'URL du site (https://mywatchlog-delta.vercel.app) et l'URI de redirection dans Supabase Auth (URL Configuration) | 1 | P1 | Résolu (déclaré par l'utilisateur) |
| B-025 | TODO | Accorder au connecteur Vercel l'accès à l'espace de l'utilisateur (403 sur le scope wago1) | 1 | P3 | Résolu |

## Bugs

Aucun pour l'instant.

## Modèle d'entrée

```text
| B-0XX | BUG | Description courte, étapes de reproduction | Phase | P1/P2/P3 | Ouvert |
```
