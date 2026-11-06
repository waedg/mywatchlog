import { useQuery } from '@tanstack/react-query'

import { describeTitles } from '@/lib/api'

/** Une même description n'est pas renvoyée à l'IA pendant 30 minutes (quota gratuit limité). */
const DESCRIBE_STALE_MS = 30 * 60_000

/**
 * Recherche par description. `description` doit déjà être nettoyée (normalizeDescriptionInput) ;
 * `null` désactive la requête (rien n'a été soumis).
 * `retry: false` : le réessai automatique (1 par défaut dans l'application) consommerait le quota deux fois.
 * Non persistée : seules les requêtes listées dans query-cache.ts le sont, la clé « describe » n'y figure pas.
 */
export function useDescribe(description: string | null) {
  return useQuery({
    queryKey: ['describe', description],
    queryFn: ({ signal }) => describeTitles(description ?? '', signal),
    enabled: description !== null,
    staleTime: DESCRIBE_STALE_MS,
    retry: false,
  })
}
