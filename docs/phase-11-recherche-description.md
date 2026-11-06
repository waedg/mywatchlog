# Phase 11 — Recherche par description (cadrage)

Statut : **en cours** (2026-11-06). Cadrage validé (D-53), modèle `gemini-3.1-flash-lite`. Bloc 11.1 (action serveur `describe`) livré ; blocs 11.2 (interface) et 11.3 (délai entre deux recherches) livrés sur `feat/phase-11-describe`, à tester en production après fusion dans `main` ; 11.4 (clôture) à faire après ce test. Réalisation : section 8.

## 1. Objectif

Sur la page Recherche existante, permettre de retrouver un film ou une série à partir d'une description du contexte (« un homme retrouve sa mémoire grâce à des tatouages »), quand le titre est oublié.

Hors périmètre : modification de la fiche, recherche par description dans « Ma liste » (découverte uniquement), plusieurs résultats au-delà de 5, nouvelle migration SQL.

## 2. Décisions de cadrage (2026-11-06)

| N° | Question | Réponse |
|---|---|---|
| 1 | Fournisseur principal | Gemini (offre gratuite). **Modèle validé le 2026-11-06 : Gemini 3.1 Flash-Lite** (temps de réponse mesuré par l'utilisateur : 2,5 s) |
| 2 | Confidentialité (données de l'offre gratuite pouvant servir à améliorer les produits Google) | Acceptée |
| 3 | Repli payant en cas de quota épuisé | Non : message d'erreur seul |
| 4 | Essai 11.0 | Réalisé par l'utilisateur dans Google AI Studio, guidé |
| 5 | Emplacement | Page Recherche existante, bascule « Titre / Description » |
| 6 | Langue des descriptions | Français ou anglais |
| 7 | Nombre de résultats | 5 maximum |
| 8 | Périmètre | Découverte uniquement (pas de recherche dans Ma liste) |
| 9 | Fiche | Aucune modification (hypothèse par défaut, à confirmer) |

Conséquences :

- D-01 (coût 0 €) reste respecté tant que le quota gratuit suffit ; aucun amendement.
- La page Recherche, déclarée « inchangée » en phase 8, est modifiée volontairement par cette phase : la nouvelle décision remplace cette règle pour la page Recherche uniquement.

## 3. Architecture

```text
Client                     Vercel (api/tmdb.ts)                 Gemini API        TMDB
  | describe(texte) ----->  JWT + is_allowed()
  |                         validation d'entrée (<= 500 car.)
  |                         ------------------------------->  candidats JSON
  |                         pour chaque candidat ---------------------------------> /search/{type}
  |                         dédoublonnage, include_adult=false
  | <---- 5 résultats TMDB max (ids issus de TMDB)
```

Règles :

1. Le modèle ne renvoie **jamais** d'identifiant TMDB : uniquement `title`, `year`, `type`. Les `id` viennent exclusivement de TMDB.
2. Un candidat sans correspondance TMDB (titre + année) est écarté.
3. Sortie du modèle en JSON structuré, validée côté serveur.
4. Clé `GEMINI_API_KEY` uniquement dans les variables Vercel (serveur), jamais dans le dépôt ni dans le navigateur.
5. Proxy protégé par JWT et `is_allowed()`, comme les autres actions.
6. Clés composites `(id, type)` conservées (D-10) ; `Cache-Control: no-store` côté serveur (D-42).
7. Quota épuisé (Gemini 429) ou crédits épuisés (Gemini 402) : réponse `429 ai_quota`, message « Quota IA atteint, réessaie plus tard ». Aucun repli vers un autre fournisseur.
8. Hors connexion : fonction désactivée avec le message dédié (D-44).
9. Limitation de débit : pas de table (aucune migration). Délai minimum côté client entre deux requêtes et entrée plafonnée à 500 caractères ; le quota Gemini fait office de plafond global.

Interface fournisseur envisagée (spécification, non implémentée) :

```ts
interface Candidate { title: string; year?: number; type: 'movie' | 'tv' }
interface DescribeProvider {
  suggest(description: string, signal: AbortSignal): Promise<Candidate[]>
}
```

## 4. Essai 11.0 (avant tout développement)

Réalisé par l'utilisateur dans Google AI Studio (gratuit). Durée estimée : 30 à 45 minutes.

1. Créer une clé et relever, pour le modèle testé, le quota affiché (requêtes par minute / par jour).
2. Préparer 15 descriptions réelles (mélange de films et séries, français et anglais, courtes et longues).
3. Pour chacune, soumettre la consigne ci-dessous, d'abord **sans** recherche Google, puis **avec** « Grounding with Google Search » si l'option est proposée.
4. Remplir la grille de notation.

Consigne :

```text
Tu aides à retrouver un film ou une série dont l'utilisateur a oublié le titre.
À partir de la description ci-dessous, renvoie au maximum 5 candidats classés du plus probable au moins probable.
Réponds uniquement en JSON, sans texte autour : [{"title": "...", "year": 2000, "type": "movie"}]
"type" vaut "movie" ou "tv". Utilise le titre original. N'invente aucun titre : si tu n'es pas sûr, renvoie moins de candidats.

Description : <description>
```

Grille (une ligne par description) :

| # | Description | Modèle | Grounding (oui/non) | Rang du bon titre (1-5, ou 0 = absent) | Titre inventé (oui/non) | Temps de réponse (s) |
|---|---|---|---|---|---|---|

Critères de décision :

| Résultat | Décision |
|---|---|
| Bon titre dans les 5 pour au moins 80 % des descriptions, quota suffisant | Gemini gratuit, bloc 11.1 |
| Qualité correcte seulement avec grounding, et grounding gratuit disponible | Gemini avec grounding |
| Qualité insuffisante ou quota trop bas | Réouvrir le choix du fournisseur (nouvelle décision) |

## 5. Découpage prévisible (après 11.0)

| Bloc | Contenu | Testable par l'utilisateur |
|---|---|---|
| 11.1 | Action serveur `describe` : validation d'entrée, appel Gemini, résolution TMDB, gestion du 429, tests Vitest (fournisseur simulé) | Non (tests) |
| 11.2 | Page Recherche : bascule « Titre / Description », champ, résultats avec ajout rapide et pastille de statut | Oui |
| 11.3 | États : chargement, vide, erreur, quota, hors-ligne ; délai minimal entre requêtes | Oui |
| 11.4 | Tests, `tsc`, `oxlint`, build, clôture des fichiers de suivi | Phase terminée |

Un bloc à la fois, validation de l'utilisateur entre chaque bloc.

## 6. Risques

| Risque | Réponse |
|---|---|
| Titre inventé par le modèle | Résolution TMDB obligatoire, candidat écarté sinon |
| Film récent inconnu du modèle | Résultat vide ou partiel, message clair ; recherche par titre toujours disponible |
| Quota gratuit modifié ou supprimé par Google | Détecté par l'erreur 429 ; réouverture de la décision 1 |
| Clé exposée | Variable Vercel serveur uniquement, jamais dans le dépôt public |
| Abus de la clé par un tiers | JWT + `is_allowed()` sur l'action |
| Données envoyées à Google | Acceptées (décision 2) ; ne jamais y joindre d'information personnelle autre que la description |

## 7. Points à confirmer

1. Hypothèse 9 : aucune modification de la fiche.
2. Limitation de débit sans table (délai client + quota Gemini) acceptable pour un usage à un seul utilisateur.
3. ~~Identifiant exact du modèle~~ : relevé le 2026-11-06, `GEMINI_MODEL=gemini-3.1-flash-lite` (version stable ; ni l'alias `gemini-flash-lite-latest`, ni la variante `-preview`).
4. Restent à relever avant la mise en production : quota du modèle (requêtes par minute / par jour) dans AI Studio, et taux de bons titres sur des descriptions réelles (un essai de 5 à 15 descriptions). Le grounding (recherche Google) n'est pas gratuit : exclu.
5. ~~Numéro de décision~~ : D-53.

## 8. Réalisation

### Bloc 11.1 — action serveur `describe` (2026-11-06)

Contrat final : `GET /api/tmdb?action=describe&q=<description>` (jeton Supabase obligatoire).

| Code | Corps | Cas |
|---|---|---|
| 200 | `{ "results": SearchResult[] }` | 0 à 5 résultats, ids issus de TMDB |
| 400 | `bad_request` | `q` absent ou hors de 3 à 500 caractères (aucun appel externe) |
| 401 / 403 | `unauthorized` / `forbidden` | inchangé (JWT + `is_allowed()`) |
| 429 | `ai_quota` | Gemini 429 (quota) ou 402 (crédits épuisés) |
| 429 | `rate_limited` | TMDB 429 sur tous les candidats (inchangé) |
| 500 | `server_misconfigured` | `GEMINI_API_KEY` ou `GEMINI_MODEL` absent |
| 502 | `ai_unavailable` | erreur Gemini, délai de 8 s dépassé, panne réseau |
| 502 | `tmdb_error` | toutes les recherches TMDB ont échoué |

Points techniques :

- API Gemini : Interactions (`POST /v1beta/interactions`), clé dans l'en-tête `x-goog-api-key` (jamais dans l'URL), `generation_config.thinking_level = "minimal"`, sortie JSON contrainte (`response_format`). Le texte est lu dans `steps[]` (type `model_output`) puis `content[].text` ; forme relevée par un appel réel le 2026-11-06 et fixée par un test.
- **Écart avec le plan initial** : la logique pure reste dans `api/tmdb.ts` (fonctions exportées), pas dans `shared/`, car D-30 limite `shared/` aux types importés avec `import type`. Aucun fichier ajouté dans `api/` (chaque fichier y est une fonction Vercel).
- Rapprochement avec TMDB : `/search/{movie|tv}` en `fr-FR`, `include_adult=false` ; avec année, écart de ±1 an toléré ; sans année, titre identique exigé. Un candidat sans correspondance est écarté.
- Variables Vercel à saisir (serveur uniquement) : `GEMINI_API_KEY` et `GEMINI_MODEL=gemini-3.1-flash-lite`.
- Tests : `tests/describe.test.ts` (logique pure, forme de la réponse Gemini) et `tests/describe-handler.test.ts` (handler, Gemini et TMDB simulés).

### Constat sur la facturation Gemini

Le premier projet AI Studio de l'utilisateur était en facturation prépayée : l'appel renvoyait 402 (« crédits épuisés »), donc pas de niveau gratuit. Une clé créée dans un **nouveau projet sans moyen de paiement** a donné un 200. À conserver : un projet auquel on relie une facturation peut sortir du niveau gratuit ; ne jamais utiliser pour cette fonction une clé d'un projet facturé.

### Bloc 11.2 — interface (2026-11-06)

Sur la page Recherche, un sélecteur **Titre / Description** (paramètre d'URL `mode=description`, le mode Titre reste le défaut et n'est pas modifié).

| Choix | Détail |
|---|---|
| Déclenchement | Bouton « Rechercher » ou Entrée (Maj+Entrée : retour à la ligne). **Pas de recherche à la frappe** : environ 2,5 s et du quota à chaque appel |
| URL (D-34) | `d` = description soumise (nettoyée), `type` = filtre. Le retour arrière restitue la recherche sans rappeler l'IA tant que le résultat est en cache |
| Cache | 30 minutes en mémoire (`staleTime`), `retry: false` (le réessai automatique de l'application doublerait la consommation du quota). Clé `describe` non persistée sur l'appareil |
| Saisie | 3 à 500 caractères (constantes client identiques à celles du serveur, vérifiées par un test) |
| États | Invite initiale, hors connexion, chargement (5 squelettes), erreur avec « Réessayer » (masqué si quota atteint), aucun résultat avec conseils |
| Messages | `ai_quota` : « Quota IA atteint, réessaie plus tard. » ; `ai_unavailable` : message dédié ; testés avant le statut HTTP |
| Mention | « Suggestions générées par une IA : elles peuvent se tromper. » |

Fichiers : `src/components/ui/textarea.tsx`, `src/features/search/{describe.ts, useDescribe.ts, DescribeSearch.tsx}`, `src/lib/{api.ts, api-error.ts}`, `src/pages/SearchPage.tsx` (l'ancien corps devient `TitleSearch`, comportement identique), `tests/describe-client.test.ts`.

Limites connues du bloc : la grille et les filtres de `DescribeSearch` dupliquent ceux de la recherche par titre (environ 40 lignes, choix assumé pour ne pas toucher au mode Titre) ; l'interface n'a pas été vue en navigateur par l'auteur du code, seulement compilée et testée sur sa logique ; le délai de 3 s entre deux soumissions est traité au bloc 11.3.

### Bloc 11.3 — délai entre deux recherches (2026-11-06)

- Règle : après chaque réponse de l'IA (réussie ou en erreur), le bouton « Rechercher », la touche Entrée et « Réessayer » sont désactivés pendant **3 secondes** (`DESCRIBE_COOLDOWN_MS`), avec le message « Patiente un instant avant une nouvelle recherche. ». Le bouton est aussi désactivé pendant le chargement.
- Le délai part de l'horodatage de la dernière réponse (`dataUpdatedAt` / `errorUpdatedAt`) : une recherche restituée depuis le cache au retour arrière ne déclenche aucun délai.
- Logique pure `isCoolingDown` testée (délai actif, levé à 3 s exactes, cache ancien, durée personnalisée).
- Les autres états (hors connexion, quota, aucun résultat, indisponible) étaient déjà livrés au bloc 11.2 et n'ont pas changé.
- Reste à faire en 11.4, après ton test en production : mesurer le quota gratuit réel dans AI Studio, essayer 5 à 15 descriptions réelles, clôturer les fichiers de suivi.

### Mise en production et incident de clé (2026-11-06)

- Fusion dans `main` par fast-forward, sans pull request : l'intégration GitHub de la session n'a pas la permission « Pull requests » (création refusée en 403 « Resource not accessible by integration », 4 essais). Pour les prochaines phases, soit activer cette permission, soit assumer le push direct après accord explicite.
- Premier test en production : message « momentanément indisponible » alors que des requêtes apparaissaient dans AI Studio (elles venaient du script d'essai). Cause : `GEMINI_API_KEY` mal enregistrée dans Vercel. Gemini répondait HTTP 400 en environ 30 ms ; la clé a été collée de nouveau dans Vercel, la recherche fonctionne.
- Diagnostic rendu possible par deux ajouts dans `api/tmdb.ts` : une ligne `[describe] échec Gemini : <motif> après <durée> ms — <message Google>` dans les journaux Vercel (jamais la clé ni la description), et un champ `reason` non sensible dans la réponse 502 / 429 (`timeout`, `http_<code>`, `network`, `bad_response`).
- Les variables d'environnement ne s'appliquent qu'aux nouveaux déploiements : après toute modification de `GEMINI_API_KEY` ou `GEMINI_MODEL`, redéployer.
- La branche `feat/phase-11-describe` est fusionnée ; sa suppression sur GitHub reste à faire à la main (suppression de branche refusée depuis la session).
