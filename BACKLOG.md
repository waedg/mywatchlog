# MyWatchlog : backlog, décisions à prendre et bugs

Types : `DEC` décision à prendre, `TODO` tâche, `BUG` anomalie, `VERIF` point à vérifier.
Priorités : P1 bloquant la phase en cours, P2 avant la fin de la phase cible, P3 plus tard.
Statuts : `Ouvert`, `En cours`, `Résolu`, `Abandonné`.

## Décisions à prendre

| ID | Type | Sujet | Phase cible | Prio | Statut |
|---|---|---|---|---|---|
| B-001 | DEC | Restreindre la connexion à l'adresse Google du propriétaire (liste d'autorisation ou inscriptions désactivées) | 1 | P1 | Résolu (D-17) |
| B-002 | DEC | Ajouter un statut « abandonné » (`dropped`) en plus de à voir / en cours / vu | 2 | P2 | Résolu |
| B-003 | DEC | Gestion des épisodes spéciaux (saison 0) et des saisons annoncées sans date | 3 | P2 | Résolu |
| B-004 | DEC | Fuseau horaire d'affichage des sorties (Europe/Paris) et gestion des dates TMDB | 5 | P3 | Ouvert |
| B-005 | DEC | Stratégie de tests (unitaires, e2e) et niveau de couverture attendu | 1 | P3 | Résolu (D-20) |
| B-006 | DEC | Bibliothèque de composants UI : Tailwind seul écarté (D-21), choisir une bibliothèque moderne | 1 | P1 | Résolu (D-22) |
| B-026 | DEC | Bloquer la création de compte non autorisé (hook « Before User Created » Supabase) | 2 | P3 | Ouvert |
| B-027 | VERIF | Conseil Supabase « is_allowed() exécutable par authenticated » : voulu (utilisé par les policies RLS, ne renvoie que l'état de l'appelant). Réévaluer un déplacement vers un schéma privé | 2 | P3 | Accepté |
| B-028 | VERIF | `npm audit` : vulnérabilité deepmerge via vite-plugin-pwa, workbox-build (outils de build, pas de code envoyé au navigateur). Ne pas appliquer `audit fix --force` (rétrograde vite-plugin-pwa). Réévaluer en phase 4 | 4 | P3 | Ouvert |
| B-029 | TODO | Tester `/api/tmdb` avec un jeton utilisateur réel (recherche, détails film et série, `imdb_id`) une fois la connexion Google en place | 1 | P1 | Résolu |
| B-030 | VERIF | Valider visuellement le rendu (accent jaune, thème sombre, navigation basse mobile) sur le téléphone de l'utilisateur et ajuster | 1 | P2 | Résolu (validé par l'utilisateur) |
| B-031 | VERIF | Tester la connexion Google de bout en bout : compte autorisé (accès à Ma liste, déconnexion) et, si possible, compte non autorisé (écran « Accès non autorisé ») | 1 | P1 | Résolu (compte autorisé validé par l'utilisateur) |
| B-032 | DEC | Clé composite (id, type) pour `titles` et `user_titles` : TMDB numérote films et séries séparément, un même identifiant peut désigner un film et une série. Migration 002 à valider (tables vides) | 1 | P1 | Résolu |
| B-033 | TODO | Bouton « Ajouter » sur les cartes de recherche, ajout à la liste, indicateur « Dans ma liste » (dépend de B-032) | 1 | P1 | Résolu |
| B-034 | TODO | Documenter le test local de `/api` (la fonction n'est pas servie par `vite dev`, utiliser `vercel dev`) dans le README | 1 | P3 | Résolu |

## Points à vérifier

| ID | Type | Sujet | Phase cible | Prio | Statut |
|---|---|---|---|---|---|
| B-010 | VERIF | Limites de débit de l'API TMDB (page « Rate Limiting » non lue) | 1 | P2 | Résolu (D-25) |
| B-011 | VERIF | Mention d'attribution obligatoire pour les données « où regarder » (JustWatch) | 5 | P2 | Résolu |
| B-012 | VERIF | Politique de mise en pause des projets Supabase gratuits (délai d'inactivité) | 0 | P2 | Ouvert |
| B-013 | VERIF | Disponibilité de l'identifiant IMDb via `external_ids` pour films et séries | 1 | P3 | Ouvert |
| B-014 | VERIF | Fiabilité des notifications push d'une PWA sur Android | 6 | P3 | Ouvert |

## Tâches

| ID | Type | Sujet | Phase cible | Prio | Statut |
|---|---|---|---|---|---|
| B-020 | TODO | Créer le dépôt GitHub public `mywatchlog` (action utilisateur) | 0 | P1 | Résolu |
| B-021 | TODO | Rattacher le dépôt à la session et commiter les fichiers de cadrage | 0 | P1 | Résolu |
| B-022 | TODO | Créer le projet Vercel relié au dépôt | 0 | P1 | Résolu |
| B-023 | TODO | Ajouter une page « À propos » avec mention et logo TMDB | 4 | P2 | Résolu |
| B-024 | TODO | Renseigner l'URL du site (https://mywatchlog-delta.vercel.app) et l'URI de redirection dans Supabase Auth (URL Configuration) | 1 | P1 | Résolu (déclaré par l'utilisateur) |
| B-025 | TODO | Accorder au connecteur Vercel l'accès à l'espace de l'utilisateur (403 sur le scope wago1) | 1 | P3 | Résolu |

## Bugs

Aucun pour l'instant.

## Modèle d'entrée

```text
| B-0XX | BUG | Description courte, étapes de reproduction | Phase | P1/P2/P3 | Ouvert |
```
| B-035 | TODO | Phase 3 : « Marquer comme vu » sur une série doit marquer tous les épisodes comme vus (aujourd'hui seul le statut change) | 3 | P1 | Résolu |
| B-036 | TODO | Notes à la demi-étoile (0,5) si besoin : la colonne `rating` numeric(3,1) le permet, l'interface propose 1 à 10 entiers | 2 | P3 | Ouvert |
| B-037 | TODO | Épisodes sans date de diffusion : non cochables en groupe (cochables à la main). À revoir si des séries anciennes posent problème | 3 | P3 | Ouvert |
| B-038 | TODO | Fuseau horaire des dates de diffusion (B-004) : comparaison avec la date locale du navigateur | 3 | P3 | Ouvert |
| B-039 | TODO | Restauration de la position de défilement au retour (non incluse : les listes se chargent de façon asynchrone) | 4 | P3 | Ouvert |
| B-040 | TODO | « À jour » exact pour une série encore diffusée : le total inclut les épisodes annoncés non diffusés, donc 44/44 n'apparaît que si tous les épisodes listés sont vus | 4 | P3 | Ouvert |
| B-041 | TODO | Ajouter le logo officiel TMDB sur la page À propos (fichier non récupérable depuis l'environnement : à fournir, depuis themoviedb.org/about/logos-attribution) ; il doit rester moins visible que le logo de l'application | 4 | P2 | Résolu |
| B-042 | TODO | Écritures hors connexion (cocher des épisodes puis synchroniser plus tard) : non prévu, à étudier si le besoin apparaît | 5 | P3 | Ouvert |
| B-043 | TODO | Icône personnalisée à remplacer par une image fournie par l'utilisateur (décision 2 : « pour le moment ») | 4 | P3 | Ouvert |
| B-044 | TODO | Sorties : calcul côté serveur par tâche planifiée (clé service_role dans Vercel) si le chargement devient long avec une grosse liste ; à grouper avec les notifications (phase 6) | 6 | P3 | Ouvert |
| B-045 | TODO | Sorties hors connexion : les détails ne sont pas dans le cache persistant (la page affiche « Hors connexion ») | 5 | P3 | Ouvert |
| B-046 | TODO | Suivi d'acteurs et plateformes personnelles (« disponible sur ton abonnement ») : écartés pour l'instant (décisions 3 et 4) | 6 | P3 | Ouvert |
| B-047 | DEC | Phase 6 en attente : statistiques (durées à stocker, migration 006), notifications push (clés VAPID, table d'abonnements, tâche planifiée, clé service_role à ajouter par l'utilisateur dans Vercel) ; à relancer après la période d'utilisation | 6 | P2 | En attente |
| B-048 | BUG | Fiche : le casting défilait horizontalement au lieu de s'adapter à l'écran. Corrigé : grille responsive (3, 4, 5 puis 6 colonnes), garde-fous de largeur dans la mise en page de la fiche | 5 | P2 | Résolu |
| B-049 | FEAT | Lire des fichiers vidéo d'un NAS directement dans l'application (à étudier avant tout développement). Contraintes connues : l'application est en HTTPS sur Vercel, donc un NAS en HTTP local est bloqué (contenu mixte) ; le NAS doit être joignable hors du domicile (VPN, Tailscale, reverse proxy HTTPS) ; les navigateurs lisent mal MKV, HEVC et DTS (transcodage côté serveur : Jellyfin, Plex) ; il faut associer les fichiers aux titres. Questions à poser : modèle de NAS, protocole disponible (SMB, WebDAV, DLNA, Jellyfin/Plex), usage à distance ou seulement chez soi, formats des fichiers | - | P2 | Cadrée (phase 7), essai 7.0 à faire |
| B-050 | TODO | Utiliser `has_copy` : badge « copie » sur les cartes et filtre « J'ai une copie » dans Ma liste (non demandé pour l'instant) | - | P3 | Ouvert |
| B-051 | TODO | Phase 7.0 : essai de compatibilité sur 3 fichiers (H.264, HEVC, audio DTS) via Tailscale Serve : lecteur de Quantum, URL directe, VLC / MX Player ; relever codecs, débit montant, VPN du téléphone (voir docs/phase-7-nas.md) | 7 | P2 | Ouvert |
| B-052 | TODO | Créer dans Quantum un utilisateur en lecture seule limité au dossier des vidéos, et en tirer le jeton de l'application | 7 | P2 | Ouvert |
| B-053 | TODO | Vérifier dans la documentation officielle de Quantum : lecteur vidéo, transcodage, sous-titres, requêtes Range, CORS | 7 | P2 | Ouvert |
| B-054 | TODO | Renommer les fichiers du NAS selon la convention `[tmdbid-<id>]` sous `Films/` et `Series/` (docs/phase-7-nas.md §12), sous-titres `.srt` au même nom | 7 | P2 | Ouvert |
| B-055 | IDEA | Fiche : « Dans la même veine » (`/recommendations`), saga (`belongs_to_collection`), bande-annonce, filtre plateformes sur suggestions | 8 | P3 | Reporté (hors phase 8) |
| B-056 | IDEA | Statistiques : genres les plus vus (phase 6, nécessite les genres en base) | 6 | P3 | Reporté |
| B-057 | TODO | Phase 8.1 à 8.5 : voir docs/phase-8-decouverte.md | 8 | P2 | Résolu (2026-10-30) |
