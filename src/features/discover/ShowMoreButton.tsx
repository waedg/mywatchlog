import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { remainingAfter } from './forYou'

interface Props {
  /** Nombre total de résultats disponibles (après filtres). */
  total: number
  pages: number
  onMore: () => void
}

/** Affiche la tranche suivante de suggestions ; absent quand tout est déjà visible. */
export default function ShowMoreButton({ total, pages, onMore }: Props) {
  const { hidden, next } = remainingAfter(total, pages)
  if (hidden === 0) return null
  return (
    <div className="flex justify-center">
      <Button variant="outline" onClick={onMore}>
        <ChevronDown />
        Voir plus ({next})
      </Button>
    </div>
  )
}
