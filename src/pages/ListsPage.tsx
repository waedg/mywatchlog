import { useState } from 'react'
import { ListPlus, Plus, WifiOff } from 'lucide-react'

import EmptyState from '@/components/layout/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import LibraryTabs from '@/features/library/LibraryTabs'
import { buildSummaries } from '@/features/lists/derive'
import ListCard from '@/features/lists/ListCard'
import NewListForm from '@/features/lists/NewListForm'
import { useLists } from '@/features/lists/useLists'
import { MAX_LISTS } from '@/features/lists/names'
import { useOnline } from '@/hooks/useOnline'

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

export default function ListsPage() {
  const lists = useLists()
  const online = useOnline()
  const [creating, setCreating] = useState(false)

  const summaries = lists.data ? buildSummaries(lists.data) : []
  const full = summaries.length >= MAX_LISTS

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ma liste</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <LibraryTabs />
        {lists.isSuccess && !creating && (
          <Button size="sm" className="rounded-full" disabled={!online || full} onClick={() => setCreating(true)}>
            <Plus />
            Nouvelle collection
          </Button>
        )}
      </div>

      {lists.isSuccess && !online && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <WifiOff className="size-3.5" />
          Hors connexion : tes collections sont en lecture seule.
        </p>
      )}
      {lists.isSuccess && full && <p className="text-xs text-muted-foreground">Tu as atteint la limite de {MAX_LISTS} collections.</p>}

      {creating && <NewListForm onDone={() => setCreating(false)} />}

      {lists.isPending && lists.fetchStatus === 'paused' && (
        <EmptyState
          icon={WifiOff}
          title="Hors connexion"
          description="Tes collections n'ont pas encore été enregistrées sur cet appareil. Reconnecte-toi une première fois."
        />
      )}

      {lists.isPending && lists.fetchStatus !== 'paused' && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      )}

      {lists.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-12 text-center">
          <p className="text-sm">Impossible de charger tes collections.</p>
          <Button variant="outline" onClick={() => void lists.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {lists.isSuccess && summaries.length === 0 && !creating && (
        <EmptyState
          icon={ListPlus}
          title="Aucune collection"
          description="Crée une collection pour grouper des films et des séries, par exemple « À voir en famille »."
        />
      )}

      {lists.isSuccess && summaries.length > 0 && (
        <div className={GRID}>
          {summaries.map((list) => (
            <ListCard key={list.id} list={list} online={online} />
          ))}
        </div>
      )}
    </section>
  )
}
