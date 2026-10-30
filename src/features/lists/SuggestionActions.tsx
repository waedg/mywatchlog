import { FolderPlus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import { apiErrorMessage } from '@/lib/api-error'
import type { MediaType } from '../../../shared/tmdb-types'

import { useAddSuggestionToList } from './useLists'

interface Props {
  listId: string
  item: { id: number; type: MediaType; title: string }
  inLibrary: boolean
}

/** Deux actions sur une suggestion : l'ajouter à la collection (et à Ma liste si besoin), ou seulement à Ma liste. */
export default function SuggestionActions({ listId, item, inLibrary }: Props) {
  const add = useAddSuggestionToList()
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Button
          size="sm"
          className="w-full"
          disabled={add.isPending}
          aria-label={`Ajouter ${item.title} à la collection`}
          onClick={() => add.mutate({ listId, ref: { id: item.id, type: item.type }, inLibrary })}
        >
          {add.isPending ? <Loader2 className="animate-spin" /> : <FolderPlus />}
          Ajouter à la collection
        </Button>
        {add.isError && (
          <p role="alert" className="text-xs text-destructive">
            {apiErrorMessage(add.error)}
          </p>
        )}
      </div>
      <AddToLibraryButton item={item} inLibrary={inLibrary} />
    </div>
  )
}
