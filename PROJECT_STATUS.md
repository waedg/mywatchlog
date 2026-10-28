# MyWatchlog : suivi du projet

Dernière mise à jour : 2026-10-28

## Objectif

Application personnelle de suivi de films et séries (remplaçant de TV Time) : gratuite, multi-appareils, Android (PWA) et navigateur.

## Stack validé

| Couche | Choix |
|---|---|
| Front | React + Vite + TypeScript, Tailwind CSS, TanStack Query, React Router |
| PWA | vite-plugin-pwa |
| Base + auth | Supabase (Postgres, RLS, Google OAuth) |
| API serveur + cron | Fonctions serverless Vercel (offre Hobby) |
| Données | TMDB API (FR avec repli EN) |
| Code | GitHub, dépôt public `mywatchlog` |

Cadrage complet : document « MyWatchlog : Cadrage du projet » (artifact Claude) et `DECISIONS.md`.

## Règles de travail

- Validation de l'utilisateur avant chaque phase, aucun code sans accord.
- Aucun secret dans le dépôt (public) : `.env.local` ignoré, secrets saisis dans Vercel.
- Chaque décision est consignée dans `DECISIONS.md`, chaque anomalie ou point ouvert dans `BACKLOG.md`.

## Avancement par phase

| Phase | Contenu | Statut |
|---|---|---|
| 0 | Comptes, dépôt, squelette Vite + React + TS, déploiement Vercel | En cours (squelette poussé, projet Vercel à créer) |
| 1 | Connexion Google, recherche TMDB, ajout à la liste | À faire |
| 2 | Statuts, notes, favoris, films et séries séparés | À faire |
| 3 | Suivi épisode par épisode, prochain à voir | À faire |
| 4 | PWA Android, hors-ligne, mention TMDB | À faire |
| 5 | Sorties, calendrier, fiches acteurs, personnes suivies, où regarder | À faire |
| 6 | Notifications push, statistiques | À faire |

## Checklist phase 0

Côté utilisateur :

- [x] Dépôt GitHub public `mywatchlog`
- [x] Compte TMDB + clé API + Read Access Token (non vérifiés par Claude)
- [x] Projet Supabase (région UE, eu-west-1), vérifié actif
- [x] Identifiants OAuth Google créés (déclaré par l'utilisateur, fournisseur à vérifier en phase 1)
- [x] Compte Vercel lié à GitHub (connecteur vérifié)

Côté Claude :

- [x] Rattacher le dépôt et commiter les fichiers de cadrage
- [x] Initialiser le squelette Vite + React + TypeScript (build et lint OK)
- [ ] Créer le projet Vercel relié au dépôt
- [ ] Configurer les variables d'environnement Vercel (`VITE_*` par Claude, `TMDB_READ_TOKEN` par l'utilisateur)

## Variables d'environnement prévues

```text
# Navigateur (publiques)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Serveur uniquement (jamais dans le dépôt)
TMDB_READ_TOKEN=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

## Journal des sessions

| Date | Résumé |
|---|---|
| 2026-10-28 | Cadrage, choix du stack, 14 décisions validées, création des fichiers de suivi |
