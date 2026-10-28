export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string) {
    super(`API ${status} ${code}`)
    this.status = status
    this.code = code
  }
}

/** Écriture refusée parce que l'appareil est hors connexion (les modifications ne sont pas mises en file d'attente, B-042). */
export class OfflineError extends Error {
  constructor() {
    super('Hors connexion')
  }
}

/** Message affichable en français pour une erreur d'appel à l'API. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof OfflineError) return 'Hors connexion : cette modification nécessite internet. Réessaie une fois reconnecté.'
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Ta session a expiré. Reconnecte-toi puis réessaie.'
    if (error.status === 403) return "Ce compte n'est pas autorisé à utiliser l'application."
    if (error.status === 429) return 'Trop de requêtes. Réessaie dans un instant.'
    if (error.status === 404) return 'Aucun résultat trouvé pour cet élément.'
    if (error.status >= 500) return 'Le service est momentanément indisponible. Réessaie dans un instant.'
  }
  return 'Une erreur est survenue. Vérifie ta connexion puis réessaie.'
}
