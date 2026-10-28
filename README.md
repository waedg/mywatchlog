# MyWatchlog

Application personnelle de suivi de films et séries (remplaçant de TV Time) : React + Vite + TypeScript, Supabase, Vercel, données TMDB.

Cadrage, décisions et backlog : voir [PROJECT_STATUS.md](PROJECT_STATUS.md), [DECISIONS.md](DECISIONS.md) et [BACKLOG.md](BACKLOG.md).

## Démarrage local

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

## Tester l'API en local (`/api/tmdb`)

`npm run dev` ne sert pas les fonctions de `api/`. Pour les tester en local, utiliser la CLI Vercel :

```bash
npm install -g vercel
vercel link            # relier le dossier au projet Vercel
vercel env pull .env.local
vercel dev
```

`TMDB_READ_TOKEN` est un secret serveur : il ne doit jamais être préfixé par `VITE_`.

## Application installable (PWA) et hors-ligne

- Le service worker n'existe que dans le build de production : `npm run build && npm run preview`.
- L'interface est précachée ; les affiches TMDB sont mises en cache (200 images, 30 jours).
- `/api/*` et Supabase ne sont jamais mis en cache.
- La liste et les épisodes vus sont enregistrés sur l'appareil (7 jours) pour une lecture hors connexion ; ils sont supprimés à la déconnexion.
- Une nouvelle version affiche « Nouvelle version disponible » ; l'utilisateur choisit de recharger.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript + build de production |
| `npm run lint` | Analyse statique (oxlint) |
| `npm run preview` | Prévisualisation du build (PWA active) |
| `npm test` | Tests Vitest |
| `npm run typecheck:api` | TypeScript de `api/`, `shared/` et `tests/` |

## Crédits

This product uses the TMDB API but is not endorsed or certified by TMDB.

Développé par Waed Goumani — goumani.waed@gmail.com
