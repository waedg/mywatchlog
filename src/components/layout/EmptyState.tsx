import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
        <Icon className="size-7" />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
