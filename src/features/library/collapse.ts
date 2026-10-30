import { isStatus, type Status } from './group'

/** Clé localStorage des groupes repliés de « Ma liste » (préférence de cet appareil). */
export const COLLAPSED_KEY = 'mywatchlog-collapsed'

/** Relit les groupes repliés ; toute valeur invalide est ignorée. */
export function parseCollapsed(raw: string | null): Status[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return [...new Set(value.filter((entry): entry is Status => typeof entry === 'string' && isStatus(entry)))]
  } catch {
    return []
  }
}

/** Replie ou déplie un groupe (renvoie une nouvelle liste). */
export function toggleCollapsed(collapsed: Status[], status: Status): Status[] {
  return collapsed.includes(status) ? collapsed.filter((entry) => entry !== status) : [...collapsed, status]
}
