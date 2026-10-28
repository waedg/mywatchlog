import { Search } from 'lucide-react'

import EmptyState from '@/components/layout/EmptyState'

export default function SearchPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Recherche</h1>
      <EmptyState
        icon={Search}
        title="La recherche arrive bientôt"
        description="Tu pourras chercher un film ou une série et l'ajouter à ta liste."
      />
    </section>
  )
}
