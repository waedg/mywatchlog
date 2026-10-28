import { Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useEpisodeActions } from '@/features/episodes/useEpisodes'
import type { MediaType } from '../../../shared/tmdb-types'

import { statusPatch } from './group'
import { useUpdateUserTitle } from './useLibrary'

/** « Marquer comme vu » : un film passe à « Vu » ; une série voit tous ses épisodes diffusés. */
export default function QuickWatchedButton({ id, type }: { id: number; type: MediaType }) {
  return type === 'movie' ? <MovieQuick id={id} /> : <TvQuick id={id} />
}

function MovieQuick({ id }: { id: number }) {
  const update = useUpdateUserTitle({ id, type: 'movie' })
  return <QuickButton pending={update.isPending} onClick={() => update.mutate(statusPatch('watched'))} />
}

function TvQuick({ id }: { id: number }) {
  const actions = useEpisodeActions(id)
  return <QuickButton pending={actions.isPending} onClick={actions.markAllAired} label="Tout marquer comme vu" />
}

function QuickButton({ pending, onClick, label = 'Marquer comme vu' }: { pending: boolean; onClick: () => void; label?: string }) {
  return (
    <Button variant="outline" size="sm" className="w-full" disabled={pending} onClick={onClick}>
      {pending ? <Loader2 className="animate-spin" /> : <Check />}
      {label}
    </Button>
  )
}
