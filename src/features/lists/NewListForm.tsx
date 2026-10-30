import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiErrorMessage } from '@/lib/api-error'

import { LIST_NAME_MAX } from './names'
import { useListActions } from './useLists'

/** Création d'une collection : champ de saisie en ligne (Entrée pour valider, Échap pour annuler). */
export default function NewListForm({ onDone }: { onDone: () => void }) {
  const { create } = useListActions()
  const [name, setName] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(name, { onSuccess: onDone })
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => event.key === 'Escape' && onDone()}
      className="space-y-3 rounded-2xl border p-4"
    >
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Nom de la nouvelle collection</span>
        <Input
          autoFocus
          value={name}
          maxLength={LIST_NAME_MAX}
          placeholder="Ex. : À voir en famille"
          onChange={(event) => {
            setName(event.target.value)
            if (create.isError) create.reset()
          }}
        />
      </label>
      {create.isError && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(create.error)}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={create.isPending || name.trim().length === 0}>
          {create.isPending && <Loader2 className="animate-spin" />}
          Créer
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
