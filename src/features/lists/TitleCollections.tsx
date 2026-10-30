import { useState } from 'react'
import { Check, Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiErrorMessage } from '@/lib/api-error'
import { useOnline } from '@/hooks/useOnline'
import { cn } from '@/lib/utils'
import type { MediaType } from '../../../shared/tmdb-types'

import { buildSummaries, listsContaining, type ListSummary } from './derive'
import { MAX_LISTS } from './names'
import NewListForm from './NewListForm'
import { useAddToList, useLists, useTakeFromList } from './useLists'

interface Props {
  id: number
  type: MediaType
}

/** Section « Collections » de la fiche : coche les collections qui contiennent le titre, ou en crée une sur place. */
export default function TitleCollections({ id, type }: Props) {
  const lists = useLists()
  const online = useOnline()
  const add = useAddToList()
  const [creating, setCreating] = useState(false)
  const ref = { id, type }

  const summaries = lists.data ? buildSummaries(lists.data) : []
  const member = lists.data ? listsContaining(lists.data, ref) : new Set<string>()
  const full = summaries.length >= MAX_LISTS

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Collections {member.size > 0 && <span className="text-muted-foreground">{member.size}</span>}
        </h2>
        {lists.isSuccess && !creating && (
          <Button size="sm" variant="outline" className="rounded-full" disabled={!online || full} onClick={() => setCreating(true)}>
            <Plus />
            Nouvelle
          </Button>
        )}
      </div>

      {lists.isPending && lists.fetchStatus !== 'paused' && <Skeleton className="h-10 w-full" aria-busy="true" />}

      {lists.isPending && lists.fetchStatus === 'paused' && (
        <p className="text-sm text-muted-foreground">Hors connexion : tes collections ne sont pas encore disponibles sur cet appareil.</p>
      )}

      {lists.isError && (
        <div role="alert" className="flex items-center justify-between gap-3 text-sm">
          <span>Impossible de charger tes collections.</span>
          <Button variant="outline" size="sm" onClick={() => void lists.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {creating && (
        <NewListForm
          onDone={() => setCreating(false)}
          // La collection créée sur place reçoit aussitôt le titre.
          onCreated={(list) => add.mutate({ listId: list.id, ref })}
        />
      )}

      {lists.isSuccess && summaries.length === 0 && !creating && (
        <p className="text-sm text-muted-foreground">Aucune collection pour le moment. Crée-en une pour y ranger ce titre.</p>
      )}

      {lists.isSuccess && summaries.length > 0 && (
        <ul className="space-y-1.5">
          {summaries.map((list) => (
            <CollectionRow key={list.id} list={list} ref_={ref} active={member.has(list.id)} online={online} />
          ))}
        </ul>
      )}

      {add.isError && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(add.error)}
        </p>
      )}
      {lists.isSuccess && !online && <p className="text-xs text-muted-foreground">Hors connexion : les collections sont en lecture seule.</p>}
    </div>
  )
}

function CollectionRow({ list, ref_, active, online }: { list: ListSummary; ref_: { id: number; type: MediaType }; active: boolean; online: boolean }) {
  const add = useAddToList()
  const take = useTakeFromList()
  const pending = add.isPending || take.isPending
  const error = add.error ?? take.error

  return (
    <li className="space-y-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={active}
        disabled={!online || pending}
        onClick={() => (active ? take.mutate({ listId: list.id, ref: ref_ }) : add.mutate({ listId: list.id, ref: ref_ }))}
        className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
      >
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md border',
            active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background',
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : active && <Check className="size-4" />}
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium [overflow-wrap:anywhere]">{list.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{list.itemCount}</span>
      </button>
      {error && (
        <p role="alert" className="px-1 text-xs text-destructive">
          {apiErrorMessage(error)}
        </p>
      )}
    </li>
  )
}
