# Phase 7 — Lecture de fichiers vidéo depuis le NAS (cadrage)

Statut : **cadrage uniquement, aucun développement** (décision du 2026-10-28). Document à mettre à jour après l'essai de compatibilité (7.0).

**Décisions validées (D-39, 2026-10-28)** : lecteur principal = VLC (option C), Jellyfin accepté en recours seulement ; nommage des dossiers avec `[tmdbid-<id>]` pour le rapprochement automatique ; essai 7.0 révisé (section 12).

## 1. Objectif

Depuis la fiche d'un film ou d'une série de MyWatchlog, lancer la lecture du fichier vidéo stocké sur le NAS personnel, sans quitter l'application, depuis le téléphone Android (PWA) ou un navigateur.

Hors périmètre : téléchargement de fichiers, gestion des fichiers (renommage, suppression), diffusion vers une TV, partage avec d'autres personnes, acquisition de contenus.

## 2. Contexte

| Élément | Valeur |
|---|---|
| NAS | Solution locale sous Linux, services en Docker |
| Gestionnaire de fichiers | FileBrowser Quantum (image `gtstef/filebrowser`) |
| Accès distant | Tailscale (déjà utilisé) |
| Fichiers | Principalement MKV (codecs exacts à relever, voir 6) |
| Application | PWA servie en HTTPS par Vercel ; données Supabase ; indicateur `has_copy` déjà en place (D-37) |

## 3. Ce qui est établi et ce qui reste à vérifier

| Point | État | Source ou action |
|---|---|---|
| FileBrowser Quantum : jetons d'API longue durée, page Swagger `/swagger`, partages avec expiration et mot de passe, contrôle d'accès par dossier et par utilisateur, authentification OIDC / LDAP / mot de passe + TOTP / en-têtes de proxy | Établi | Pages de présentation de Quantum (voir sources) |
| Quantum génère des vignettes vidéo ; l'image Docker embarque `ffmpeg` | Établi | Idem |
| Quantum lit les vidéos dans son interface, formats pris en charge, transcodage, sous-titres, requêtes HTTP Range, CORS | **Non confirmé** | Les pages consultées n'en parlent pas. À vérifier dans la documentation officielle ou par essai |
| Tailscale Serve : HTTPS avec certificat TLS provisionné automatiquement, accessible aux seuls appareils du tailnet (Funnel = exposition publique, à exclure) | Établi | Documentation `tailscale serve` |
| Prérequis exacts de Serve (MagicDNS, certificats HTTPS activés dans la console) et syntaxe selon la version installée | À vérifier | `tailscale serve --help` sur le NAS, console d'administration Tailscale |
| Chrome lit le HEVC seulement si l'appareil a un décodeur matériel HEVC (Chrome 105 et suivants) | Établi | Bitmovin, support HEVC de Chrome |
| Chrome (Android) lit un MKV H.264 + AAC | **Non confirmé** | Les sources consultées divergent (un message de forum affirme que Chrome ne lit pas le MKV). À tester |
| Audio AC3 / EAC3 / DTS / TrueHD, sous-titres intégrés (ASS, PGS), choix de piste audio dans la balise `<video>` | Non confirmé, **supposé non pris en charge** | À tester ; prévoir des sous-titres externes WebVTT si besoin |

## 4. Contraintes techniques

1. **HTTPS obligatoire** : une page HTTPS (Vercel) ne peut pas charger une vidéo en HTTP (contenu mixte). Le NAS doit donc être exposé en HTTPS : `tailscale serve` règle ce point sans domaine ni certificat à gérer.
2. **Téléphone sur le tailnet** : l'application Tailscale doit être active sur le téléphone. Android n'autorise qu'**un seul VPN actif** à la fois : conflit possible avec un autre VPN.
3. **Interdépendance des domaines** : l'application (vercel.app) appelle le NAS (…ts.net). Une balise `<video src>` n'exige pas de CORS, mais tout appel `fetch` à l'API de Quantum (listing de dossiers) l'exige : il faudra activer CORS côté Quantum ou passer par un autre mécanisme.
4. **Secrets** : un jeton d'API Quantum donne accès aux fichiers. Il ne doit **jamais** être dans le dépôt (public) ni dans Supabase. Stockage envisagé : `localStorage` de chaque appareil, saisi une fois dans « À propos ».
5. **Débit** : un MKV remux de film dépasse souvent 20 Mbit/s. Hors du domicile, le débit montant de la connexion Internet du NAS limite la lecture directe.
6. **Hors-ligne** : la lecture du NAS est impossible hors réseau (la lecture hors-ligne de la liste, D-35, est inchangée).

## 5. Options d'architecture

| Option | Principe | Avantages | Limites |
|---|---|---|---|
| A. Lien vers Quantum | Un bouton de la fiche ouvre le fichier dans l'interface de Quantum (nouvel onglet ou PWA) | Aucun lecteur à développer ; fonctionne dès que Quantum sait lire le fichier | Dépend des capacités de lecture de Quantum (MKV, audio, sous-titres) ; on quitte MyWatchlog |
| B. Lecteur intégré, lecture directe | Balise `<video>` dans MyWatchlog sur l'URL du fichier servie par Quantum | Expérience intégrée ; reprise de lecture et « vu » automatique possibles | Seuls les fichiers compatibles passent (conteneur, codecs, audio) ; sous-titres externes uniquement |
| C. Lecteur Android externe | Bouton qui ouvre le fichier dans VLC ou MX Player (lien profond ou intent) | Lit tous les MKV, tous les codecs audio, sous-titres et pistes intégrés ; aucun transcodage | On quitte l'application ; pas de suivi de position ; propre à Android |
| D. Ajouter Jellyfin | Serveur de médias en Docker avec transcodage ; MyWatchlog le pilote ou l'ouvre | Lecture universelle, sous-titres, pistes, reprise ; transcodage à distance | Un service de plus à installer et à maintenir ; ressources CPU/GPU du NAS ; bibliothèque à configurer |
| E. Pré-conversion | Convertir les MKV en MP4 H.264 / AAC (script `ffmpeg`) | Rend l'option B fiable | Travail sur les fichiers ; espace disque ; perte des pistes multiples |

Les options se combinent : par exemple **A + C** (pas de développement de lecteur), puis **B** pour les fichiers compatibles, et **D** seulement si ces options ne suffisent pas.

## 6. Étape 7.0 — essai de compatibilité (avant tout développement)

Objectif : décider de l'option sur des faits. Durée estimée : une heure. Aucun code dans MyWatchlog.

**a) Relever les codecs de 3 fichiers représentatifs** (par exemple un film en H.264, un en HEVC, un avec audio DTS) :

```bash
ffprobe -v error -show_entries stream=index,codec_type,codec_name,profile:stream_tags=language \
  -of compact "fichier.mkv"
```

**b) Exposer Quantum en HTTPS sur le tailnet** (remplacer le port par celui de Quantum ; vérifier la syntaxe avec `tailscale serve --help` selon la version) :

```bash
sudo tailscale serve --bg --https=443 localhost:8080
tailscale serve status
```

**c) Tester sur le téléphone** (Tailscale actif, 4G pour simuler la distance) pour chacun des 3 fichiers :

| Test | Résultat à noter |
|---|---|
| Lecture dans l'interface de Quantum | Image ? Son ? Sous-titres ? Début de lecture en combien de secondes ? |
| URL directe du fichier dans Chrome | Lecture, téléchargement ou erreur ? |
| Ouverture dans VLC / MX Player depuis le lien | Lecture complète avec pistes et sous-titres ? |

**d) Relever** : version de Quantum, débit montant de la connexion du NAS (test de débit depuis le NAS), et si un autre VPN est utilisé sur le téléphone.

Critères de décision :

- Quantum lit bien tes MKV avec le son : **option A** suffit.
- Lecture directe correcte en H.264 / AAC mais pas le reste : **A + C**, éventuellement **E**.
- Majorité de fichiers HEVC / DTS ou débit montant insuffisant : **D** (Jellyfin) à étudier.

## 7. Découpage prévisible (après 7.0)

| Bloc | Contenu | Données |
|---|---|---|
| 7.1 | Configuration NAS dans « À propos » : adresse HTTPS du NAS et jeton en lecture seule, enregistrés localement sur l'appareil, bouton « Tester la connexion » | Aucune en base |
| 7.2 | Liaison titre ↔ fichier : chemin enregistré sur le titre (film : fichier ; série : dossier, épisodes retrouvés par `SxxExx` dans les noms de fichiers) ; assistant de recherche dans le NAS | Colonne `copy_path` sur `user_titles` (migration à prévoir) |
| 7.3 | Bouton « Lire » sur la fiche (et sur chaque épisode) selon l'option retenue | — |
| 7.4 | Optionnel : marquer comme vu automatiquement à partir de 90 % de lecture ; reprise de lecture | Position de lecture à stocker (option B ou D seulement) |

## 8. Sécurité

- Ne **jamais** utiliser Tailscale Funnel pour ce service : il ouvrirait le NAS à Internet.
- Créer dans Quantum un **utilisateur dédié en lecture seule**, limité au dossier des vidéos (le contrôle d'accès par dossier existe), et en tirer le jeton de l'application. Un jeton perdu ne donne alors accès qu'à la lecture de ce dossier.
- Limiter les accès dans les ACL Tailscale aux appareils personnels.
- Le jeton et l'adresse restent sur chaque appareil (pas de synchronisation, pas dans le dépôt).

## 9. Risques

| Risque | Impact | Réponse |
|---|---|---|
| Lecture MKV / HEVC / DTS impossible dans le navigateur | Option B inutilisable | Options C ou D (décidé en 7.0) |
| Débit montant insuffisant hors domicile | Lecture saccadée | Transcodage (D) ou lecture chez soi |
| Conflit de VPN sur Android | Lecture impossible | Documenter ; garder Tailscale comme VPN unique |
| Jeton volé | Accès aux vidéos | Jeton en lecture seule, dossier limité, révocable dans Quantum |
| NAS éteint ou injoignable | Bouton « Lire » en échec | Message clair ; indicateur de joignabilité dans « À propos » |

## 10. Questions ouvertes

1. Quelles sont les caractéristiques réelles de tes fichiers (conteneur, codec vidéo, codec audio, sous-titres) ?
2. Où regardes-tu : seulement sur le téléphone, ou aussi PC et TV ?
3. Seulement chez toi, ou aussi à distance (et quel débit montant) ?
4. Utilises-tu un autre VPN sur le téléphone ?
5. Comment sont nommés et rangés les fichiers (un dossier par film, un dossier par série avec `S01E02` dans les noms) ?
6. Sous-titres : intégrés au MKV ou fichiers `.srt` à côté ?
7. Jellyfin sur le NAS est-il acceptable si l'essai 7.0 le justifie ?
8. Version de FileBrowser Quantum et état de ses réglages de lecture (lecteur vidéo, `ffmpeg`).

## 11. Réponses de l'utilisateur (2026-10-28)

| Question | Réponse |
|---|---|
| Caractéristiques des fichiers | Pas encore relevées (`ffprobe` à faire en 7.0) |
| Appareils | Téléphone Android et PC (Tailscale et VLC installés sur le PC) |
| Distance | Chez soi et à distance |
| Autre VPN sur le téléphone | Non |
| Rangement | Adaptable, petite bibliothèque (renommage manuel possible) |
| Sous-titres | Intégrés et fichiers `.srt` |
| Jellyfin | Accepté si l'essai le justifie |
| Lecteur préféré | VLC |

## 12. Décisions et essai 7.0 révisé (D-39)

**Nommage** (rapprochement automatique, remplace la liaison manuelle du bloc 7.2). Préfixes `Films/` et `Series/` obligatoires : un identifiant TMDB film et un identifiant série peuvent coïncider.

```text
Films/Inception (2010) [tmdbid-27205]/Inception (2010) [tmdbid-27205].mkv
Films/Inception (2010) [tmdbid-27205]/Inception (2010) [tmdbid-27205].fr.srt
Series/Breaking Bad (2008) [tmdbid-1396]/Season 01/Breaking Bad - S01E01.mkv
Series/Breaking Bad (2008) [tmdbid-1396]/Season 01/Breaking Bad - S01E01.fr.srt
```

**Points à vérifier en 7.0**

1. Authentification d'une URL ouverte dans VLC (pas d'en-tête `Authorization`) : lien de partage Quantum avec expiration, ou jeton en paramètre d'URL. Sinon : Jellyfin ou relais.
2. Lancement de VLC : Android, lien `intent://` avec le paquet `org.videolan.vlc` (à confirmer) ; PC, fichier `.m3u` ou « Média → Ouvrir un flux réseau ».

**Étapes**

1. `ffprobe` sur 3 fichiers (H.264, HEVC, audio DTS).
2. `tailscale serve` vers Quantum.
3. Lien de partage Quantum ouvert dans VLC Android sur 4G : lecture, son, sous-titres, délai de démarrage.
4. Même test sur PC (flux réseau).
5. Débit montant du NAS.

## 13. Sources

- FileBrowser Quantum : [présentation (ComputingForGeeks)](https://computingforgeeks.com/install-filebrowser-quantum/), [LinuxLinks](https://www.linuxlinks.com/filebrowser-quantum-feature-rich-web-file-manager/), [dépôt dérivé](https://github.com/kenrmayfield/filebrowserquantum) ; documentation officielle à consulter : filebrowserquantum.com
- Tailscale : [`tailscale serve`](https://tailscale.com/docs/reference/tailscale-cli/serve)
- Chrome et HEVC : [Bitmovin](https://bitmovin.com/google-adds-hevc-support-chrome)
- Compatibilité MKV dans le navigateur : [forum Jellyfin](https://forum.jellyfin.org/t-web-client-media-formats) (un seul témoignage, à confirmer par l'essai 7.0)
