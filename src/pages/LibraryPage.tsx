import { Library } from 'lucide-react'

import EmptyState from '@/components/layout/EmptyState'

export default function LibraryPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ma liste</h1>
      <EmptyState
        icon={Library}
        title="Ta liste est vide"
        description="Les films et séries que tu ajouteras apparaîtront ici, classés par statut."
      />
    </section>
  )
}
