export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string) {
    super(`API ${status} ${code}`)
    this.status = status
    this.code = code
  }
}

/** Message affichable en français pour une erreur d'appel à l'API. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Ta session a expiré. Reconnecte-toi puis réessaie.'
    if (error.status === 403) return "Ce compte n'est pas autorisé à utiliser l'application."
    if (error.status === 429) return 'Trop de requêtes. Réessaie dans un instant.'
    if (error.status === 404) return 'Aucun résultat trouvé pour cet élément.'
    if (error.status >= 500) return 'Le service est momentanément indisponible. Réessaie dans un instant.'
  }
  return 'Une erreur est survenue. Vérifie ta connexion puis réessaie.'
}
