# MyWatchlog : backlog, décisions à prendre et bugs

Types : `DEC` décision à prendre, `TODO` tâche, `BUG` anomalie, `VERIF` point à vérifier.
Priorités : P1 bloquant la phase en cours, P2 avant la fin de la phase cible, P3 plus tard.
Statuts : `Ouvert`, `En cours`, `Résolu`, `Abandonné`.

## Décisions à prendre

| ID | Type | Sujet | Phase cible | Prio | Statut |
|---|---|---|---|---|---|
| B-001 | DEC | Restreindre la connexion à l'adresse Google du propriétaire (liste d'autorisation ou inscriptions désactivées) | 1 | P1 | Ouvert |
| B-002 | DEC | Ajouter un statut « abandonné » (`dropped`) en plus de à voir / en cours / vu | 2 | P2 | Ouvert |
| B-003 | DEC | Gestion des épisodes spéciaux (saison 0) et des saisons annoncées sans date | 3 | P2 | Ouvert |
| B-004 | DEC | Fuseau horaire d'affichage des sorties (Europe/Paris) et gestion des dates TMDB | 5 | P3 | Ouvert |
| B-005 | DEC | Stratégie de tests (unitaires, e2e) et niveau de couverture attendu | 1 | P3 | Ouvert |
| B-006 | DEC | Bibliothèque de composants UI (Tailwind seul, ou ajout d'une bibliothèque) | 1 | P3 | Ouvert |

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
| B-020 | TODO | Créer le dépôt GitHub public `mywatchlog` (action utilisateur) | 0 | P1 | Ouvert |
| B-021 | TODO | Rattacher le dépôt à la session et commiter les fichiers de cadrage | 0 | P1 | Ouvert |
| B-022 | TODO | Créer le projet Vercel relié au dépôt | 0 | P1 | Ouvert |
| B-023 | TODO | Ajouter une page « À propos » avec mention et logo TMDB | 4 | P2 | Ouvert |

## Bugs

Aucun pour l'instant.

## Modèle d'entrée

```text
| B-0XX | BUG | Description courte, étapes de reproduction | Phase | P1/P2/P3 | Ouvert |
```
