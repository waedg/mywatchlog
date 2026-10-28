import { Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { MediaType } from '../../../shared/tmdb-types'

import { statusPatch } from './group'
import { useUpdateUserTitle } from './useLibrary'

/** Passe un titre à « Vu » en un geste (phase 3 : marquera aussi tous les épisodes). */
export default function QuickWatchedButton({ id, type }: { id: number; type: MediaType }) {
  const update = useUpdateUserTitle({ id, type })

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      disabled={update.isPending}
      onClick={() => update.mutate(statusPatch('watched'))}
    >
      {update.isPending ? <Loader2 className="animate-spin" /> : <Check />}
      Marquer comme vu
    </Button>
  )
}
