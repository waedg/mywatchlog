# Phase 8 — Découverte : recommandations et recherche (cadrage)

Statut : **terminée le 2026-10-30** (8.1 à 8.5 livrées et validées par les tests de l'utilisateur) (2026-10-28).

## 1. Périmètre

Inclus : recherche enrichie (tendances, populaires, exploration par critères), recommandations personnalisées à partir de la liste, tirage « Que regarder ce soir ».

**Exclu à la demande de l'utilisateur : toute modification de la fiche** (section « Dans la même veine », saga, bande-annonce, filtre plateformes sur les suggestions). Ces idées sont reportées au backlog (B-055).

## 2. Blocs proposés

| Bloc | Contenu | Appels TMDB | Hors-ligne |
|---|---|---|---|
| 8.1 | API : actions `trending`, `discover`, `genres` dans `api/tmdb.ts`, types partagés, tests, en-têtes de cache (`s-maxage`) | `/trending/{type}/week`, `/movie|tv/popular`, `/discover/{type}`, `/genre/{type}/list` | Non |
| 8.2 | Page Découvrir : « Tendances de la semaine » et « Populaires », onglets Tout / Films / Séries, repère « déjà dans ma liste », ajout rapide | via 8.1 | Non |
| 8.3 | Explorer : genre, année, note minimale, plateforme (région existante), tri ; filtres dans l'URL (D-34) | `/discover/{type}` | Non |
| 8.4 | « Pour toi » : agrégation des recommandations de tes titres sources, classées par fréquence | `/{type}/{id}/recommendations` (une fois par titre source) | Non |
| 8.5 | « Que regarder ce soir ? » : tirage aléatoire dans « À regarder » (filtres : type, « J'ai une copie ») | Aucun | Oui |

## 3. Règles de « Pour toi » (8.4), à valider

- Sources : titres notés 8 ou plus, plus les favoris, hors « Abandonné ». Limité aux 15 plus récents ou mieux notés.
- Exclus des résultats : tout titre déjà dans la liste (tous statuts).
- Classement : nombre de sources qui recommandent le titre, puis note TMDB.
- Exécution : une action serveur `forYou` reçoit la liste des sources (15 maximum) et renvoie les résultats classés, ce qui limite les allers-retours ; cache côté client 24 h.
- Adulte exclu (`include_adult=false`), langue `fr-FR`.

## 4. Contraintes

- Les ids film / série sont dans deux espaces distincts : toujours la clé composite (D-10).
- Le proxy reste protégé par le JWT et `is_allowed()`.
- Aucune migration SQL prévue. Si l'on veut filtrer « Que regarder ce soir » par durée ou genre, il faudra stocker `runtime` et `genres` dans `titles` (migration 006) : non retenu par défaut.

## 5. Décisions validées (2026-10-28)

1. Nouvelle entrée de navigation **« Découvrir »** ; la page Recherche reste inchangée (champ + résultats).
2. « Que regarder ce soir ? » est une **section de Découvrir**.
3. Sources de « Pour toi » : titres notés 8 ou plus et favoris, hors « Abandonné » ; les titres « Vu » sans note ne comptent pas.
4. Pas de filtre durée / genre sur le tirage : **pas de migration 006**.

Conséquences : 8.2 devient la page Découvrir (sections Tendances et Populaires) ; la page Recherche n'est pas modifiée.

## 6. Réalisation

| Bloc | Livré | Remarques |
|---|---|---|
| 8.1 | API `trending`, `popular`, `genres`, `discover`, `forYou`, puis `watchProviders` (8.5) | Cache navigateur privé uniquement (D-42) |
| 8.2 | Page Découvrir | Nav : entrée « Découvrir » |
| 8.3 | « Que regarder ce soir ? » | Fonctionne hors connexion |
| 8.4 | « Pour toi » | 3 sources minimum, cache 24 h |
| 8.5 | Explorer (`/discover/explore`) | D-46 |

Corrections liées, hors périmètre initial : alignement des boutons des cartes, pastille « Vu » cliquable (D-43), écritures refusées hors connexion (D-44), séries à numérotation continue (D-45).
