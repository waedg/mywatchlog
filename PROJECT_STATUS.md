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
| 0 | Comptes, dépôt, squelette Vite + React + TS, déploiement Vercel | Terminée, en attente de validation (https://mywatchlog-delta.vercel.app/) |
| 1 | Connexion Google, recherche TMDB, ajout à la liste | Terminée (validée le 2026-10-28) |
| 2 | Statuts, notes, favoris, films et séries séparés | Terminée (validée le 2026-10-28) |
| 3 | Suivi épisode par épisode, prochain à voir | Terminée (testée le 2026-10-28), ajustements d'interface livrés (D-34) |
| 4 | PWA Android, hors-ligne, mention TMDB | Terminée (testée le 2026-10-28), logo TMDB en place |
| 5 | Sorties, calendrier, fiches acteurs, personnes suivies, où regarder | Terminée (testée le 2026-10-28) |
| 6 | Notifications push, statistiques | En attente (décision du 2026-10-28) : découpage proposé (statistiques, notifications push, réglages), à relancer après la période d'utilisation |
| 7 | Lecture de fichiers vidéo depuis le NAS (FileBrowser Quantum, Tailscale) | En attente (décision du 2026-10-28) : cadrée, sans développement, voir [docs/phase-7-nas.md](docs/phase-7-nas.md) ; essai de compatibilité 7.0 à faire par l'utilisateur |
| 8 | Découverte : recommandations et recherche enrichie (hors fiche) | En cours : 8.1 (API), 8.2 (page Découvrir) validées ; 8.3 (« Que regarder ce soir ? ») livrée ; 8.4 et 8.5 à venir. Voir [docs/phase-8-decouverte.md](docs/phase-8-decouverte.md) |

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
- [x] Créer le projet Vercel relié au dépôt (fait par l'utilisateur : le connecteur Vercel n'a pas accès à son espace)
- [x] Variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` saisies dans Vercel (déclaré par l'utilisateur)
- [ ] `TMDB_READ_TOKEN` à saisir par l'utilisateur dans Vercel (phase 1)

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
| 2026-10-28 | Cadrage, choix du stack, 14 décisions validées, fichiers de suivi, squelette Vite poussé, premier déploiement Vercel en ligne |
