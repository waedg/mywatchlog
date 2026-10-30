import { useState, type FormEvent } from 'react'
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiErrorMessage } from '@/lib/api-error'

import type { ListSummary } from './derive'
import { LIST_NAME_MAX } from './names'
import PosterStrip from './PosterStrip'
import { useListActions } from './useLists'

/** Carte d'une collection : mosaïque, nom, nombre de titres, renommer et supprimer (avec confirmation). */
export default function ListCard({ list, online }: { list: ListSummary; online: boolean }) {
  const { rename, remove } = useListActions()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [name, setName] = useState(list.name)

  const error = rename.error ?? remove.error
  const busy = rename.isPending || remove.isPending

  const startEditing = () => {
    setName(list.name)
    rename.reset()
    setConfirming(false)
    setEditing(true)
  }
  const stopEditing = () => {
    setEditing(false)
    rename.reset()
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim() === list.name) return stopEditing()
    rename.mutate({ id: list.id, name }, { onSuccess: () => setEditing(false) })
  }

  return (
    <article className="space-y-3 rounded-2xl border bg-card p-3 shadow-sm">
      <PosterStrip posters={list.previews} />

      {editing ? (
        <form onSubmit={submit} onKeyDown={(event) => event.key === 'Escape' && stopEditing()} className="space-y-2">
          <Input
            autoFocus
            aria-label={`Nouveau nom de la collection ${list.name}`}
            value={name}
            maxLength={LIST_NAME_MAX}
            onChange={(event) => {
              setName(event.target.value)
              if (rename.isError) rename.reset()
            }}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || name.trim().length === 0}>
              {rename.isPending ? <Loader2 className="animate-spin" /> : <Check />}
              Enregistrer
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={stopEditing}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-snug [overflow-wrap:anywhere]">{list.name}</h3>
            <p className="text-xs text-muted-foreground">
              {list.itemCount === 0 ? 'Aucun titre' : `${list.itemCount} titre${list.itemCount > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" className="size-8" aria-label={`Renommer ${list.name}`} disabled={!online || busy} onClick={startEditing}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              aria-label={`Supprimer ${list.name}`}
              disabled={!online || busy}
              onClick={() => {
                remove.reset()
                setConfirming(true)
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      )}

      {confirming && !editing && (
        <div role="alertdialog" aria-label={`Confirmer la suppression de ${list.name}`} className="space-y-3 rounded-xl border border-destructive/40 p-3">
          <p className="text-sm">
            Supprimer la collection « {list.name} » ? Ses titres restent dans Ma liste et dans les autres collections.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => remove.mutate(list.id)}>
              {remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Supprimer
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
              <X />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(error)}
        </p>
      )}
    </article>
  )
}
