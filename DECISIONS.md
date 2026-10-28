# MyWatchlog : journal des décisions

Une décision validée n'est modifiée que par une nouvelle entrée qui la remplace (champ « Remplace »).

| ID | Date | Décision | Justification | Remplace |
|---|---|---|---|---|
| D-01 | 2026-10-28 | Usage personnel, un seul utilisateur, coût 0 € | Besoin perso, offres gratuites suffisantes | |
| D-02 | 2026-10-28 | Source de données unique : TMDB, lien IMDb via `imdb_id` | IMDb n'a pas d'API publique gratuite ; TMDB couvre films, séries, épisodes, casting | |
| D-03 | 2026-10-28 | PWA + Supabase pour la synchronisation multi-appareils | Besoin de retrouver les données sur plusieurs appareils | |
| D-04 | 2026-10-28 | Suivi épisode par épisode | Équivalent de TV Time | |
| D-05 | 2026-10-28 | Départ de zéro, pas d'import TV Time | Aucun export disponible | |
| D-06 | 2026-10-28 | TypeScript | Choix de l'utilisateur | |
| D-07 | 2026-10-28 | Connexion Google (Supabase Auth) | Pas de mot de passe à gérer | |
| D-08 | 2026-10-28 | Hébergement Vercel (offre Hobby) | Gratuit, déploiement depuis GitHub, fonctions serverless et cron | |
| D-09 | 2026-10-28 | Français par défaut, repli anglais | Titres et synopsis en français quand disponibles | |
| D-10 | 2026-10-28 | Une tâche planifiée par jour pour les mises à jour de séries | Limite de l'offre Hobby (un cron par jour) | |
| D-11 | 2026-10-28 | « Où regarder » en phase 5 | Fonction avancée, hors cœur du suivi | |
| D-12 | 2026-10-28 | Nom MyWatchlog, dépôt GitHub public `mywatchlog` | Permet à Claude de commiter et de suivre les modifications | |
| D-13 | 2026-10-28 | Claude pilote Vercel directement (création du projet, variables d'environnement) | Accord de l'utilisateur | |
| D-14 | 2026-10-28 | Validation de l'utilisateur avant chaque phase, aucun code sans accord | Consigne du projet | |

## Modèle d'entrée

```text
| D-XX | AAAA-MM-JJ | Décision | Justification | D-YY ou vide |
```
