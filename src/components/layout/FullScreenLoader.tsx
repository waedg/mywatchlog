import { Clapperboard } from 'lucide-react'

export default function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Chargement">
      <span className="flex size-12 animate-pulse items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Clapperboard className="size-6" />
      </span>
    </div>
  )
}
