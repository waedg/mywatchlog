import { Check, HardDrive } from 'lucide-react'

import { apiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

import type { LibraryItem } from './group'
import { useUpdateUserTitle } from './useLibrary'

/** Case « J'ai une copie » : indique si l'on possède un fichier de ce titre (disque, NAS…). */
export default function CopyToggle({ entry }: { entry: LibraryItem }) {
  const update = useUpdateUserTitle({ id: entry.id, type: entry.type })

  return (
    <div className="space-y-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={entry.hasCopy}
        disabled={update.isPending}
        onClick={() => update.mutate({ has_copy: !entry.hasCopy })}
        className="flex items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
      >
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors',
            entry.hasCopy ? 'border-primary bg-primary text-primary-foreground' : 'bg-secondary/40',
          )}
        >
          {entry.hasCopy && <Check className="size-4" />}
        </span>
        <span className="flex items-center gap-2 text-sm">
          <HardDrive className="size-4 text-muted-foreground" />
          J'ai une copie de ce {entry.type === 'movie' ? 'film' : 'série'}
        </span>
      </button>
      {update.isError && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(update.error)}
        </p>
      )}
    </div>
  )
}
