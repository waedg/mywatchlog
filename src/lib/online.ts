import { OfflineError } from './api-error'

/** À appeler au début d'une écriture : échoue tout de suite hors connexion au lieu de rester en attente. */
export function assertOnline(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new OfflineError()
}
