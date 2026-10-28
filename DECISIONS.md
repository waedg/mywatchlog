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
| D-15 | 2026-10-28 | Versions figées par `package-lock.json` au 2026-10-28 : Node 22.23.4, Vite 8.3.5, React 19.3.1, TypeScript 7.0.2, Tailwind 4.3.3, supabase-js 2.118.0, TanStack Query 5.105.0, React Router 7.18.5, vite-plugin-pwa 2.0.0 | Reproductibilité du squelette de la phase 0 | |
| D-16 | 2026-10-28 | Projet Supabase `mywatchlog` en région eu-west-1 (Irlande, UE), Postgres 17 | Région UE respectée | |
| D-17 | 2026-10-28 | Accès restreint par liste d'autorisation (table `allowed_emails`, adresse hors dépôt, RLS via `is_allowed()`) | Application publique, données personnelles | |
| D-18 | 2026-10-28 | Pas de hook « Before User Created » en phase 1 (suivi en B-026) | Protection des données déjà assurée par la RLS | |
| D-19 | 2026-10-28 | Interface en français uniquement (phase 1) | Simplicité, usage perso | |
| D-20 | 2026-10-28 | Tests : Vitest pour les fonctions pures, tests manuels sur le déploiement, pas d'e2e | Effort proportionné à un projet perso | |
| D-21 | 2026-10-28 | Interface moderne et attractive exigée : Tailwind seul écarté, bibliothèque de composants à choisir (B-006) | Exigence de l'utilisateur | |
| D-22 | 2026-10-28 | Interface : shadcn/ui (Radix + Tailwind), thème sombre uniquement | Rendu moderne et attractif demandé (D-21) | D-21 (précise) |
| D-23 | 2026-10-28 | Migration 001 appliquée via le connecteur Supabase ; fichier versionné dans `supabase/migrations/` ; adresse autorisée insérée hors dépôt | Traçabilité sans exposer l'adresse | |
| D-24 | 2026-10-28 | Fonction `/api/tmdb` en un seul fichier (`api/tmdb.ts`, signature Web `export default { fetch }`), authentifiée par RPC `is_allowed()` avec le jeton Supabase de l'appelant ; tests et tsconfig hors de `api/` (Vercel déploie chaque fichier de `api/`) ; token TMDB en production uniquement | Pas de secret serveur supplémentaire, surface minimale | |
| D-25 | 2026-10-28 | Limite TMDB : environ 40 requêtes par seconde (non contractuelle), réponse 429 relayée avec `Retry-After` | Vérification B-010 | |
| D-26 | 2026-10-28 | shadcn/ui installé à la main (la CLI ne peut pas joindre ui.shadcn.com depuis la session), fichiers au format shadcn (style new-york, `components.json`), package `radix-ui`, police Inter via `@fontsource-variable/inter` (pas de CDN), accent violet oklch(0.68 0.2 285), remplacé par le jaune en D-28, thème sombre sur `:root` | CLI inaccessible, compatibilité conservée pour de futurs `shadcn add` | D-22 (précise) |
| D-27 | 2026-10-28 | `vercel.json` : réécriture SPA vers `/index.html` pour tout chemin hors `/api/` | Routes React Router (`/login`, `/search`, `/library`) accessibles en accès direct | |
| D-28 | 2026-10-28 | Accent jaune « sous-titres » oklch(0.88 0.18 95) avec texte noir sur l'accent ; fonds neutres (teinte 100) à la place des fonds violets | Demande de l'utilisateur | D-26 (accent) |
| D-29 | 2026-10-28 | Authentification : OAuth Google via Supabase (`prompt=select_account`, retour sur `/library`), session persistante, contrôle `is_allowed()` après connexion ; statuts `loading`, `signed-out`, `allowed`, `denied`, `error` (fonction pure testée) ; routes protégées par `RequireAuth` | Application publique à accès restreint (D-17) | |
| D-30 | 2026-10-28 | Types partagés dans `shared/tmdb-types.ts` (import `import type` uniquement, effacé à la compilation) ; appels `/api/tmdb` avec le jeton de session ; recherche : saisie avec délai de 350 ms, minimum 2 caractères, filtres Tout / Films / Séries côté client | Pas de duplication de types, moins d'appels TMDB | |
| D-31 | 2026-10-28 | Migration 002 : clé composite (id, type) sur `titles`, `user_titles` (user_id, title_id, title_type) avec FK composite ; ajout : détails TMDB puis upsert `titles` puis insert `user_titles` (statut « à regarder », doublons ignorés) ; liste groupée En cours / À regarder / Vu | Les ids TMDB films et séries sont deux espaces distincts | |
| D-32 | 2026-10-28 | Phase 2 : actions (statut, note 1 à 10, favori, retrait) sur la page de détail `/title/:type/:id` ; bouton rapide « Marquer comme vu » sur les cartes de Ma liste ; retrait avec confirmation, supprime statut, note et favori ; migration 003 ajoute le statut « Abandonné » (`dropped`) ; `watched_at` renseigné uniquement quand le statut est « Vu » | Cartes légères sur mobile, geste rapide pour le cas le plus fréquent | |

## Modèle d'entrée

```text
| D-XX | AAAA-MM-JJ | Décision | Justification | D-YY ou vide |
```
