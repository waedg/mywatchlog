/** Pays proposés pour la disponibilité des plateformes (codes ISO 3166-1). */
export const REGIONS = [
  'FR', 'BE', 'CH', 'LU', 'CA', 'DE', 'AT', 'ES', 'IT', 'PT', 'GB', 'IE', 'NL', 'SE', 'NO', 'DK', 'FI', 'PL',
  'US', 'MX', 'BR', 'MA', 'DZ', 'TN', 'SN', 'CI', 'AU', 'JP',
] as const

export const DEFAULT_REGION = 'FR'

/** Relit un pays enregistré ; une valeur inconnue donne le pays par défaut. */
export function parseRegion(value: string | null | undefined): string {
  const code = value?.toUpperCase()
  return code && (REGIONS as readonly string[]).includes(code) ? code : DEFAULT_REGION
}

/** Nom du pays en français. */
export function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}
