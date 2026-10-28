import { useQuery } from '@tanstack/react-query'

import { Skeleton } from '@/components/ui/skeleton'
import { getProviders } from '@/lib/api'
import { regionName } from '@/lib/region'
import { logoUrl } from '@/lib/tmdb-images'
import { useRegion } from '@/lib/use-region'
import type { MediaType, ProviderInfo } from '../../../shared/tmdb-types'

function Group({ label, providers }: { label: string; providers: ProviderInfo[] }) {
  if (providers.length === 0) return null
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {providers.map((provider) => {
          const src = logoUrl(provider.logoPath)
          return (
            <li key={provider.id} title={provider.name}>
              {src ? (
                <img src={src} alt={provider.name} loading="lazy" className="size-10 rounded-lg border" />
              ) : (
                <span className="flex h-10 items-center rounded-lg border px-2 text-xs">{provider.name}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Où regarder un titre dans le pays choisi (données JustWatch via TMDB). */
export default function Providers({ type, id }: { type: MediaType; id: number }) {
  const [region] = useRegion()
  const providers = useQuery({
    queryKey: ['providers', type, id, region],
    queryFn: ({ signal }) => getProviders(type, id, region, signal),
    staleTime: 6 * 60 * 60_000,
  })

  if (providers.isPending && providers.fetchStatus === 'paused') return null

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
        Où regarder <span className="normal-case text-muted-foreground">· {regionName(region)}</span>
      </h2>

      {providers.isPending && <Skeleton className="h-10 w-40" />}

      {providers.isError && <p className="text-sm text-muted-foreground">Plateformes indisponibles pour le moment.</p>}

      {providers.isSuccess && (
        <>
          <Group label="Abonnement" providers={providers.data.flatrate} />
          <Group label="Location" providers={providers.data.rent} />
          <Group label="Achat" providers={providers.data.buy} />
          {providers.data.flatrate.length + providers.data.rent.length + providers.data.buy.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune plateforme référencée pour {regionName(region)}.</p>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Données de disponibilité fournies par{' '}
        <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          JustWatch
        </a>
        .
      </p>
    </div>
  )
}
