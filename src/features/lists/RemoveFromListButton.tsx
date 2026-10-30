import { Loader2, Minus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api-error'
import type { MediaType } from '../../../shared/tmdb-types'

import { useTakeFromList } from './useLists'

/** Retire un titre de la collection (le titre reste dans Ma liste et dans les autres collections). */
export default function RemoveFromListButton({
  listId,
  item,
  online,
}: {
  listId: string
  item: { id: number; type: MediaType; title: string }
  online: boolean
}) {
  const take = useTakeFromList()
  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={!online || take.isPending}
        aria-label={`Retirer ${item.title} de la collection`}
        onClick={() => take.mutate({ listId, ref: { id: item.id, type: item.type } })}
      >
        {take.isPending ? <Loader2 className="animate-spin" /> : <Minus />}
        Retirer
      </Button>
      {take.isError && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(take.error)}
        </p>
      )}
    </div>
  )
}
