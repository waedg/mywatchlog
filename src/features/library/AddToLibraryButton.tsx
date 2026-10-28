import { Check, Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api-error'
import type { SearchResult } from '../../../shared/tmdb-types'

import { useAddToLibrary } from './useLibrary'

interface Props {
  item: Pick<SearchResult, 'id' | 'type'>
  inLibrary: boolean
}

export default function AddToLibraryButton({ item, inLibrary }: Props) {
  const add = useAddToLibrary()

  if (inLibrary) {
    return (
      <Button variant="secondary" size="sm" disabled className="w-full">
        <Check />
        Dans ma liste
      </Button>
    )
  }

  return (
    <div className="space-y-1">
      <Button size="sm" className="w-full" disabled={add.isPending} onClick={() => add.mutate(item)}>
        {add.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
        Ajouter
      </Button>
      {add.isError && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(add.error)}
        </p>
      )}
    </div>
  )
}
