import { CircleCheck, Loader2 } from 'lucide-react'

import { useEpisodeActions } from '@/features/episodes/useEpisodes'
import type { MediaType } from '../../../shared/tmdb-types'

import { statusPatch } from './group'
import { useUpdateUserTitle } from './useLibrary'

const ROUND =
  'flex size-9 items-center justify-center rounded-full border bg-background/80 backdrop-blur outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50'

/** Pastille ronde en haut à droite de l'affiche : un film passe à « Vu » ; une série voit tous ses épisodes diffusés. */
export default function QuickWatchedButton({ id, type }: { id: number; type: MediaType }) {
  return type === 'movie' ? <MovieQuick id={id} /> : <TvQuick id={id} />
}

/** Indicateur « Vu » (non cliquable). */
export function WatchedMark() {
  return (
    <span role="img" aria-label="Vu" className={`${ROUND} border-primary bg-primary text-primary-foreground`}>
      <CircleCheck className="size-5" />
    </span>
  )
}

function MovieQuick({ id }: { id: number }) {
  const update = useUpdateUserTitle({ id, type: 'movie' })
  return <RoundButton pending={update.isPending} label="Marquer comme vu" onClick={() => update.mutate(statusPatch('watched'))} />
}

function TvQuick({ id }: { id: number }) {
  const actions = useEpisodeActions(id)
  return <RoundButton pending={actions.isPending} label="Marquer tous les épisodes diffusés comme vus" onClick={actions.markAllAired} />
}

function RoundButton({ pending, onClick, label }: { pending: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className={`${ROUND} text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-60`}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={onClick}
    >
      {pending ? <Loader2 className="size-5 animate-spin" /> : <CircleCheck className="size-5" />}
    </button>
  )
}
