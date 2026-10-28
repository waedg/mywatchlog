# MyWatchlog

Application personnelle de suivi de films et séries (remplaçant de TV Time) : React + Vite + TypeScript, Supabase, Vercel, données TMDB.

Cadrage, décisions et backlog : voir [PROJECT_STATUS.md](PROJECT_STATUS.md), [DECISIONS.md](DECISIONS.md) et [BACKLOG.md](BACKLOG.md).

## Démarrage local

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript + build de production |
| `npm run lint` | Analyse statique (oxlint) |
| `npm run preview` | Prévisualisation du build |

## Crédits

This product uses the TMDB API but is not endorsed or certified by TMDB.
