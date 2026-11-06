import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, SearchX, Sparkles, WifiOff } from 'lucide-react'

import EmptyState from '@/components/layout/EmptyState'
import PosterCard from '@/components/PosterCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import { libraryKey, parseTypeFilter } from '@/features/library/group'
import { useLibrary } from '@/features/library/useLibrary'
import { ApiError, apiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

import { DESCRIBE_MAX_CHARS, DESCRIBE_MIN_CHARS, normalizeDescriptionInput } from './describe'
import { useDescribe } from './useDescribe'

type Filter = 'all' | 'movie' | 'tv'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Séries' },
]

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'

/**
 * Recherche par description (phase 11). La description soumise (`d`) et le filtre (`type`) sont dans l'URL :
 * le bouton retour restitue la même recherche (D-34) sans rappeler l'IA tant que le résultat est en cache.
 * Aucune recherche automatique à la frappe : chaque appel coûte du temps (environ 2,5 s) et du quota.
 */
export default function DescribeSearch() {
  const [params, setParams] = useSearchParams()
  const submitted = normalizeDescriptionInput(params.get('d'))
  const filter: Filter = parseTypeFilter(params.get('type'))

  const [draft, setDraft] = useState(params.get('d') ?? '')
  // Retour arrière ou lien : quand la description de l'URL change, le champ la reprend
  // (ajustement de l'état pendant le rendu, plutôt que dans un effet).
  const [syncedWith, setSyncedWith] = useState(submitted)
  if (submitted !== syncedWith) {
    setSyncedWith(submitted)
    if (submitted !== null) setDraft(submitted)
  }

  const update = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const query = useDescribe(submitted)
  const library = useLibrary()
  const owned = new Set((library.data ?? []).map((item) => libraryKey(item.type, item.id)))

  const normalizedDraft = normalizeDescriptionInput(draft)
  const tooShort = draft.trim().length > 0 && normalizedDraft === null
  const canSubmit = normalizedDraft !== null && !query.isFetching

  const submit = () => {
    if (normalizedDraft === null || query.isFetching) return
    update('d', normalizedDraft)
  }
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit()
  }
  // Entrée valide, Maj+Entrée fait un retour à la ligne ; pas de validation pendant une composition (IME).
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const results = query.data?.results ?? []
  const counts = {
    all: results.length,
    movie: results.filter((r) => r.type === 'movie').length,
    tv: results.filter((r) => r.type === 'tv').length,
  }
  const visible = filter === 'all' ? results : results.filter((r) => r.type === filter)
  const quotaReached = query.error instanceof ApiError && query.error.code === 'ai_quota'

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={DESCRIBE_MAX_CHARS}
          rows={3}
          enterKeyHint="search"
          placeholder="Décris ce dont tu te souviens : l'histoire, une scène, des acteurs, l'époque…"
          aria-label="Description du film ou de la série"
          autoFocus
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {tooShort ? `Au moins ${DESCRIBE_MIN_CHARS} caractères.` : `${draft.length}/${DESCRIBE_MAX_CHARS}`}
          </p>
          <Button type="submit" disabled={!canSubmit}>
            {query.isFetching ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Rechercher
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Suggestions générées par une IA : elles peuvent se tromper.</p>
      </form>

      {submitted === null && (
        <EmptyState
          icon={Sparkles}
          title="Décris ce que tu te rappelles"
          description="L'intrigue, une scène marquante, des acteurs, l'époque, le lieu… Plus tu donnes de détails, meilleures sont les suggestions."
        />
      )}

      {submitted !== null && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les résultats">
            {FILTERS.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? 'default' : 'outline'}
                className={cn('rounded-full', filter !== value && 'text-muted-foreground')}
                aria-pressed={filter === value}
                onClick={() => update('type', value === 'all' ? null : value)}
              >
                {label}
                {query.data && <span className="opacity-70">{counts[value]}</span>}
              </Button>
            ))}
          </div>

          {query.isPending && query.fetchStatus === 'paused' && (
            <EmptyState
              icon={WifiOff}
              title="Hors connexion"
              description="La recherche par description nécessite une connexion à internet."
            />
          )}

          {query.isPending && query.fetchStatus !== 'paused' && (
            <div className={GRID} aria-busy="true">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="aspect-[2/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {query.isError && (
            <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-12 text-center">
              <p className="text-sm">{apiErrorMessage(query.error)}</p>
              {!quotaReached && (
                <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
                  Réessayer
                </Button>
              )}
            </div>
          )}

          {query.isSuccess && visible.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="Aucun titre trouvé"
              description={
                filter === 'all'
                  ? 'Aucune suggestion fiable pour cette description. Ajoute des détails (acteurs, époque, lieu, scène marquante) ou cherche par titre.'
                  : 'Aucun résultat dans cette catégorie. Essaie un autre filtre.'
              }
            />
          )}

          {query.isSuccess && visible.length > 0 && (
            <div className={GRID}>
              {visible.map((item) => (
                <PosterCard
                  key={`${item.type}-${item.id}`}
                  title={item.title}
                  year={item.year}
                  type={item.type}
                  posterPath={item.posterPath}
                  to={`/title/${item.type}/${item.id}`}
                  action={<AddToLibraryButton item={item} inLibrary={owned.has(libraryKey(item.type, item.id))} />}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
